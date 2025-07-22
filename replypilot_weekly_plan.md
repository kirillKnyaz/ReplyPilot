# ReplyPilot: Week-by-Week Build Plan

## Week 1: Foundation & Setup
Set up the project structure and core systems.
- Create a monorepo with Vite (React) for frontend and Express (Node.js) for backend ✅
- Initialize PostgreSQL database and configure Prisma ORM ✅
- Implement JWT-based authentication system ✅
- Build initial onboarding form (niche/ICP questions) ✅
- Set up Stripe test mode for subscription tiers ✅
- Deploy backend to Railway and frontend to Vercel for CI/CD foundation ✅

## Week 2: Lead Scraper MVP 🟡
Build the first working version of the scraping engine.
- Integrate Google Places API and Custom Search API
- Set up a Puppeteer worker to scrape website content and contact data
- Create a job queue system using BullMQ + Redis for queued scraping jobs
- Add UI in the frontend to trigger manual scrapes and display results
- Store scraped leads in DB with score and metadata

## Week 3: Message Engine
Build the AI-powered message generation interface.
- Connect OpenAI/Gemini to generate cold messages based on leads and user input
- Create editable UI component to review and refine messages
- Store generated messages and allow tagging/grouping by campaign/niche
- Implement a way to log sent messages (manual for now)

## Week 4: Browser Extension Alpha
Develop and test the first version of the Chrome extension.
- Create a Manifest V3 extension that targets Gmail, LinkedIn, and Messenger
- Inject a clipboard message UI that offers one-click copying
- Detect reply messages using MutationObserver and regex
- Securely send reply metadata back to backend via API

## Week 5: Reply Tracking & Feedback Engine
Start turning reply data into actionable insights.
- Store replies with timestamps, sentiment, and categorized labels (interested, ghosted, etc.)
- Show basic campaign performance metrics on the dashboard
- Implement AI feedback logic: when reply rates drop, generate new tone/niche suggestions
- Allow user to regenerate messages based on this AI guidance

## Week 6: Launch-Ready Polish
Finalize MVP, clean UX, and get ready for launch.
- Build analytics panel: reply rate, ghosted %, message success rate
- Improve extension UX: style popup, bugfix site targeting
- Enforce API security (rate limits, validation, sanitized input)
- Integrate PostHog or Sentry for usage/error logging
- Write onboarding documentation, test extension distribution, and begin manual outreach to beta users

