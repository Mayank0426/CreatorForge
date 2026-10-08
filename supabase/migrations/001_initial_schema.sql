-- ============================================================
-- CreatorForge -- Initial Schema Migration
-- Run in: Supabase Dashboard -> SQL Editor
-- ============================================================

-- TABLE 1: users
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT UNIQUE NOT NULL,
  role                TEXT NOT NULL CHECK (role IN ('creator', 'brand')),
  name                TEXT,
  avatar_url          TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TABLE 2: creator_profiles
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  headline                 TEXT,
  bio                      TEXT,
  specializations          TEXT[]   NOT NULL DEFAULT '{}',
  skills                   TEXT[]   NOT NULL DEFAULT '{}',
  tools_used               TEXT[]   NOT NULL DEFAULT '{}',
  portfolio_links          JSONB    NOT NULL DEFAULT '[]',
  verification_status      TEXT     NOT NULL DEFAULT 'unverified'
                             CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  rating                   NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  completed_projects_count INTEGER  NOT NULL DEFAULT 0,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TABLE 3: portfolio_items
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id     UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  media_url      TEXT,
  media_type     TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'animation')),
  thumbnail_url  TEXT,
  tools_used     TEXT[]  NOT NULL DEFAULT '{}',
  workflow_notes TEXT,
  is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  view_count     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_creator_id ON public.portfolio_items(creator_id);

-- TABLE 4: briefs
CREATE TABLE IF NOT EXISTS public.briefs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  campaign_description TEXT,
  content_type         TEXT NOT NULL CHECK (content_type IN ('video', 'image', 'animation', 'other')),
  style_tags           TEXT[]  NOT NULL DEFAULT '{}',
  aspect_ratio         TEXT    NOT NULL DEFAULT '16:9'
                         CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', 'other')),
  commercial_use_type  TEXT    NOT NULL DEFAULT 'limited-commercial'
                         CHECK (commercial_use_type IN (
                           'internal-only', 'limited-commercial', 'full-commercial', 'resale'
                         )),
  budget_min           INTEGER,
  budget_max           INTEGER,
  deadline             DATE,
  ai_generated         BOOLEAN NOT NULL DEFAULT FALSE,
  status               TEXT    NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open', 'in-progress', 'delivered', 'closed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER briefs_updated_at
  BEFORE UPDATE ON public.briefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_briefs_brand_id     ON public.briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status       ON public.briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_content_type ON public.briefs(content_type);

-- TABLE 5: engagements
CREATE TABLE IF NOT EXISTS public.engagements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id              UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  creator_id            UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  initiated_by          TEXT NOT NULL CHECK (initiated_by IN ('creator', 'brand')),
  status                TEXT NOT NULL DEFAULT 'applied'
                          CHECK (status IN (
                            'applied', 'shortlisted', 'in-progress',
                            'delivered', 'completed', 'rejected'
                          )),
  proposal_notes        TEXT,
  revision_notes        JSONB[]  NOT NULL DEFAULT '{}',
  final_deliverable_url TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brief_id, creator_id)
);

CREATE TRIGGER engagements_updated_at
  BEFORE UPDATE ON public.engagements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_engagements_brief_id   ON public.engagements(brief_id);
CREATE INDEX IF NOT EXISTS idx_engagements_creator_id ON public.engagements(creator_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements      ENABLE ROW LEVEL SECURITY;

-- RLS: users
CREATE POLICY "Users can read their own row"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own row" ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS: creator_profiles
CREATE POLICY "Creator profiles are publicly readable" ON public.creator_profiles FOR SELECT TO PUBLIC USING (TRUE);
CREATE POLICY "Creators can insert their own profile"  ON public.creator_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can update their own profile"  ON public.creator_profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS: portfolio_items
CREATE POLICY "Portfolio items are publicly readable" ON public.portfolio_items FOR SELECT TO PUBLIC USING (TRUE);
CREATE POLICY "Creators can insert portfolio items"   ON public.portfolio_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = portfolio_items.creator_id AND user_id = auth.uid()));
CREATE POLICY "Creators can update their own portfolio items" ON public.portfolio_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = portfolio_items.creator_id AND user_id = auth.uid()));
CREATE POLICY "Creators can delete their own portfolio items" ON public.portfolio_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = portfolio_items.creator_id AND user_id = auth.uid()));

-- RLS: briefs
CREATE POLICY "Open briefs are publicly readable" ON public.briefs FOR SELECT TO PUBLIC USING (status = 'open' OR auth.uid() = brand_id);
CREATE POLICY "Brands can insert briefs"          ON public.briefs FOR INSERT WITH CHECK (auth.uid() = brand_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'brand'));
CREATE POLICY "Brands can update their own briefs" ON public.briefs FOR UPDATE USING (auth.uid() = brand_id);

-- RLS: engagements
CREATE POLICY "Engagement parties can read their engagements" ON public.engagements FOR SELECT USING (EXISTS (SELECT 1 FROM public.briefs WHERE id = brief_id AND brand_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND user_id = auth.uid()));
CREATE POLICY "Creators and brands can create engagements"    ON public.engagements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.briefs WHERE id = brief_id AND brand_id = auth.uid()));
CREATE POLICY "Engagement parties can update engagements"     ON public.engagements FOR UPDATE USING (EXISTS (SELECT 1 FROM public.briefs WHERE id = brief_id AND brand_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND user_id = auth.uid()));
