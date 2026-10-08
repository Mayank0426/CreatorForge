-- =====================================================
-- CREATORFORGE SUPABASE MIGRATION & SEED SCRIPT
-- Copy & Paste this script into your Supabase Dashboard -> SQL Editor
-- =====================================================

-- 1. ENUMS & TYPES
CREATE TYPE user_role AS ENUM ('creator', 'brand');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified');
CREATE TYPE content_type AS ENUM ('video', 'image', 'animation', 'other');
CREATE TYPE aspect_ratio AS ENUM ('16:9', '9:16', '1:1', 'other');
CREATE TYPE commercial_use_type AS ENUM ('internal-only', 'limited-commercial', 'full-commercial', 'resale');
CREATE TYPE brief_status AS ENUM ('open', 'in-progress', 'delivered', 'closed');
CREATE TYPE engagement_status AS ENUM ('applied', 'shortlisted', 'in-progress', 'delivered', 'completed');

-- 2. TABLES

-- users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'creator',
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- creator_profiles table
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  specializations TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  rating NUMERIC(3,2) DEFAULT 5.0,
  completed_projects_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- portfolio_items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type content_type NOT NULL DEFAULT 'image',
  tools_used TEXT[] DEFAULT '{}',
  workflow_notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- briefs table
CREATE TABLE IF NOT EXISTS public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  campaign_description TEXT NOT NULL,
  content_type content_type NOT NULL DEFAULT 'video',
  style_tags TEXT[] DEFAULT '{}',
  aspect_ratio aspect_ratio NOT NULL DEFAULT '16:9',
  commercial_use_type commercial_use_type NOT NULL DEFAULT 'full-commercial',
  budget_min INT,
  budget_max INT,
  budget_range TEXT,
  deadline DATE,
  status brief_status NOT NULL DEFAULT 'open',
  ai_generated BOOLEAN DEFAULT false,
  raw_ai_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- engagements table
CREATE TABLE IF NOT EXISTS public.engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  status engagement_status NOT NULL DEFAULT 'applied',
  proposal_notes TEXT,
  revision_notes JSONB[] DEFAULT '{}',
  final_deliverable_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read creator_profiles" ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "Public read portfolio_items" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Public read briefs" ON public.briefs FOR SELECT USING (true);
CREATE POLICY "Public read engagements" ON public.engagements FOR SELECT USING (true);

-- Public write access policies (for signup and onboarding)
CREATE POLICY "Public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Public insert creator_profiles" ON public.creator_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update creator_profiles" ON public.creator_profiles FOR UPDATE USING (true);
CREATE POLICY "Public insert portfolio_items" ON public.portfolio_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert briefs" ON public.briefs FOR INSERT WITH CHECK (true);


-- =====================================================
-- DUMMY DATA SEED
-- =====================================================

-- Insert Users
INSERT INTO public.users (id, email, role, name, avatar_url) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'alex.rivera@aiart.io', 'creator', 'Alex Rivera', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'maya.lin@generative.cinema', 'creator', 'Maya Lin', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'kai.takahashi@animeai.jp', 'creator', 'Kai Takahashi', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'brand.apex@studios.com', 'brand', 'Apex Studios', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- Insert Creator Profiles
INSERT INTO public.creator_profiles (id, user_id, headline, bio, specializations, skills, tools_used, verification_status, rating, completed_projects_count) VALUES
('11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Senior AI Film Director & VFX Specialist', 'Pioneering AI generative film production. Over 5 years of traditional VFX combined with Runway Gen-3 and Midjourney workflows.', ARRAY['Product Ads', 'Brand Films', '3D Visualization'], ARRAY['Prompt Engineering', 'Motion Design', 'ComfyUI Workflows'], ARRAY['Runway Gen-3', 'Midjourney v6', 'Stable Diffusion'], 'verified', 4.90, 28),
('22222222-2222-2222-2222-222222222222', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Anime & Character Animation Specialist', 'Crafting expressive anime cinematics and character-driven AI stories. Expert in custom LoRA training for brand mascots.', ARRAY['Anime Animation', 'Character Animation', 'Music Videos'], ARRAY['Character Design', 'LoRA Training', 'Sound Design'], ARRAY['Midjourney v6', 'Kling AI', 'ElevenLabs'], 'verified', 4.80, 19),
('33333333-3333-3333-3333-333333333333', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Generative Visual Artist & Luxury Product Designer', 'Creating photorealistic commercial assets and high-fashion AI imagery.', ARRAY['Product Ads', 'Social Media Content', 'Motion Graphics'], ARRAY['Prompt Engineering', 'AI Upscaling', '3D Modeling'], ARRAY['Sora', 'Midjourney v6', 'Pika Labs'], 'verified', 5.00, 34)
ON CONFLICT (id) DO NOTHING;

-- Insert Portfolio Items
INSERT INTO public.portfolio_items (creator_id, title, description, media_url, media_type, tools_used, workflow_notes, is_verified, is_featured) VALUES
('11111111-1111-1111-1111-111111111111', 'Cyberpunk Neon Genesis — Luxury Perfume Ad', '30-second hyper-realistic commercial combining fluid simulation and glowing neon aesthetics.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', 'image', ARRAY['Runway Gen-3', 'Midjourney v6'], 'Generated base imagery with Midjourney v6. Animated fluid motion in Runway Gen-3 with motion brush.', true, true),
('11111111-1111-1111-1111-111111111111', 'Quantum Leap Brand Anthem', 'Futuristic product reveal featuring holographic UI and glassmorphism animation.', 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80', 'image', ARRAY['Stable Diffusion', 'ComfyUI Workflows'], 'Built custom LoRA trained on product renders. Rendered depth maps in Blender and used ControlNet in ComfyUI.', true, false),
('22222222-2222-2222-2222-222222222222', 'Echoes of Horizon — Anime Teaser', 'Cinematic anime intro scene generated with specialized LoRA models.', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80', 'image', ARRAY['Midjourney v6', 'Kling AI', 'ElevenLabs'], 'Generated 2D anime character concepts in Midjourney, animated facial movement in Kling AI.', true, true),
('33333333-3333-3333-3333-333333333333', 'Ethereal Botanica — Eco Skincare Commercial', 'Organic macro shots of flora turning into golden oil droplets with ultra-soft lighting.', 'https://images.unsplash.com/photo-1608248597263-00079e96576b?w=800&auto=format&fit=crop&q=80', 'image', ARRAY['Sora', 'Midjourney v6'], 'Macro lens bokeh prompt engineering in Sora: 8k resolution macro footage of flower blooming, gold dust particles.', true, true);

-- Insert Briefs
INSERT INTO public.briefs (brand_id, title, campaign_description, content_type, style_tags, aspect_ratio, commercial_use_type, budget_range, deadline, status) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Cyberpunk Energy Drink 15s Hero Commercial', 'We need a high-energy, neon-drenched 15-second vertical video for Instagram Reels introducing our new VOLT-X zero-sugar energy drink.', 'video', ARRAY['Cinematic', '3D', 'Cyberpunk', 'Realistic'], '9:16', 'full-commercial', '$2,500 - $5,000', '2026-11-01', 'open'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Futuristic EV SUV Social Media Launch Assets', 'Seeking a series of 5 photorealistic AI imagery renders of our upcoming concept electric SUV.', 'image', ARRAY['Photorealistic', 'Minimalist', 'Architectural'], '16:9', 'full-commercial', '$3,000 - $6,000', '2026-11-15', 'open');
