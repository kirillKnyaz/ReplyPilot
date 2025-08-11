import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import pLimit from 'p-limit';
import Papa from 'papaparse';
import { Client } from '@googlemaps/google-maps-services-js';
import OpenAI from 'openai';

/**
 * High-level flow
 * 1) Load place_ids
 * 2) For each place_id: get Place Details (website, name, phone, rating, etc.)
 * 3) If website present: fetch HTML, extract heuristics (forms, CTAs, pixels, metadata, load size, etc.)
 * 4) Summarize into a compact prompt and ask GPT for a JSON audit (weak points + prioritized fixes)
 * 5) Save to JSON + CSV
 */

// --- Config ---
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_CONCURRENCY = Number(process.env.MAX_CONCURRENCY || 5);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 20000);

// Basic guards
if (!GOOGLE_MAPS_API_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY in .env');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env');
  process.exit(1);
}

const mapsClient = new Client({});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const PLACE_FIELDS = [
  'place_id',
  'name',
  'formatted_address',
  'formatted_phone_number',
  'international_phone_number',
  'website',
  'url',
  'rating',
  'user_ratings_total',
  'opening_hours',
  'types'
].join(',');

// --- Helpers ---

/**
 * Fetch Google Place Details for a given place_id.
 */
async function fetchPlaceDetails(placeId) {
  try {
    const resp = await mapsClient.placeDetails({
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: PLACE_FIELDS
      },
      timeout: REQUEST_TIMEOUT_MS
    });
    if (resp.data.status !== 'OK') {
      throw new Error(`Place Details error: ${resp.data.status}`);
    }
    return resp.data.result;
  } catch (err) {
    console.error(`[PlaceDetails] ${placeId}:`, err.message);
    return null;
  }
}

/**
 * Fetch a URL with basic metrics (size, time).
 * Use axios to keep it simple; for heavy JS sites, you could swap to Puppeteer later.
 */
async function fetchSite(url) {
  const started = Date.now();
  try {
    const resp = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36'
      },
      maxRedirects: 5,
      // Basic safeguard to avoid downloading megabytes of assets unintentionally
      validateStatus: (s) => s >= 200 && s < 400
    });

    const html = resp.data || '';
    const loadMs = Date.now() - started;
    const sizeBytes = Buffer.byteLength(html, 'utf8');

    return { html, loadMs, sizeBytes, finalUrl: resp.request?.res?.responseUrl || url };
  } catch (err) {
    return { html: '', loadMs: Date.now() - started, sizeBytes: 0, finalUrl: url, error: err.message };
  }
}

/**
 * Extract quick heuristics from HTML using cheerio.
 * We focus on conversion + tracking signals relevant to med spas.
 */
function extractHeuristics(html, url) {
  if (!html) {
    return {
      hasForm: false,
      hasPhoneLink: false,
      hasBooking: false,
      hasChatWidget: false,
      hasMetaPixel: false,
      hasGoogleAnalytics: false,
      hasGtag: false,
      hasGA4: false,
      hasMetaViewport: false,
      h1Count: 0,
      primaryCtas: [],
      socialLinks: [],
      titleLength: 0,
      metaDescriptionLength: 0,
      headingsSample: [],
      formsSample: []
    };
  }

  const $ = cheerio.load(html);

  const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000); // small slice for prompt
  const title = $('title').text() || '';
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const hasMetaViewport = $('meta[name="viewport"]').length > 0;

  // Basic conversion elements
  const hasPhoneLink = $('a[href^="tel:"]').length > 0;
  const hasBooking =
    $('a[href*="book"] , a[href*="appointment"], a[href*="schedule"], button:contains("Book"), button:contains("Schedule")').length >
    0 ||
    $('form[action*="book"]').length > 0;
  const hasForm = $('form').length > 0;
  const hasChatWidget =
    $('iframe[src*="chat"], script[src*="chat"], div[id*="chat"], div[class*="chat"]').length > 0;

  // Tracking pixels
  const scripts = $('script')
    .map((_, el) => $(el).html() || $(el).attr('src') || '')
    .get()
    .join('\n');
  const hasMetaPixel = /fbq\(|facebook\.com\/tr/i.test(scripts);
  const hasGtag = /gtag\(/i.test(scripts) || /www.googletagmanager.com\/gtag\/js/i.test(scripts);
  const hasGoogleAnalytics = /ga\(/i.test(scripts) || /google-analytics.com\/analytics.js/i.test(scripts);
  const hasGA4 = /G-\w{6,}/.test(scripts); // crude GA4 detection from measurement IDs

  // Primary CTAs (top-level buttons/links)
  const primaryCtas = [];
  $('a, button').each((_, el) => {
    const txt = $(el).text().trim().toLowerCase();
    if (!txt) return;
    if (/(book|call|schedule|consult|free|offer|special|appointment)/i.test(txt)) {
      primaryCtas.push(txt.slice(0, 80));
    }
  });

  // Social links
  const socialLinks = [];
  $('a[href]').each((_, el) => {
    const href = String($(el).attr('href'));
    if (/instagram\.com|facebook\.com|tiktok\.com|youtube\.com|twitter\.com|x\.com/i.test(href)) {
      socialLinks.push(href);
    }
  });

  // Headings & forms (sample for context)
  const h1Count = $('h1').length;
  const headingsSample = $('h1, h2').map((_, el) => $(el).text().trim().slice(0, 120)).get().slice(0, 8);

  const formsSample = $('form')
    .map((_, el) => {
      const action = $(el).attr('action') || '';
      const inputs = $(el)
        .find('input, select, textarea, button[type="submit"]')
        .map((_, el2) => ($(el2).attr('name') || $(el2).attr('type') || $(el2).text()).trim().slice(0, 40))
        .get();
      return { action: action.slice(0, 200), inputs: inputs.slice(0, 10) };
    })
    .get()
    .slice(0, 3);

  return {
    text,
    title,
    metaDesc,
    hasMetaViewport,
    hasPhoneLink,
    hasBooking,
    hasForm,
    hasChatWidget,
    hasMetaPixel,
    hasGtag,
    hasGoogleAnalytics,
    hasGA4,
    h1Count,
    primaryCtas: [...new Set(primaryCtas)].slice(0, 10),
    socialLinks: [...new Set(socialLinks)].slice(0, 10),
    titleLength: title.length,
    metaDescriptionLength: metaDesc.length,
    headingsSample,
    formsSample
  };
}

/**
 * Ask GPT to turn heuristics + place details into a concise JSON audit.
 */
async function gptAudit({ place, urlInfo, heuristics }) {
  const system = `You are a CRO and local-service lead generation expert focused on aesthetic clinics (med spas).
Return ONLY JSON. Do not include commentary.`;

  const user = {
    placeSnapshot: {
      name: place?.name,
      address: place?.formatted_address,
      phone: place?.formatted_phone_number || place?.international_phone_number,
      website: place?.website,
      rating: place?.rating,
      reviewCount: place?.user_ratings_total,
      types: place?.types
    },
    fetchMetrics: {
      finalUrl: urlInfo?.finalUrl,
      loadMs: urlInfo?.loadMs,
      sizeBytes: urlInfo?.sizeBytes,
      hadError: Boolean(urlInfo?.error)
    },
    heuristics
  };

  const prompt = `
Return a compact JSON object advising how to increase qualified bookings for this med spa in 30 days.
Focus on: lead capture, booking friction, speed-to-lead, follow-up automation, and tracking.

JSON schema:
{
  "weak_points": [ { "issue": string, "why_it_matters": string, "evidence": string } ],
  "quick_wins": [ { "action": string, "expected_impact": string } ],
  "tracking_gaps": [ string ],
  "ad_angle": string,
  "landing_offer": string,
  "priority_score_0to100": number,
  "priority_reason": string
}

Consider: presence of forms/booking, tel links, chat, pixels (Meta/GA/GA4), mobile meta viewport, page load size/time, CTAs, headings, social proof (reviews), and any obvious gaps from the snapshot.

Place snapshot + heuristics:
${JSON.stringify(user, null, 2)}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ]
    });

    const content = completion.choices?.[0]?.message?.content;
    return JSON.parse(content || '{}');
  } catch (err) {
    console.error('[GPT Audit Error]', err.message);
    return {
      weak_points: [{ issue: 'GPT_error', why_it_matters: err.message, evidence: '' }],
      quick_wins: [],
      tracking_gaps: [],
      ad_angle: '',
      landing_offer: '',
      priority_score_0to100: 0,
      priority_reason: 'GPT error'
    };
  }
}

/**
 * Process a single place_id end-to-end.
 */
async function processPlaceId(placeId) {
  const place = await fetchPlaceDetails(placeId);
  if (!place) return null;

  const website = place.website;
  let urlInfo = { finalUrl: '', loadMs: 0, sizeBytes: 0, error: 'no_website' };
  let heuristics = {};

  if (website) {
    urlInfo = await fetchSite(website);
    heuristics = extractHeuristics(urlInfo.html, urlInfo.finalUrl);
  }

  const audit = await gptAudit({ place, urlInfo, heuristics });

  return {
    place_id: place.place_id,
    name: place.name || '',
    address: place.formatted_address || '',
    phone: place.formatted_phone_number || place.international_phone_number || '',
    website: website || '',
    rating: place.rating || '',
    user_ratings_total: place.user_ratings_total || 0,
    url_final: urlInfo.finalUrl || '',
    load_ms: urlInfo.loadMs || 0,
    size_bytes: urlInfo.sizeBytes || 0,
    fetch_error: urlInfo.error || '',
    has_form: heuristics.hasForm || false,
    has_booking: heuristics.hasBooking || false,
    has_phone_link: heuristics.hasPhoneLink || false,
    has_chat: heuristics.hasChatWidget || false,
    has_meta_viewport: heuristics.hasMetaViewport || false,
    has_meta_pixel: heuristics.hasMetaPixel || false,
    has_gtag: heuristics.hasGtag || false,
    has_ga: heuristics.hasGoogleAnalytics || false,
    has_ga4: heuristics.hasGA4 || false,
    title_length: heuristics.titleLength || 0,
    meta_desc_length: heuristics.metaDescriptionLength || 0,
    h1_count: heuristics.h1Count || 0,
    primary_ctas: (heuristics.primaryCtas || []).join(' | '),
    social_links: (heuristics.socialLinks || []).join(' | '),
    headings_sample: (heuristics.headingsSample || []).join(' | '),
    audit_json: audit // keep full JSON for downstream use
  };
}

/**
 * Save output as both JSON (rich) and CSV (for scanning).
 */
async function saveOutputs(rows) {
  // JSON (full)
  const jsonPath = path.resolve('output_full.json');
  await fs.writeFile(jsonPath, JSON.stringify(rows, null, 2), 'utf8');

  // CSV (flattened)
  const flat = rows.map((r) => ({
    place_id: r.place_id,
    name: r.name,
    website: r.website,
    rating: r.rating,
    reviews: r.user_ratings_total,
    load_ms: r.load_ms,
    size_kb: Math.round((r.size_bytes || 0) / 1024),
    has_form: r.has_form,
    has_booking: r.has_booking,
    has_phone_link: r.has_phone_link,
    has_chat: r.has_chat,
    has_pixel: r.has_meta_pixel,
    has_ga4: r.has_ga4,
    priority_score: r.audit_json?.priority_score_0to100 ?? '',
    top_weak_point: r.audit_json?.weak_points?.[0]?.issue ?? '',
    quick_win_1: r.audit_json?.quick_wins?.[0]?.action ?? ''
  }));

  const csv = Papa.unparse(flat, { quotes: true });
  const csvPath = path.resolve('output_summary.csv');
  await fs.writeFile(csvPath, csv, 'utf8');

  console.log(`\nSaved:\n- ${jsonPath}\n- ${csvPath}`);
}

/**
 * Main
 */
async function main() {
  const raw = await fs.readFile(path.resolve('place_ids.json'), 'utf8');
  const placeIds = JSON.parse(raw);

  if (!Array.isArray(placeIds) || placeIds.length === 0) {
    console.error('place_ids.json is empty or invalid.');
    process.exit(1);
  }

  const limit = pLimit(MAX_CONCURRENCY);
  const tasks = placeIds.map((pid) =>
    limit(() => processPlaceId(pid).catch((e) => (console.error('[processPlaceId]', e.message), null)))
  );

  const results = (await Promise.all(tasks)).filter(Boolean);

  // Sort by GPT priority (desc) to show hottest opportunities first
  results.sort((a, b) => (b.audit_json?.priority_score_0to100 || 0) - (a.audit_json?.priority_score_0to100 || 0));

  await saveOutputs(results);

  // Quick console preview
  for (const r of results.slice(0, 10)) {
    console.log(
      `\n${r.name} | ${r.website}\nScore: ${r.audit_json?.priority_score_0to100} ` +
        `| Booking:${r.has_booking ? 'Y' : 'N'} | Form:${r.has_form ? 'Y' : 'N'} | Pixel:${r.has_meta_pixel ? 'Y' : 'N'}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});