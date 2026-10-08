# ⚡ CreatorForge — AI Creative Marketplace & Director Platform

> **Where World-Class Brands Meet Elite Generative AI Directors & Visual Artists.**  
> Live Production URL: **[https://mk-eight-chi.vercel.app](https://mk-eight-chi.vercel.app)**

---

## 🌟 Overview

**CreatorForge** is an enterprise-grade marketplace and directory platform engineered specifically for the generative AI era. Unlike traditional freelance platforms (Upwork, Fiverr) built for manual design workflows, CreatorForge is purpose-built for the cutting-edge generative video, 3D synthetic visual, and AI cinematography ecosystem (Runway Gen-3, Midjourney v6, Sora, ElevenLabs, ComfyUI).

---

## 🚀 Unique Features Implemented

### 1. 🏢 Role-Partitioned Dual-Auth Architecture (Zero Credential Collision)
- **Role Isolation**: Strict isolation between **Brand** (`Apex Studios`, etc.) and **Creator** accounts (`Alex Rivera`, `Maya Lin`, etc.).
- **Collision Protection**: If a user tries logging into the wrong role tab, the system warns them without destroying their stored credentials.
- **Supabase Cloud Sync**: Every registration and sign-in calls `/api/auth/sync-user` to write and update standard UUID records directly in `public.users` and `public.creator_profiles`.

### 2. 💬 Real-Time 2-Way Chat System with Media Attachments
- **Universal Messaging**: Any user (Brands, Creators, or Visitors) can initiate direct conversation before formal onboarding.
- **Image Sharing & Lightbox**: Send reference frames, moodboards, and camera renders in chat with thumbnail previews and full-screen image expander.
- **Human 2-Way Communication**: Direct peer-to-peer conversation without automated bot disruption.
- **Supabase Cloud Persistence**: Backed by `public.chat_threads` and `public.chat_messages` tables.

### 3. 📋 Infinite Brief Creation Engine (Localized Currency: ₹ INR)
- **Zero-Redirect Posting**: Brands can submit a creative campaign brief and immediately click `+ Post Another Brief` to publish infinite briefs without ever being kicked to a different page.
- **Rupee-First Localization**: Standardized budget inputs, review steps, and brief listings with `₹` (e.g., `Budget Min (₹)`, `Budget Max (₹)`).
- **Relational Integrity**: Enforces valid brand UUID foreign keys against `public.users` with automated fallback to verified brand partners.

### 4. 🎯 Interactive Brief Application & Proposal Bidding
- **Modal Proposal Workflow**: Creators click **Apply Now** to open a dedicated bidding modal containing their custom rate (`₹ INR`), delivery timeline (days), and creative pitch.
- **Database Engagement**: Inserts applications directly into `public.engagements` with `status: 'applied'` and proposal notes.
- **State Feedback**: Instantly badges brief cards with `Applied ✓` to provide clear visual confirmation.

### 5. 📂 Resilient Portfolio Showcase & Cloud Storage
- **Supabase Storage Integration**: Connects to the public `portfolio-media` storage bucket for raw file uploads.
- **Fault-Tolerant Preview Fallback**: If network or storage issues occur, client-side data URLs preserve the creation experience so creators never lose their work.
- **Verified Stack Badges**: Highlights mastered tools (Midjourney, Runway Gen-3, Topaz, ComfyUI) with custom glass tags.

### 6. 📊 100% Dynamic Dashboards & Homepage
- **Zero Mock Data**: Replaced all hardcoded metrics (`2,400+`, etc.) with live Supabase database queries.
- **Live Creator Showcase**: Homepage dynamically queries and displays real creator profiles, project counts, and ratings directly from `public.creator_profiles`.

---

## 🤖 Standalone AI Features Implemented

All AI features connect securely via Next.js server-side API routes using **Google Gemini 3.5 Flash** (`models/gemini-3.5-flash`), ensuring **zero frontend API key exposure**.

### 1. 🪄 AI Brief Builder & Decomposition
- **Location**: `/briefs/create` (Step 1)
- **Functionality**: Brands type a rough, casual idea (e.g., *"We need a cyberpunk perfume commercial for TikTok"*). Gemini decomposes it into:
  - Professional campaign title
  - High-converting brief description
  - Optimized aspect ratio (`9:16`, `16:9`)
  - Curated visual style tags (`Cinematic`, `Surreal`, `Cyberpunk`)
  - Target deliverables and commercial rights recommendation

### 2. ✨ AI Proposal & Pitch Generator
- **Location**: `/briefs` (Inside `ApplyBriefModal`)
- **Functionality**: Creators click `✨ Write Pitch with AI` to analyze the brand's campaign description and generate a tailored, professional proposal highlighting their specific generative pipeline, tools, and turnaround time.

### 3. 🔍 AI Creator Matchmaking Recommendations
- **Location**: `/briefs/create` (Post-submission modal)
- **Functionality**: Right after a brand posts a brief, the AI matchmaking engine analyzes the brief's style tags and content type, calculates percentage match scores (e.g., `98% Match`), and provides specific fit reasons for suitable creators.

### 4. 📝 AI Workflow & Portfolio Description Generator
- **Location**: `/dashboard/portfolio`
- **Functionality**: Creators can click `✨ Generate with AI` to draft rich visual descriptions and technical prompt workflow notes for each portfolio item.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4 (App Router, Turbopack, React 19) |
| **Styling** | Tailwind CSS with OKLCH Color Tokens & Glassmorphism |
| **Database & Auth** | Supabase (PostgreSQL with Row-Level Security) |
| **Object Storage** | Supabase Storage (`portfolio-media` public bucket) |
| **AI Models** | Google Gemini (`gemini-3.5-flash`, `gemini-3.5-flash-lite`) |
| **Deployment** | Vercel Serverless Edge Platform |

---

## 🗄️ Database Architecture (Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE TABLES                          │
├─────────────────────┬───────────────────────────────────────┤
│ users               │ id, email, role, name, avatar_url     │
│ creator_profiles    │ id, user_id, headline, bio, tools     │
│ portfolio_items     │ id, creator_id, media_url, workflow   │
│ briefs              │ id, brand_id, title, budget, tags     │
│ engagements         │ id, brief_id, creator_id, status      │
│ chat_threads        │ id, creator_id, brand_id, last_msg    │
│ chat_messages       │ id, thread_id, sender_role, media_url │
│ storage.buckets     │ id: 'portfolio-media', public: true   │
└─────────────────────┴───────────────────────────────────────┘
```

---

## 🔮 Future Roadmap & Planned Upgrades

### 1. 🛡️ Cryptographic C2PA Provenance & Seed Verification
- Inspect native image metadata (C2PA / Content Credentials) upon upload.
- Automated seed reproducibility challenge: creators submit their seed + prompt, and the system runs a test generation to mathematically confirm original authorship.

### 2. 🎬 Blind Prompt Casting ("A/B Visual Bake-Off")
- For major enterprise briefs (₹1,00,000+), brands can invite 3 creators to submit a single anonymous 4K test frame based on a benchmark prompt before awarding the full contract.

### 3. 🔒 Smart Milestone Escrow with Automated Watermarking
- Automated diagonal CreatorForge watermark overlay on draft deliverables.
- High-res uncompressed assets unlock automatically when the brand approves milestone escrow release.

### 4. 🧬 Creator LoRA & Fine-Tune Registry
- Allow verified creators to register, license, and host proprietary style LoRAs and character consistency models directly for recurring brand retainers.

### 5. ⚡ Supabase Realtime WebSocket Subscriptions
- Upgrade chat timeline from polling to live Postgres change streaming (`supabase.channel('chat_messages')`).

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/krishnaspectrum08-5110s-projects/mk.git
cd mk

# 2. Install dependencies
npm install

# 3. Configure environment variables in .env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key

# 4. Start Turbopack development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
