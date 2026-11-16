import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dbDir = path.resolve(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'portfolio.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL journal for reliable persistence
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'editor')) DEFAULT 'editor',
      avatar_url TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      email_verified INTEGER NOT NULL DEFAULT 1,
      verification_token TEXT DEFAULT '',
      reset_token TEXT DEFAULT '',
      reset_token_expires_at TEXT DEFAULT '',
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_invitations (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'editor')) DEFAULT 'editor',
      token TEXT NOT NULL UNIQUE,
      invited_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      accepted_at TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      seo_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      banner_image_url TEXT DEFAULT '',
      is_system INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      draft_data TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS page_sections (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      section_type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      subtitle TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      background_color TEXT DEFAULT '#06152B',
      text_alignment TEXT NOT NULL DEFAULT 'left',
      layout_variant TEXT DEFAULT 'default',
      cta_label TEXT DEFAULT '',
      cta_url TEXT DEFAULT '',
      secondary_cta_label TEXT DEFAULT '',
      secondary_cta_url TEXT DEFAULT '',
      config_json TEXT NOT NULL DEFAULT '{}',
      is_visible INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hero_content (
      id TEXT PRIMARY KEY,
      intro_text TEXT NOT NULL,
      main_heading TEXT NOT NULL,
      supporting_heading TEXT NOT NULL,
      description TEXT NOT NULL,
      primary_cta_label TEXT NOT NULL,
      primary_cta_url TEXT NOT NULL,
      secondary_cta_label TEXT NOT NULL,
      secondary_cta_url TEXT NOT NULL,
      portrait_url TEXT NOT NULL,
      background_image_url TEXT DEFAULT '',
      background_color TEXT NOT NULL DEFAULT '#06152B',
      crop_x REAL NOT NULL DEFAULT 50,
      crop_y REAL NOT NULL DEFAULT 22,
      zoom REAL NOT NULL DEFAULT 1.0,
      floating_labels TEXT NOT NULL DEFAULT '[]',
      social_links TEXT NOT NULL DEFAULT '[]',
      animation_enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      draft_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      client_name TEXT DEFAULT '',
      category_id TEXT REFERENCES project_categories(id) ON DELETE SET NULL,
      category_name TEXT NOT NULL,
      short_description TEXT NOT NULL,
      overview TEXT DEFAULT '',
      challenge TEXT DEFAULT '',
      strategy TEXT DEFAULT '',
      creative_execution TEXT DEFAULT '',
      deliverables TEXT NOT NULL DEFAULT '[]',
      tools_used TEXT NOT NULL DEFAULT '[]',
      metrics TEXT NOT NULL DEFAULT '[]',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      external_url TEXT DEFAULT '',
      drive_doc_url TEXT DEFAULT '',
      drive_file_id TEXT DEFAULT '',
      completion_date TEXT DEFAULT '',
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_media (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'embed', 'gdrive_pdf')),
      url TEXT NOT NULL,
      drive_file_id TEXT DEFAULT '',
      caption TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category_id TEXT REFERENCES gallery_categories(id) ON DELETE SET NULL,
      category_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'embed')) DEFAULT 'image',
      media_url TEXT NOT NULL,
      thumbnail_url TEXT DEFAULT '',
      embed_url TEXT DEFAULT '',
      drive_file_id TEXT DEFAULT '',
      tool_used TEXT DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      creation_date TEXT DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      short_description TEXT NOT NULL,
      full_description TEXT DEFAULT '',
      icon_name TEXT NOT NULL DEFAULT 'Sparkles',
      image_url TEXT DEFAULT '',
      cta_label TEXT NOT NULL DEFAULT 'Discuss This Service',
      cta_url TEXT NOT NULL DEFAULT '/contact',
      is_featured INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_features (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      feature_text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      designation TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      photo_url TEXT DEFAULT '',
      review TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      is_featured INTEGER NOT NULL DEFAULT 1,
      is_placeholder INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon_name TEXT NOT NULL DEFAULT 'Layers',
      proficiency INTEGER,
      show_proficiency INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Creative & AI',
      icon_url TEXT DEFAULT '',
      badge_text TEXT DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline_items (
      id TEXT PRIMARY KEY,
      year TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT DEFAULT '',
      service_required TEXT NOT NULL,
      estimated_budget TEXT DEFAULT '',
      project_details TEXT NOT NULL,
      lead_status TEXT NOT NULL CHECK (lead_status IN ('new', 'contacted', 'qualified', 'archived')) DEFAULT 'new',
      is_read INTEGER NOT NULL DEFAULT 0,
      internal_notes TEXT DEFAULT '',
      ip_hash TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS navigation_items (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      is_cta INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      site_name TEXT NOT NULL,
      logo_url TEXT DEFAULT '',
      favicon_url TEXT DEFAULT '',
      contact_email TEXT NOT NULL,
      whatsapp_number TEXT DEFAULT '',
      location TEXT DEFAULT '',
      languages TEXT DEFAULT '',
      availability TEXT DEFAULT '',
      experience_summary TEXT DEFAULT '',
      cv_url TEXT DEFAULT '',
      business_hours TEXT DEFAULT '',
      about_heading TEXT NOT NULL,
      about_bio TEXT NOT NULL,
      about_mission TEXT NOT NULL,
      about_portrait_url TEXT DEFAULT '',
      social_links TEXT NOT NULL DEFAULT '[]',
      seo_default_title TEXT NOT NULL,
      seo_default_description TEXT NOT NULL,
      google_analytics_id TEXT DEFAULT '',
      meta_pixel_id TEXT DEFAULT '',
      cloudflare_cdn_domain TEXT DEFAULT '',
      cloudflare_r2_public_url TEXT DEFAULT '',
      footer_intro TEXT NOT NULL,
      copyright_text TEXT NOT NULL,
      maintenance_mode INTEGER NOT NULL DEFAULT 0,
      theme_colors TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      cdn_url TEXT DEFAULT '',
      storage_provider TEXT NOT NULL DEFAULT 'local',
      file_type TEXT NOT NULL DEFAULT 'image',
      mime_type TEXT DEFAULT '',
      file_size_bytes INTEGER DEFAULT 0,
      alt_text TEXT DEFAULT '',
      folder TEXT NOT NULL DEFAULT 'general',
      drive_file_id TEXT DEFAULT '',
      drive_embed_url TEXT DEFAULT '',
      drive_open_url TEXT DEFAULT '',
      uploaded_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      actor_email TEXT DEFAULT '',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT DEFAULT '',
      details TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pages_slug_status ON pages(slug, status);
    CREATE INDEX IF NOT EXISTS idx_sections_page_order ON page_sections(page_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_projects_status_featured ON projects(status, is_featured, sort_order);
    CREATE INDEX IF NOT EXISTS idx_gallery_status_cat ON gallery_items(status, category_name, sort_order);
    CREATE INDEX IF NOT EXISTS idx_services_status_order ON services(status, sort_order);
    CREATE INDEX IF NOT EXISTS idx_messages_status_read ON contact_messages(lead_status, is_read, created_at);
  `);
}
