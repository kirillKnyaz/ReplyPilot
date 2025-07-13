# ReplyPilot: AI-Powered Sales Generator

## Overview
ReplyPilot is a SaaS application that helps users automate and optimize their outbound sales strategy using AI. The platform integrates intelligent lead sourcing, reply tracking, and message optimization to continuously improve outreach effectiveness.

---

## Core Features

### 1. **User Onboarding & CRM Dashboard**
- Secure account creation and login (JWT-based)
- Stripe-based subscription tiers
- Initial onboarding form to define ICP and niche
- Central dashboard for managing leads, campaigns, and performance analytics

### 2. **Lead Prospecting**
- Scrapes potential prospects using:
  - Google Places API
  - Custom Google Search + Puppeteer scraping
- Parses business name, website, contact data, and context
- AI-assisted lead scoring and prioritization

### 3. **Message Crafting**
- AI-generated cold messages based on ICP and business profile
- Edit/approve workflow
- Message bank organized by persona/niche

### 4. **Conversation Tracking**
- Chrome extension monitors reply boxes (LinkedIn, Gmail, etc.)
- Injects clipboard-style AI messages
- Detects replies and sends data to backend
- Records reply rate, sentiment, and response delay

### 5. **Reply Analysis**
- Categorizes replies: interested / soft no / ghosted / irrelevant
- Analyzes which messages and niches perform best
- Provides suggestions for new campaigns or reworked messaging

### 6. **Feedback Loop & AI Mindset Shift**
- When reply rates drop:
  - Suggests new niche/ICP based on best past results
  - Regenerates messages with new tone/style
  - Adjusts lead filtering rules

---

## Technical Stack
- **Frontend**: React, Tailwind, Zustand/Context
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Browser Extension**: Manifest V3 + Webpack
- **Scraper Service**: Puppeteer (standalone worker)
- **AI**: OpenAI / Gemini + LangChain
- **Scheduling**: BullMQ + Redis
- **Hosting**: Railway / Fly.io / Vercel

---

## Integrations
- Stripe (billing)
- OpenAI API (message generation + NLP)
- Google Places + Custom Search API (prospect search)
- Gmail API (email tracking - future)

---

## Security & Compliance
- JWT + HTTPS
- CORS policies and rate limiting
- Encrypted message storage
- GDPR opt-out flow for scraped contacts

---

## Outcome
ReplyPilot helps solo founders, marketers, and salespeople generate consistent leads, test messages, and adapt their outreach based on real-world performance — with minimal manual effort.

