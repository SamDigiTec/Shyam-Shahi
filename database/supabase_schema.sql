-- =============================================================================
-- SHYAM SHAHI STUDIO — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- Normalized 20+ table CMS & Portfolio Architecture
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PROFILES (Links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'editor')) DEFAULT 'editor',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. ADMIN INVITATIONS (Prevents unrestricted public admin signup)
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'editor')) DEFAULT 'editor',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PAGES
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  seo_title TEXT,
  meta_description TEXT,
  banner_image_url TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  draft_data JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PAGE SECTIONS
CREATE TABLE IF NOT EXISTS public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'hero', 'text_image', 'image_gallery', 'project_grid', 'video_gallery',
    'services_grid', 'testimonials', 'statistics', 'timeline', 'cta', 'contact_form'
  )),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  background_color TEXT DEFAULT '#06152B',
  text_alignment TEXT NOT NULL CHECK (text_alignment IN ('left', 'center', 'right')) DEFAULT 'left',
  layout_variant TEXT DEFAULT 'default',
  cta_label TEXT DEFAULT '',
  cta_url TEXT DEFAULT '',
  secondary_cta_label TEXT DEFAULT '',
  secondary_cta_url TEXT DEFAULT '',
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. HERO CONTENT
CREATE TABLE IF NOT EXISTS public.hero_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intro_text TEXT NOT NULL,
  main_heading TEXT NOT NULL,
  supporting_heading TEXT NOT NULL,
  description TEXT NOT NULL,
  primary_cta_label TEXT NOT NULL DEFAULT 'Explore My Work',
  primary_cta_url TEXT NOT NULL DEFAULT '/projects',
  secondary_cta_label TEXT NOT NULL DEFAULT 'Let''s Work Together',
  secondary_cta_url TEXT NOT NULL DEFAULT '/contact',
  portrait_url TEXT NOT NULL DEFAULT '',
  background_image_url TEXT DEFAULT '',
  background_color TEXT NOT NULL DEFAULT '#06152B',
  crop_x NUMERIC(5,2) NOT NULL DEFAULT 50,
  crop_y NUMERIC(5,2) NOT NULL DEFAULT 25,
  zoom NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  floating_labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  animation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  draft_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PROJECT CATEGORIES
CREATE TABLE IF NOT EXISTS public.project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  client_name TEXT DEFAULT '',
  category_id UUID REFERENCES public.project_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL DEFAULT 'Social Media Campaign',
  short_description TEXT NOT NULL,
  overview TEXT DEFAULT '',
  challenge TEXT DEFAULT '',
  strategy TEXT DEFAULT '',
  creative_execution TEXT DEFAULT '',
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  tools_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  external_url TEXT DEFAULT '',
  drive_doc_url TEXT DEFAULT '',
  drive_file_id TEXT DEFAULT '',
  completion_date TEXT DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PROJECT MEDIA
CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'embed', 'gdrive_pdf')),
  url TEXT NOT NULL,
  drive_file_id TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. GALLERY CATEGORIES
CREATE TABLE IF NOT EXISTS public.gallery_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. GALLERY ITEMS
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.gallery_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'embed')) DEFAULT 'image',
  media_url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  embed_url TEXT DEFAULT '',
  drive_file_id TEXT DEFAULT '',
  tool_used TEXT DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  creation_date TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  image_url TEXT DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT 'Discuss This Service',
  cta_url TEXT NOT NULL DEFAULT '/contact',
  is_featured BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SERVICE FEATURES
CREATE TABLE IF NOT EXISTS public.service_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TESTIMONIALS
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  photo_url TEXT DEFAULT '',
  review TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  is_featured BOOLEAN NOT NULL DEFAULT TRUE,
  is_placeholder BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Layers',
  proficiency INTEGER CHECK (proficiency IS NULL OR (proficiency >= 0 AND proficiency <= 100)),
  show_proficiency BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. TOOLS
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Creative & AI',
  icon_url TEXT DEFAULT '',
  badge_text TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT DEFAULT '',
  service_required TEXT NOT NULL,
  estimated_budget TEXT DEFAULT '',
  project_details TEXT NOT NULL,
  lead_status TEXT NOT NULL CHECK (lead_status IN ('new', 'contacted', 'qualified', 'archived')) DEFAULT 'new',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  internal_notes TEXT DEFAULT '',
  ip_hash TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. NAVIGATION ITEMS
CREATE TABLE IF NOT EXISTS public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  is_cta BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'Shyam Shahi',
  logo_url TEXT DEFAULT '',
  favicon_url TEXT DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT 'contact@shyamshahi.studio',
  whatsapp_number TEXT DEFAULT '',
  location TEXT DEFAULT '',
  languages TEXT DEFAULT 'English, Hindi',
  availability TEXT DEFAULT 'Open for Select Projects & Retainers',
  experience_summary TEXT DEFAULT '',
  cv_url TEXT DEFAULT '',
  business_hours TEXT DEFAULT 'Mon - Sat, 10:00 AM - 7:00 PM',
  about_heading TEXT NOT NULL DEFAULT 'Let''s turn your business goals into digital opportunities..',
  about_bio TEXT NOT NULL DEFAULT '',
  about_mission TEXT NOT NULL DEFAULT '',
  about_portrait_url TEXT DEFAULT '',
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_default_title TEXT NOT NULL DEFAULT 'Shyam Shahi | Social Media Manager & AI Content Creator',
  seo_default_description TEXT NOT NULL DEFAULT '',
  google_analytics_id TEXT DEFAULT '',
  meta_pixel_id TEXT DEFAULT '',
  cloudflare_cdn_domain TEXT DEFAULT '',
  cloudflare_r2_public_url TEXT DEFAULT '',
  footer_intro TEXT NOT NULL DEFAULT '',
  copyright_text TEXT NOT NULL DEFAULT '© 2026 Shyam Shahi. All rights reserved.',
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  theme_colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. MEDIA ASSETS (Centralized Media Library + Cloudflare + Google Drive)
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  cdn_url TEXT DEFAULT '',
  storage_provider TEXT NOT NULL CHECK (storage_provider IN ('local', 'supabase_storage', 'cloudflare_r2', 'google_drive', 'external')) DEFAULT 'local',
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'document')) DEFAULT 'image',
  mime_type TEXT DEFAULT '',
  file_size_bytes BIGINT DEFAULT 0,
  alt_text TEXT DEFAULT '',
  folder TEXT NOT NULL DEFAULT 'general',
  drive_file_id TEXT DEFAULT '',
  drive_embed_url TEXT DEFAULT '',
  drive_open_url TEXT DEFAULT '',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_pages_slug_status ON public.pages(slug, status);
CREATE INDEX IF NOT EXISTS idx_page_sections_page_order ON public.page_sections(page_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_status_featured ON public.projects(status, is_featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category_name);
CREATE INDEX IF NOT EXISTS idx_gallery_status_cat ON public.gallery_items(status, category_name, sort_order);
CREATE INDEX IF NOT EXISTS idx_services_status_order ON public.services(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(lead_status, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder_type ON public.media_assets(folder, file_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Role Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = TRUE AND role IN ('super_admin', 'editor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = TRUE AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Public read policies (Published content only)
CREATE POLICY "Public read published pages" ON public.pages FOR SELECT USING (status = 'published' AND is_enabled = TRUE);
CREATE POLICY "Public read published sections" ON public.page_sections FOR SELECT USING (status = 'published' AND is_visible = TRUE);
CREATE POLICY "Public read published hero" ON public.hero_content FOR SELECT USING (status = 'published');
CREATE POLICY "Public read published projects" ON public.projects FOR SELECT USING (status = 'published');
CREATE POLICY "Public read project media" ON public.project_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.status = 'published')
);
CREATE POLICY "Public read project categories" ON public.project_categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read published gallery" ON public.gallery_items FOR SELECT USING (status = 'published');
CREATE POLICY "Public read gallery categories" ON public.gallery_categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read published services" ON public.services FOR SELECT USING (status = 'published');
CREATE POLICY "Public read service features" ON public.service_features FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.status = 'published')
);
CREATE POLICY "Public read published testimonials" ON public.testimonials FOR SELECT USING (status = 'published');
CREATE POLICY "Public read published skills" ON public.skills FOR SELECT USING (status = 'published');
CREATE POLICY "Public read published tools" ON public.tools FOR SELECT USING (status = 'published');
CREATE POLICY "Public read visible nav" ON public.navigation_items FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Public insert contact message" ON public.contact_messages FOR INSERT WITH CHECK (TRUE);

-- Admin & Super Admin Management Policies
CREATE POLICY "Admins manage pages" ON public.pages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage sections" ON public.page_sections FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage hero" ON public.hero_content FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage project media" ON public.project_media FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage gallery" ON public.gallery_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage service features" ON public.service_features FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage skills" ON public.skills FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage tools" ON public.tools FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage media" ON public.media_assets FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage messages" ON public.contact_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins update messages" ON public.contact_messages FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete messages" ON public.contact_messages FOR DELETE USING (public.is_admin());
CREATE POLICY "Admins view logs" ON public.activity_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins insert logs" ON public.activity_logs FOR INSERT WITH CHECK (public.is_admin());

-- Super Admin Restricted Policies
CREATE POLICY "Super admins manage profiles" ON public.profiles FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Admins read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Super admins manage invitations" ON public.admin_invitations FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage site settings" ON public.site_settings FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage nav" ON public.navigation_items FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
