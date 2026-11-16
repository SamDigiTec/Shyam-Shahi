import { Router } from 'express';
import type { Request, Response } from 'express';
import type { SQLInputValue } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { z } from 'zod';
import { db, newId, nowIso } from '../database/db.ts';

type DbRow = Record<string, SQLInputValue>;
import {
  clearSessionCookie,
  getAdminFromRequest,
  hashPassword,
  requireAdmin,
  requireSuperAdmin,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
  type AuthenticatedRequest,
} from './auth.ts';
import {
  normalizeVideoEmbedUrl,
  resolveCdnUrl,
  verifyGoogleDriveFile,
} from './mediaUtils.ts';

const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);
    cb(null, `${Date.now()}-${base || 'asset'}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: JPG, PNG, WebP, GIF, SVG, MP4, WebM, PDF.'));
    }
  },
});

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function logActivity(
  req: AuthenticatedRequest,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {}
): void {
  const now = nowIso();
  db.prepare(`
    INSERT INTO activity_logs (id, actor_id, actor_email, action, entity_type, entity_id, details, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId(),
    req.admin?.id || null,
    req.admin?.email || 'system',
    action,
    entityType,
    entityId,
    JSON.stringify(details),
    now,
    now
  );
}

function getSiteSettingsRow() {
  const row = db.prepare('SELECT * FROM site_settings LIMIT 1').get() as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...row,
    social_links: parseJson(row.social_links, []),
    theme_colors: parseJson(row.theme_colors, {}),
    maintenance_mode: row.maintenance_mode === 1,
  };
}

function getCdnDomain(): string {
  const s = db.prepare('SELECT cloudflare_cdn_domain FROM site_settings LIMIT 1').get() as
    | { cloudflare_cdn_domain?: string }
    | undefined;
  return s?.cloudflare_cdn_domain || process.env.CLOUDFLARE_CDN_DOMAIN || '';
}

function mapHeroRow(row: Record<string, unknown>, includeDraft = false) {
  const cdn = getCdnDomain();
  const base = {
    id: row.id as string,
    intro_text: row.intro_text as string,
    main_heading: row.main_heading as string,
    supporting_heading: row.supporting_heading as string,
    description: row.description as string,
    primary_cta_label: row.primary_cta_label as string,
    primary_cta_url: row.primary_cta_url as string,
    secondary_cta_label: row.secondary_cta_label as string,
    secondary_cta_url: row.secondary_cta_url as string,
    portrait_url: resolveCdnUrl(row.portrait_url as string, cdn),
    background_image_url: resolveCdnUrl((row.background_image_url as string) || '', cdn),
    background_color: row.background_color as string,
    crop_x: Number(row.crop_x ?? 50),
    crop_y: Number(row.crop_y ?? 20),
    zoom: Number(row.zoom ?? 1),
    floating_labels: parseJson<string[]>(row.floating_labels, []),
    social_links: parseJson(row.social_links, []),
    animation_enabled: row.animation_enabled === 1,
    status: row.status as 'draft' | 'published',
    draft_data: parseJson<Record<string, unknown> | null>(row.draft_data, null),
    updated_at: row.updated_at as string,
  };
  if (includeDraft && base.draft_data) {
    return { ...base, ...base.draft_data };
  }
  return base;
}

function mapProjectRow(row: Record<string, unknown>) {
  const cdn = getCdnDomain();
  const media = db
    .prepare('SELECT * FROM project_media WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(row.id as string) as Record<string, unknown>[];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    client_name: row.client_name || '',
    category_id: row.category_id || null,
    category_name: row.category_name,
    short_description: row.short_description,
    overview: row.overview || '',
    challenge: row.challenge || '',
    strategy: row.strategy || '',
    creative_execution: row.creative_execution || '',
    deliverables: parseJson<string[]>(row.deliverables, []),
    tools_used: parseJson<string[]>(row.tools_used, []),
    metrics: parseJson(row.metrics, []),
    thumbnail_url: resolveCdnUrl((row.thumbnail_url as string) || '', cdn),
    external_url: row.external_url || '',
    drive_doc_url: row.drive_doc_url || '',
    drive_file_id: row.drive_file_id || '',
    completion_date: row.completion_date || '',
    is_featured: row.is_featured === 1,
    is_demo: row.is_demo === 1,
    status: row.status,
    sort_order: Number(row.sort_order || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    media: media.map((m) => ({
      ...m,
      url: resolveCdnUrl((m.url as string) || '', cdn),
    })),
  };
}

function mapGalleryRow(row: Record<string, unknown>) {
  const cdn = getCdnDomain();
  return {
    ...row,
    media_url: resolveCdnUrl((row.media_url as string) || '', cdn),
    thumbnail_url: resolveCdnUrl((row.thumbnail_url as string) || '', cdn),
    tags: parseJson<string[]>(row.tags, []),
    sort_order: Number(row.sort_order || 0),
  };
}

function mapServiceRow(row: Record<string, unknown>) {
  const cdn = getCdnDomain();
  const features = db
    .prepare('SELECT * FROM service_features WHERE service_id = ? ORDER BY sort_order ASC')
    .all(row.id as string);
  return {
    ...row,
    image_url: resolveCdnUrl((row.image_url as string) || '', cdn),
    is_featured: row.is_featured === 1,
    sort_order: Number(row.sort_order || 0),
    features,
  };
}

export function createApiRouter(): Router {
  const router = Router();

  // =========================================================================
  // AUTHENTICATION ROUTES
  // =========================================================================
  router.get('/auth/setup-status', (_req: Request, res: Response) => {
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM profiles').get() as { cnt: number };
    res.json({
      needsFirstAdmin: countRow.cnt === 0,
      supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
    });
  });

  router.post('/auth/signup', (req: Request, res: Response) => {
    const schema = z.object({
      email: z.string().email(),
      full_name: z.string().min(2).max(100),
      password: z.string().min(8).max(128),
      invite_token: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid signup input.' });
      return;
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM profiles WHERE LOWER(email) = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const totalAdmins = (db.prepare('SELECT COUNT(*) as cnt FROM profiles').get() as { cnt: number }).cnt;
    let assignedRole: 'super_admin' | 'editor' = 'editor';
    let inviteId: string | null = null;

    if (totalAdmins === 0) {
      // First administrator secure bootstrap
      assignedRole = 'super_admin';
    } else {
      // Unrestricted public signup is strictly blocked — require valid invitation token
      const token = parsed.data.invite_token?.trim();
      if (!token) {
        res.status(403).json({
          error:
            'Administrator registration is invite-only. Request an invitation token from a Super Admin.',
        });
        return;
      }
      const invite = db
        .prepare(
          `SELECT * FROM admin_invitations WHERE token = ? AND accepted_at IS NULL LIMIT 1`
        )
        .get(token) as
        | { id: string; email: string; role: 'super_admin' | 'editor'; expires_at: string }
        | undefined;

      if (!invite) {
        res.status(403).json({ error: 'Invalid or already used invitation token.' });
        return;
      }
      if (new Date(invite.expires_at).getTime() < Date.now()) {
        res.status(403).json({ error: 'This invitation token has expired.' });
        return;
      }
      if (invite.email.toLowerCase() !== email) {
        res.status(403).json({ error: 'Email address does not match the invitation.' });
        return;
      }
      assignedRole = invite.role;
      inviteId = invite.id;
    }

    const id = newId();
    const now = nowIso();
    const pwHash = hashPassword(parsed.data.password);

    db.prepare(`
      INSERT INTO profiles (
        id, email, full_name, password_hash, role, is_active, email_verified,
        last_login_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
    `).run(id, email, parsed.data.full_name.trim(), pwHash, assignedRole, now, now, now);

    if (inviteId) {
      db.prepare('UPDATE admin_invitations SET accepted_at = ?, updated_at = ? WHERE id = ?').run(
        now,
        now,
        inviteId
      );
    }

    db.prepare(`
      INSERT INTO activity_logs (id, actor_id, actor_email, action, entity_type, entity_id, details, created_at, updated_at)
      VALUES (?, ?, ?, 'admin_signup', 'profile', ?, ?, ?, ?)
    `).run(newId(), id, email, id, JSON.stringify({ role: assignedRole, bootstrap: totalAdmins === 0 }), now, now);

    const sessionToken = signSessionToken(id, assignedRole);
    setSessionCookie(res, sessionToken);
    res.status(201).json({
      user: {
        id,
        email,
        full_name: parsed.data.full_name.trim(),
        role: assignedRole,
        avatar_url: '',
        email_verified: true,
      },
    });
  });

  router.post('/auth/login', (req: Request, res: Response) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please provide a valid email and password.' });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const row = db
      .prepare('SELECT * FROM profiles WHERE LOWER(email) = ? LIMIT 1')
      .get(email) as
      | {
          id: string;
          email: string;
          full_name: string;
          password_hash: string;
          role: 'super_admin' | 'editor';
          avatar_url: string;
          is_active: number;
          email_verified: number;
        }
      | undefined;

    if (!row || !verifyPassword(parsed.data.password, row.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (row.is_active !== 1) {
      res.status(403).json({ error: 'This administrator account has been deactivated.' });
      return;
    }

    const now = nowIso();
    db.prepare('UPDATE profiles SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now, now, row.id);
    db.prepare(`
      INSERT INTO activity_logs (id, actor_id, actor_email, action, entity_type, entity_id, details, created_at, updated_at)
      VALUES (?, ?, ?, 'admin_login', 'profile', ?, '{}', ?, ?)
    `).run(newId(), row.id, row.email, row.id, now, now);

    const sessionToken = signSessionToken(row.id, row.role);
    setSessionCookie(res, sessionToken);
    res.json({
      user: {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        avatar_url: row.avatar_url || '',
        email_verified: row.email_verified === 1,
      },
    });
  });

  router.post('/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  router.get('/auth/me', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, private');
    const admin = getAdminFromRequest(req);
    if (!admin) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: admin });
  });

  router.post('/auth/forgot-password', (req: Request, res: Response) => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email is required.' });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const row = db.prepare('SELECT id FROM profiles WHERE LOWER(email) = ?').get(email) as
      | { id: string }
      | undefined;

    let devResetToken: string | undefined;
    if (row) {
      const token = crypto.randomBytes(20).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db.prepare(
        'UPDATE profiles SET reset_token = ?, reset_token_expires_at = ?, updated_at = ? WHERE id = ?'
      ).run(token, expires, nowIso(), row.id);
      if (process.env.NODE_ENV !== 'production') {
        devResetToken = token;
      }
    }

    res.json({
      message: 'If an account matches that email, password reset instructions have been generated.',
      ...(devResetToken ? { devResetToken } : {}),
    });
  });

  router.post('/auth/reset-password', (req: Request, res: Response) => {
    const schema = z.object({
      token: z.string().min(10),
      password: z.string().min(8).max(128),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid reset token and password (min 8 chars) required.' });
      return;
    }

    const row = db
      .prepare('SELECT id, reset_token_expires_at FROM profiles WHERE reset_token = ? LIMIT 1')
      .get(parsed.data.token.trim()) as { id: string; reset_token_expires_at: string } | undefined;

    if (!row || !row.reset_token_expires_at || new Date(row.reset_token_expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: 'Invalid or expired reset token.' });
      return;
    }

    db.prepare(
      'UPDATE profiles SET password_hash = ?, reset_token = \'\', reset_token_expires_at = \'\', updated_at = ? WHERE id = ?'
    ).run(hashPassword(parsed.data.password), nowIso(), row.id);

    res.json({ message: 'Password has been updated. You can now sign in.' });
  });

  // =========================================================================
  // PUBLIC READ ROUTES (Published content only unless admin preview)
  // =========================================================================
  router.get('/public/bootstrap', (req: Request, res: Response) => {
    const isPreview = req.query.preview === '1' && Boolean(getAdminFromRequest(req));
    if (!isPreview) {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }

    const settings = getSiteSettingsRow();
    const navigation = db
      .prepare('SELECT * FROM navigation_items WHERE is_visible = 1 ORDER BY sort_order ASC')
      .all()
      .map((n: Record<string, unknown>) => ({
        ...n,
        is_cta: n.is_cta === 1,
        is_visible: n.is_visible === 1,
      }));

    const heroRow = db.prepare('SELECT * FROM hero_content LIMIT 1').get() as Record<string, unknown> | undefined;
    const hero = heroRow ? mapHeroRow(heroRow, isPreview) : null;

    const pagesQuery = isPreview
      ? 'SELECT * FROM pages WHERE is_enabled = 1 ORDER BY sort_order ASC'
      : "SELECT * FROM pages WHERE status = 'published' AND is_enabled = 1 ORDER BY sort_order ASC";
    const pages = (db.prepare(pagesQuery).all() as Record<string, unknown>[]).map((p) => ({
      ...p,
      is_system: p.is_system === 1,
      is_enabled: p.is_enabled === 1,
      sections: (
        db
          .prepare(
            isPreview
              ? 'SELECT * FROM page_sections WHERE page_id = ? AND is_visible = 1 ORDER BY sort_order ASC'
              : "SELECT * FROM page_sections WHERE page_id = ? AND status = 'published' AND is_visible = 1 ORDER BY sort_order ASC"
          )
          .all(p.id as string) as Record<string, unknown>[]
      ).map((s) => ({
        ...s,
        is_visible: s.is_visible === 1,
        config_json: parseJson(s.config_json, {}),
      })),
    }));

    const featuredProjects = (
      db
        .prepare(
          isPreview
            ? 'SELECT * FROM projects WHERE is_featured = 1 ORDER BY sort_order ASC LIMIT 6'
            : "SELECT * FROM projects WHERE status = 'published' AND is_featured = 1 ORDER BY sort_order ASC LIMIT 6"
        )
        .all() as Record<string, unknown>[]
    ).map(mapProjectRow);

    const services = (
      db
        .prepare(
          isPreview
            ? 'SELECT * FROM services ORDER BY sort_order ASC'
            : "SELECT * FROM services WHERE status = 'published' ORDER BY sort_order ASC"
        )
        .all() as Record<string, unknown>[]
    ).map(mapServiceRow);

    const skills = (
      db
        .prepare(
          isPreview
            ? 'SELECT * FROM skills ORDER BY sort_order ASC'
            : "SELECT * FROM skills WHERE status = 'published' ORDER BY sort_order ASC"
        )
        .all() as Record<string, unknown>[]
    ).map((sk) => ({ ...sk, show_proficiency: sk.show_proficiency === 1 }));

    const tools = db
      .prepare(
        isPreview
          ? 'SELECT * FROM tools ORDER BY sort_order ASC'
          : "SELECT * FROM tools WHERE status = 'published' ORDER BY sort_order ASC"
      )
      .all();

    const testimonials = (
      db
        .prepare(
          isPreview
            ? 'SELECT * FROM testimonials ORDER BY sort_order ASC'
            : "SELECT * FROM testimonials WHERE status = 'published' ORDER BY sort_order ASC"
        )
        .all() as Record<string, unknown>[]
    ).map((t) => ({
      ...t,
      is_featured: t.is_featured === 1,
      is_placeholder: t.is_placeholder === 1,
    }));

    const timeline = db
      .prepare(
        isPreview
          ? 'SELECT * FROM timeline_items ORDER BY sort_order ASC'
          : "SELECT * FROM timeline_items WHERE status = 'published' ORDER BY sort_order ASC"
      )
      .all();

    res.json({
      settings,
      navigation,
      hero,
      pages,
      featuredProjects,
      services,
      skills,
      tools,
      testimonials,
      timeline,
    });
  });

  router.get('/public/projects', (req: Request, res: Response) => {
    const isPreview = req.query.preview === '1' && Boolean(getAdminFromRequest(req));
    const category = req.query.category as string | undefined;
    let sql = isPreview ? 'SELECT * FROM projects' : "SELECT * FROM projects WHERE status = 'published'";
    const params: string[] = [];
    if (category && category !== 'All Projects') {
      sql += isPreview ? ' WHERE category_name = ?' : ' AND category_name = ?';
      params.push(category);
    }
    sql += ' ORDER BY sort_order ASC, created_at DESC';
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    const categories = db.prepare('SELECT * FROM project_categories ORDER BY sort_order ASC').all();
    res.json({
      projects: rows.map(mapProjectRow),
      categories,
    });
  });

  router.get('/public/projects/:slug', (req: Request, res: Response) => {
    const isPreview = req.query.preview === '1' && Boolean(getAdminFromRequest(req));
    const row = db
      .prepare(
        isPreview
          ? 'SELECT * FROM projects WHERE slug = ? LIMIT 1'
          : "SELECT * FROM projects WHERE slug = ? AND status = 'published' LIMIT 1"
      )
      .get(req.params.slug) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json({ project: mapProjectRow(row) });
  });

  router.get('/public/gallery', (req: Request, res: Response) => {
    const isPreview = req.query.preview === '1' && Boolean(getAdminFromRequest(req));
    const category = req.query.category as string | undefined;
    let sql = isPreview ? 'SELECT * FROM gallery_items' : "SELECT * FROM gallery_items WHERE status = 'published'";
    const params: string[] = [];
    if (category && category !== 'All') {
      sql += isPreview ? ' WHERE category_name = ?' : ' AND category_name = ?';
      params.push(category);
    }
    sql += ' ORDER BY sort_order ASC, created_at DESC';
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    const categories = db.prepare('SELECT * FROM gallery_categories ORDER BY sort_order ASC').all();
    res.json({
      items: rows.map(mapGalleryRow),
      categories,
    });
  });

  router.get('/public/services', (req: Request, res: Response) => {
    const isPreview = req.query.preview === '1' && Boolean(getAdminFromRequest(req));
    const rows = db
      .prepare(
        isPreview
          ? 'SELECT * FROM services ORDER BY sort_order ASC'
          : "SELECT * FROM services WHERE status = 'published' ORDER BY sort_order ASC"
      )
      .all() as Record<string, unknown>[];
    res.json({ services: rows.map(mapServiceRow) });
  });

  router.post('/public/contact', async (req: Request, res: Response) => {
    const schema = z.object({
      full_name: z.string().min(2, 'Please enter your full name.').max(120),
      email: z.string().email('Please provide a valid email address.'),
      company: z.string().max(120).optional().default(''),
      service_required: z.string().min(2, 'Please select a service.'),
      estimated_budget: z.string().max(80).optional().default(''),
      project_details: z.string().min(10, 'Please share a few details about your project.').max(4000),
      website_hp: z.string().optional().default(''), // honeypot spam field
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation failed.' });
      return;
    }

    // Silent honeypot drop for bots
    if (parsed.data.website_hp && parsed.data.website_hp.trim().length > 0) {
      res.status(201).json({ message: 'Thank you! Your inquiry has been received.' });
      return;
    }

    const email = parsed.data.email.trim().toLowerCase();
    const ipHash = crypto
      .createHash('sha256')
      .update(req.ip || 'unknown')
      .digest('hex')
      .slice(0, 16);

    // Prevent duplicate submission within 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const dup = db
      .prepare(
        `SELECT id FROM contact_messages
         WHERE LOWER(email) = ? AND project_details = ? AND created_at > ? LIMIT 1`
      )
      .get(email, parsed.data.project_details.trim(), fiveMinsAgo);
    if (dup) {
      res.status(429).json({
        error: 'We already received this exact inquiry a moment ago. Shyam will reply shortly.',
      });
      return;
    }

    const id = newId();
    const now = nowIso();
    db.prepare(`
      INSERT INTO contact_messages (
        id, full_name, email, company, service_required, estimated_budget,
        project_details, lead_status, is_read, internal_notes, ip_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 0, '', ?, ?, ?)
    `).run(
      id,
      parsed.data.full_name.trim(),
      email,
      parsed.data.company.trim(),
      parsed.data.service_required.trim(),
      parsed.data.estimated_budget.trim(),
      parsed.data.project_details.trim(),
      ipHash,
      now,
      now
    );

    // Optional configurable email notification via Resend API
    const resendKey = process.env.RESEND_API_KEY;
    const settings = getSiteSettingsRow() as { contact_email?: string } | null;
    const adminNotifyEmail = process.env.ADMIN_NOTIFICATION_EMAIL || settings?.contact_email;
    if (resendKey && adminNotifyEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Portfolio Leads <onboarding@resend.dev>',
            to: [adminNotifyEmail],
            subject: `New Inquiry: ${parsed.data.service_required} — ${parsed.data.full_name}`,
            text: `Name: ${parsed.data.full_name}\nEmail: ${email}\nCompany: ${parsed.data.company}\nService: ${parsed.data.service_required}\nBudget: ${parsed.data.estimated_budget}\n\nDetails:\n${parsed.data.project_details}`,
          }),
        });
      } catch {
        // Non-fatal notification error; inquiry is already safely persisted in DB
      }
    }

    res.status(201).json({
      id,
      message: 'Thank you! Your message has been sent and saved. Shyam will respond within 24 hours.',
    });
  });

  // =========================================================================
  // SEO: SITEMAP & ROBOTS
  // =========================================================================
  router.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
    const pages = db
      .prepare("SELECT slug, updated_at FROM pages WHERE status = 'published' AND is_enabled = 1")
      .all() as { slug: string; updated_at: string }[];
    const projects = db
      .prepare("SELECT slug, updated_at FROM projects WHERE status = 'published'")
      .all() as { slug: string; updated_at: string }[];

    const urls = [
      ...pages.map((p) => ({
        loc: p.slug === 'home' ? `${baseUrl}/` : `${baseUrl}/${p.slug}`,
        lastmod: p.updated_at.slice(0, 10),
      })),
      ...projects.map((pr) => ({
        loc: `${baseUrl}/projects/${pr.slug}`,
        lastmod: pr.updated_at.slice(0, 10),
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`)
      .join('\n')}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  });

  // =========================================================================
  // ADMIN OVERVIEW & LOGS
  // =========================================================================
  router.get('/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const stats = {
      totalProjects: (db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }).c,
      totalGalleryItems: (db.prepare('SELECT COUNT(*) as c FROM gallery_items').get() as { c: number }).c,
      totalServices: (db.prepare('SELECT COUNT(*) as c FROM services').get() as { c: number }).c,
      totalTestimonials: (db.prepare('SELECT COUNT(*) as c FROM testimonials').get() as { c: number }).c,
      totalMessages: (db.prepare('SELECT COUNT(*) as c FROM contact_messages').get() as { c: number }).c,
      unreadMessages: (
        db.prepare('SELECT COUNT(*) as c FROM contact_messages WHERE is_read = 0').get() as { c: number }
      ).c,
      publishedPages: (
        db.prepare("SELECT COUNT(*) as c FROM pages WHERE status = 'published'").get() as { c: number }
      ).c,
      draftContent:
        (db.prepare("SELECT COUNT(*) as c FROM pages WHERE status = 'draft'").get() as { c: number }).c +
        (db.prepare("SELECT COUNT(*) as c FROM projects WHERE status = 'draft'").get() as { c: number }).c +
        (db.prepare("SELECT COUNT(*) as c FROM gallery_items WHERE status = 'draft'").get() as { c: number }).c +
        (db.prepare("SELECT COUNT(*) as c FROM services WHERE status = 'draft'").get() as { c: number }).c,
    };

    const recentLogs = (
      db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 20').all() as Record<string, unknown>[]
    ).map((l) => ({ ...l, details: parseJson(l.details, {}) }));

    const recentMessages = db
      .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 5')
      .all()
      .map((m: Record<string, unknown>) => ({ ...m, is_read: m.is_read === 1 }));

    res.json({ stats, recentLogs, recentMessages });
  });

  router.get('/admin/logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const logs = (
      db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100').all() as Record<string, unknown>[]
    ).map((l) => ({ ...l, details: parseJson(l.details, {}) }));
    res.json({ logs });
  });

  // =========================================================================
  // ADMIN HERO EDITOR (With Draft / Publish / Discard Workflow & Crop State)
  // =========================================================================
  router.get('/admin/hero', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const row = db.prepare('SELECT * FROM hero_content LIMIT 1').get() as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Hero record missing' });
      return;
    }
    res.json({ hero: mapHeroRow(row, false) });
  });

  router.put('/admin/hero', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const row = db.prepare('SELECT * FROM hero_content LIMIT 1').get() as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Hero record missing' });
      return;
    }

    const mode = (req.body.mode as 'save_draft' | 'publish' | 'discard_draft' | undefined) || 'publish';
    const now = nowIso();

    if (mode === 'discard_draft') {
      db.prepare('UPDATE hero_content SET draft_data = NULL, updated_at = ? WHERE id = ?').run(now, row.id as string);
      logActivity(req, 'hero_draft_discarded', 'hero', row.id as string);
      const updated = db.prepare('SELECT * FROM hero_content WHERE id = ?').get(row.id as string) as Record<string, unknown>;
      res.json({ hero: mapHeroRow(updated, false), message: 'Draft changes discarded.' });
      return;
    }

    const payload = {
      intro_text: req.body.intro_text ?? row.intro_text,
      main_heading: req.body.main_heading ?? row.main_heading,
      supporting_heading: req.body.supporting_heading ?? row.supporting_heading,
      description: req.body.description ?? row.description,
      primary_cta_label: req.body.primary_cta_label ?? row.primary_cta_label,
      primary_cta_url: req.body.primary_cta_url ?? row.primary_cta_url,
      secondary_cta_label: req.body.secondary_cta_label ?? row.secondary_cta_label,
      secondary_cta_url: req.body.secondary_cta_url ?? row.secondary_cta_url,
      portrait_url: req.body.portrait_url ?? row.portrait_url,
      background_image_url: req.body.background_image_url ?? row.background_image_url,
      background_color: req.body.background_color ?? row.background_color,
      crop_x: Number(req.body.crop_x ?? row.crop_x),
      crop_y: Number(req.body.crop_y ?? row.crop_y),
      zoom: Number(req.body.zoom ?? row.zoom),
      floating_labels: Array.isArray(req.body.floating_labels)
        ? req.body.floating_labels
        : parseJson(row.floating_labels, []),
      social_links: Array.isArray(req.body.social_links)
        ? req.body.social_links
        : parseJson(row.social_links, []),
      animation_enabled:
        typeof req.body.animation_enabled === 'boolean'
          ? req.body.animation_enabled
          : row.animation_enabled === 1,
    };

    if (mode === 'save_draft') {
      db.prepare('UPDATE hero_content SET draft_data = ?, updated_at = ? WHERE id = ?').run(
        JSON.stringify(payload),
        now,
        row.id as string
      );
      logActivity(req, 'hero_saved_draft', 'hero', row.id as string);
    } else {
      db.prepare(`
        UPDATE hero_content SET
          intro_text = ?, main_heading = ?, supporting_heading = ?, description = ?,
          primary_cta_label = ?, primary_cta_url = ?, secondary_cta_label = ?, secondary_cta_url = ?,
          portrait_url = ?, background_image_url = ?, background_color = ?,
          crop_x = ?, crop_y = ?, zoom = ?, floating_labels = ?, social_links = ?,
          animation_enabled = ?, status = 'published', draft_data = NULL, updated_at = ?
        WHERE id = ?
      `).run(
        payload.intro_text,
        payload.main_heading,
        payload.supporting_heading,
        payload.description,
        payload.primary_cta_label,
        payload.primary_cta_url,
        payload.secondary_cta_label,
        payload.secondary_cta_url,
        payload.portrait_url,
        payload.background_image_url,
        payload.background_color,
        payload.crop_x,
        payload.crop_y,
        payload.zoom,
        JSON.stringify(payload.floating_labels),
        JSON.stringify(payload.social_links),
        payload.animation_enabled ? 1 : 0,
        now,
        row.id as string
      );
      logActivity(req, 'hero_published', 'hero', row.id as string);
    }

    const updated = db.prepare('SELECT * FROM hero_content WHERE id = ?').get(row.id as string) as Record<string, unknown>;
    res.json({
      hero: mapHeroRow(updated, false),
      message: mode === 'save_draft' ? 'Hero saved as draft.' : 'Hero published to live website.',
    });
  });

  // =========================================================================
  // ADMIN PAGES & SECTION BUILDER
  // =========================================================================
  router.get('/admin/pages', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const pages = (db.prepare('SELECT * FROM pages ORDER BY sort_order ASC').all() as Record<string, unknown>[]).map(
      (p) => ({
        ...p,
        is_system: p.is_system === 1,
        is_enabled: p.is_enabled === 1,
        sections: (
          db
            .prepare('SELECT * FROM page_sections WHERE page_id = ? ORDER BY sort_order ASC')
            .all(p.id as string) as Record<string, unknown>[]
        ).map((s) => ({
          ...s,
          is_visible: s.is_visible === 1,
          config_json: parseJson(s.config_json, {}),
        })),
      })
    );
    res.json({ pages });
  });

  router.post('/admin/pages', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      seo_title: z.string().optional().default(''),
      meta_description: z.string().optional().default(''),
      banner_image_url: z.string().optional().default(''),
      status: z.enum(['draft', 'published']).optional().default('draft'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid page data' });
      return;
    }
    const cleanSlug = parsed.data.slug
      .toLowerCase()
      .replace(/^\/+/, '')
      .replace(/[^a-z0-9-]+/g, '-');
    const id = newId();
    const now = nowIso();
    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM pages').get() as { m: number }).m;
    db.prepare(`
      INSERT INTO pages (id, slug, title, seo_title, meta_description, banner_image_url, is_system, is_enabled, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?)
    `).run(
      id,
      cleanSlug,
      parsed.data.title,
      parsed.data.seo_title || parsed.data.title,
      parsed.data.meta_description,
      parsed.data.banner_image_url,
      parsed.data.status,
      maxOrder + 1,
      now,
      now
    );
    logActivity(req, 'page_created', 'page', id, { slug: cleanSlug });
    res.status(201).json({ id, slug: cleanSlug });
  });

  router.put('/admin/pages/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id) as DbRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    const now = nowIso();
    db.prepare(`
      UPDATE pages SET
        title = ?, slug = ?, seo_title = ?, meta_description = ?, banner_image_url = ?,
        is_enabled = ?, status = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.title ?? existing.title,
      req.body.slug ?? existing.slug,
      req.body.seo_title ?? existing.seo_title,
      req.body.meta_description ?? existing.meta_description,
      req.body.banner_image_url ?? existing.banner_image_url,
      typeof req.body.is_enabled === 'boolean' ? (req.body.is_enabled ? 1 : 0) : existing.is_enabled,
      req.body.status ?? existing.status,
      Number(req.body.sort_order ?? existing.sort_order),
      now,
      req.params.id
    );
    logActivity(req, 'page_updated', 'page', req.params.id, { status: req.body.status ?? existing.status });
    res.json({ ok: true });
  });

  router.delete('/admin/pages/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT is_system, title FROM pages WHERE id = ?').get(req.params.id) as
      | { is_system: number; title: string }
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    if (existing.is_system === 1) {
      res.status(400).json({ error: 'Core navigation pages cannot be deleted; disable or unpublish instead.' });
      return;
    }
    db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
    logActivity(req, 'page_deleted', 'page', req.params.id, { title: existing.title });
    res.json({ ok: true });
  });

  router.post('/admin/sections', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = newId();
    const now = nowIso();
    const maxOrder = (
      db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM page_sections WHERE page_id = ?').get(req.body.page_id) as {
        m: number;
      }
    ).m;
    db.prepare(`
      INSERT INTO page_sections (
        id, page_id, section_type, title, subtitle, description, image_url,
        background_color, text_alignment, layout_variant, cta_label, cta_url,
        secondary_cta_label, secondary_cta_url, config_json, is_visible, status, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.body.page_id,
      req.body.section_type || 'text_image',
      req.body.title || 'New Section',
      req.body.subtitle || '',
      req.body.description || '',
      req.body.image_url || '',
      req.body.background_color || '#06152B',
      req.body.text_alignment || 'left',
      req.body.layout_variant || 'default',
      req.body.cta_label || '',
      req.body.cta_url || '',
      req.body.secondary_cta_label || '',
      req.body.secondary_cta_url || '',
      JSON.stringify(req.body.config_json || {}),
      req.body.is_visible === false ? 0 : 1,
      req.body.status || 'published',
      maxOrder + 1,
      now,
      now
    );
    logActivity(req, 'section_created', 'page_section', id);
    res.status(201).json({ id });
  });

  router.put('/admin/sections/reorder', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const items = (req.body.orderedIds as string[]) || [];
    const stmt = db.prepare('UPDATE page_sections SET sort_order = ?, updated_at = ? WHERE id = ?');
    const now = nowIso();
    items.forEach((id, idx) => stmt.run(idx + 1, now, id));
    logActivity(req, 'sections_reordered', 'page_section', items[0] || '', { count: items.length });
    res.json({ ok: true });
  });

  router.put('/admin/sections/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM page_sections WHERE id = ?').get(req.params.id) as
      | DbRow
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }
    db.prepare(`
      UPDATE page_sections SET
        section_type = ?, title = ?, subtitle = ?, description = ?, image_url = ?,
        background_color = ?, text_alignment = ?, layout_variant = ?, cta_label = ?, cta_url = ?,
        secondary_cta_label = ?, secondary_cta_url = ?, config_json = ?, is_visible = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.section_type ?? existing.section_type,
      req.body.title ?? existing.title,
      req.body.subtitle ?? existing.subtitle,
      req.body.description ?? existing.description,
      req.body.image_url ?? existing.image_url,
      req.body.background_color ?? existing.background_color,
      req.body.text_alignment ?? existing.text_alignment,
      req.body.layout_variant ?? existing.layout_variant,
      req.body.cta_label ?? existing.cta_label,
      req.body.cta_url ?? existing.cta_url,
      req.body.secondary_cta_label ?? existing.secondary_cta_label,
      req.body.secondary_cta_url ?? existing.secondary_cta_url,
      JSON.stringify(req.body.config_json ?? parseJson(existing.config_json, {})),
      typeof req.body.is_visible === 'boolean' ? (req.body.is_visible ? 1 : 0) : existing.is_visible,
      req.body.status ?? existing.status,
      nowIso(),
      req.params.id
    );
    logActivity(req, 'section_updated', 'page_section', req.params.id);
    res.json({ ok: true });
  });

  router.post('/admin/sections/:id/duplicate', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM page_sections WHERE id = ?').get(req.params.id) as
      | DbRow
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }
    const id = newId();
    const now = nowIso();
    db.prepare(`
      INSERT INTO page_sections (
        id, page_id, section_type, title, subtitle, description, image_url,
        background_color, text_alignment, layout_variant, cta_label, cta_url,
        secondary_cta_label, secondary_cta_url, config_json, is_visible, status, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
    `).run(
      id,
      existing.page_id,
      existing.section_type,
      `${existing.title} (Copy)`,
      existing.subtitle,
      existing.description,
      existing.image_url,
      existing.background_color,
      existing.text_alignment,
      existing.layout_variant,
      existing.cta_label,
      existing.cta_url,
      existing.secondary_cta_label,
      existing.secondary_cta_url,
      existing.config_json,
      existing.is_visible,
      Number(existing.sort_order) + 1,
      now,
      now
    );
    logActivity(req, 'section_duplicated', 'page_section', id);
    res.status(201).json({ id });
  });

  router.delete('/admin/sections/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM page_sections WHERE id = ?').run(req.params.id);
    logActivity(req, 'section_deleted', 'page_section', req.params.id);
    res.json({ ok: true });
  });

  // =========================================================================
  // ADMIN PROJECTS CRUD
  // =========================================================================
  router.get('/admin/projects', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const rows = db
      .prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC')
      .all() as Record<string, unknown>[];
    const categories = db.prepare('SELECT * FROM project_categories ORDER BY sort_order ASC').all();
    res.json({ projects: rows.map(mapProjectRow), categories });
  });

  router.post('/admin/projects', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const id = newId();
    const now = nowIso();
    const title = (req.body.title as string) || 'Untitled Project';
    const slug = (
      (req.body.slug as string) ||
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(0, 6)}`
    ).replace(/^-|-$/g, '');

    let driveFileId = (req.body.drive_file_id as string) || '';
    if (req.body.drive_doc_url && !driveFileId) {
      try {
        const info = await verifyGoogleDriveFile(req.body.drive_doc_url);
        driveFileId = info.fileId;
      } catch {
        // Keep user URL cleanly
      }
    }

    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM projects').get() as { m: number }).m;
    db.prepare(`
      INSERT INTO projects (
        id, slug, title, client_name, category_name, short_description, overview,
        challenge, strategy, creative_execution, deliverables, tools_used, metrics,
        thumbnail_url, external_url, drive_doc_url, drive_file_id, completion_date,
        is_featured, is_demo, status, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      slug,
      title,
      req.body.client_name || '',
      req.body.category_name || 'Social Media Management',
      req.body.short_description || '',
      req.body.overview || '',
      req.body.challenge || '',
      req.body.strategy || '',
      req.body.creative_execution || '',
      JSON.stringify(req.body.deliverables || []),
      JSON.stringify(req.body.tools_used || []),
      JSON.stringify(req.body.metrics || []),
      req.body.thumbnail_url || '',
      req.body.external_url || '',
      req.body.drive_doc_url || '',
      driveFileId,
      req.body.completion_date || '',
      req.body.is_featured ? 1 : 0,
      req.body.is_demo ? 1 : 0,
      req.body.status || 'published',
      Number(req.body.sort_order ?? maxOrder + 1),
      now,
      now
    );

    if (Array.isArray(req.body.media)) {
      const insMedia = db.prepare(`
        INSERT INTO project_media (id, project_id, media_type, url, drive_file_id, caption, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      req.body.media.forEach((m: Record<string, string>, idx: number) => {
        if (m.url) {
          insMedia.run(
            newId(),
            id,
            m.media_type || 'image',
            m.media_type === 'embed' ? normalizeVideoEmbedUrl(m.url) : m.url,
            m.drive_file_id || '',
            m.caption || '',
            idx + 1,
            now,
            now
          );
        }
      });
    }

    logActivity(req, 'project_created', 'project', id, { title });
    res.status(201).json({ id, slug });
  });

  router.put('/admin/projects/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as DbRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const now = nowIso();
    let driveFileId = (req.body.drive_file_id as string) ?? (existing.drive_file_id as string);
    if (req.body.drive_doc_url && req.body.drive_doc_url !== existing.drive_doc_url) {
      try {
        const info = await verifyGoogleDriveFile(req.body.drive_doc_url);
        driveFileId = info.fileId;
      } catch {
        driveFileId = '';
      }
    }

    db.prepare(`
      UPDATE projects SET
        slug = ?, title = ?, client_name = ?, category_name = ?, short_description = ?,
        overview = ?, challenge = ?, strategy = ?, creative_execution = ?, deliverables = ?,
        tools_used = ?, metrics = ?, thumbnail_url = ?, external_url = ?, drive_doc_url = ?,
        drive_file_id = ?, completion_date = ?, is_featured = ?, is_demo = ?, status = ?,
        sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.slug ?? existing.slug,
      req.body.title ?? existing.title,
      req.body.client_name ?? existing.client_name,
      req.body.category_name ?? existing.category_name,
      req.body.short_description ?? existing.short_description,
      req.body.overview ?? existing.overview,
      req.body.challenge ?? existing.challenge,
      req.body.strategy ?? existing.strategy,
      req.body.creative_execution ?? existing.creative_execution,
      JSON.stringify(req.body.deliverables ?? parseJson(existing.deliverables, [])),
      JSON.stringify(req.body.tools_used ?? parseJson(existing.tools_used, [])),
      JSON.stringify(req.body.metrics ?? parseJson(existing.metrics, [])),
      req.body.thumbnail_url ?? existing.thumbnail_url,
      req.body.external_url ?? existing.external_url,
      req.body.drive_doc_url ?? existing.drive_doc_url,
      driveFileId,
      req.body.completion_date ?? existing.completion_date,
      typeof req.body.is_featured === 'boolean' ? (req.body.is_featured ? 1 : 0) : existing.is_featured,
      typeof req.body.is_demo === 'boolean' ? (req.body.is_demo ? 1 : 0) : existing.is_demo,
      req.body.status ?? existing.status,
      Number(req.body.sort_order ?? existing.sort_order),
      now,
      req.params.id
    );

    if (Array.isArray(req.body.media)) {
      db.prepare('DELETE FROM project_media WHERE project_id = ?').run(req.params.id);
      const insMedia = db.prepare(`
        INSERT INTO project_media (id, project_id, media_type, url, drive_file_id, caption, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      req.body.media.forEach((m: Record<string, string>, idx: number) => {
        if (m.url) {
          insMedia.run(
            newId(),
            req.params.id,
            m.media_type || 'image',
            m.media_type === 'embed' ? normalizeVideoEmbedUrl(m.url) : m.url,
            m.drive_file_id || '',
            m.caption || '',
            idx + 1,
            now,
            now
          );
        }
      });
    }

    logActivity(req, 'project_updated', 'project', req.params.id, { title: req.body.title ?? existing.title });
    res.json({ ok: true });
  });

  router.delete('/admin/projects/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    logActivity(req, 'project_deleted', 'project', req.params.id);
    res.json({ ok: true });
  });

  // =========================================================================
  // ADMIN GALLERY CRUD
  // =========================================================================
  router.get('/admin/gallery', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const rows = db
      .prepare('SELECT * FROM gallery_items ORDER BY sort_order ASC, created_at DESC')
      .all() as Record<string, unknown>[];
    const categories = db.prepare('SELECT * FROM gallery_categories ORDER BY sort_order ASC').all();
    res.json({ items: rows.map(mapGalleryRow), categories });
  });

  router.post('/admin/gallery', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = newId();
    const now = nowIso();
    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM gallery_items').get() as { m: number }).m;
    const mediaType = req.body.media_type || 'image';
    const rawEmbed = req.body.embed_url || (mediaType === 'embed' ? req.body.media_url : '');
    const normalizedEmbed = rawEmbed ? normalizeVideoEmbedUrl(rawEmbed) : '';

    db.prepare(`
      INSERT INTO gallery_items (
        id, title, category_name, description, media_type, media_url, thumbnail_url,
        embed_url, drive_file_id, tool_used, tags, creation_date, status, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.body.title || 'Creative Work',
      req.body.category_name || 'AI-Generated Images',
      req.body.description || '',
      mediaType,
      req.body.media_url || normalizedEmbed || '',
      req.body.thumbnail_url || req.body.media_url || '',
      normalizedEmbed,
      req.body.drive_file_id || '',
      req.body.tool_used || '',
      JSON.stringify(req.body.tags || []),
      req.body.creation_date || now.slice(0, 7),
      req.body.status || 'published',
      Number(req.body.sort_order ?? maxOrder + 1),
      now,
      now
    );
    logActivity(req, 'gallery_created', 'gallery_item', id, { title: req.body.title });
    res.status(201).json({ id });
  });

  router.put('/admin/gallery/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM gallery_items WHERE id = ?').get(req.params.id) as
      | DbRow
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Gallery item not found' });
      return;
    }
    const embedUrl = req.body.embed_url
      ? normalizeVideoEmbedUrl(req.body.embed_url)
      : (existing.embed_url as string);

    db.prepare(`
      UPDATE gallery_items SET
        title = ?, category_name = ?, description = ?, media_type = ?, media_url = ?,
        thumbnail_url = ?, embed_url = ?, drive_file_id = ?, tool_used = ?, tags = ?,
        creation_date = ?, status = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.title ?? existing.title,
      req.body.category_name ?? existing.category_name,
      req.body.description ?? existing.description,
      req.body.media_type ?? existing.media_type,
      req.body.media_url ?? existing.media_url,
      req.body.thumbnail_url ?? existing.thumbnail_url,
      embedUrl,
      req.body.drive_file_id ?? existing.drive_file_id,
      req.body.tool_used ?? existing.tool_used,
      JSON.stringify(req.body.tags ?? parseJson(existing.tags, [])),
      req.body.creation_date ?? existing.creation_date,
      req.body.status ?? existing.status,
      Number(req.body.sort_order ?? existing.sort_order),
      nowIso(),
      req.params.id
    );
    logActivity(req, 'gallery_updated', 'gallery_item', req.params.id);
    res.json({ ok: true });
  });

  router.delete('/admin/gallery/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM gallery_items WHERE id = ?').run(req.params.id);
    logActivity(req, 'gallery_deleted', 'gallery_item', req.params.id);
    res.json({ ok: true });
  });

  // =========================================================================
  // ADMIN SERVICES CRUD
  // =========================================================================
  router.get('/admin/services', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const rows = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all() as Record<string, unknown>[];
    res.json({ services: rows.map(mapServiceRow) });
  });

  router.post('/admin/services', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = newId();
    const now = nowIso();
    const title = (req.body.title as string) || 'New Service';
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(0, 5)}`;
    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM services').get() as { m: number }).m;
    db.prepare(`
      INSERT INTO services (
        id, slug, title, short_description, full_description, icon_name, image_url,
        cta_label, cta_url, is_featured, status, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      slug,
      title,
      req.body.short_description || '',
      req.body.full_description || '',
      req.body.icon_name || 'Sparkles',
      req.body.image_url || '',
      req.body.cta_label || 'Discuss This Service',
      req.body.cta_url || '/contact',
      req.body.is_featured === false ? 0 : 1,
      req.body.status || 'published',
      Number(req.body.sort_order ?? maxOrder + 1),
      now,
      now
    );

    const features = (req.body.features as string[]) || [];
    const insFeat = db.prepare(`
      INSERT INTO service_features (id, service_id, feature_text, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    features.forEach((ft, idx) => {
      if (ft.trim()) insFeat.run(newId(), id, ft.trim(), idx + 1, now, now);
    });
    logActivity(req, 'service_created', 'service', id, { title });
    res.status(201).json({ id });
  });

  router.put('/admin/services/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as DbRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    const now = nowIso();
    db.prepare(`
      UPDATE services SET
        title = ?, short_description = ?, full_description = ?, icon_name = ?, image_url = ?,
        cta_label = ?, cta_url = ?, is_featured = ?, status = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.title ?? existing.title,
      req.body.short_description ?? existing.short_description,
      req.body.full_description ?? existing.full_description,
      req.body.icon_name ?? existing.icon_name,
      req.body.image_url ?? existing.image_url,
      req.body.cta_label ?? existing.cta_label,
      req.body.cta_url ?? existing.cta_url,
      typeof req.body.is_featured === 'boolean' ? (req.body.is_featured ? 1 : 0) : existing.is_featured,
      req.body.status ?? existing.status,
      Number(req.body.sort_order ?? existing.sort_order),
      now,
      req.params.id
    );

    if (Array.isArray(req.body.features)) {
      db.prepare('DELETE FROM service_features WHERE service_id = ?').run(req.params.id);
      const insFeat = db.prepare(`
        INSERT INTO service_features (id, service_id, feature_text, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      req.body.features.forEach((ft: string | { feature_text: string }, idx: number) => {
        const text = typeof ft === 'string' ? ft : ft.feature_text;
        if (text && text.trim()) insFeat.run(newId(), req.params.id, text.trim(), idx + 1, now, now);
      });
    }
    logActivity(req, 'service_updated', 'service', req.params.id);
    res.json({ ok: true });
  });

  router.delete('/admin/services/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    logActivity(req, 'service_deleted', 'service', req.params.id);
    res.json({ ok: true });
  });

  // =========================================================================
  // ADMIN TESTIMONIALS, SKILLS, TOOLS, TIMELINE, ABOUT
  // =========================================================================
  router.get('/admin/testimonials', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const rows = (
      db.prepare('SELECT * FROM testimonials ORDER BY sort_order ASC').all() as Record<string, unknown>[]
    ).map((t) => ({ ...t, is_featured: t.is_featured === 1, is_placeholder: t.is_placeholder === 1 }));
    res.json({ testimonials: rows });
  });

  router.post('/admin/testimonials', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = newId();
    const now = nowIso();
    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM testimonials').get() as { m: number }).m;
    db.prepare(`
      INSERT INTO testimonials (
        id, client_name, designation, company, photo_url, review, rating,
        is_featured, is_placeholder, status, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.body.client_name || 'Client',
      req.body.designation || '',
      req.body.company || '',
      req.body.photo_url || '',
      req.body.review || '',
      Number(req.body.rating ?? 5),
      req.body.is_featured === false ? 0 : 1,
      req.body.is_placeholder ? 1 : 0,
      req.body.status || 'published',
      maxOrder + 1,
      now,
      now
    );
    logActivity(req, 'testimonial_created', 'testimonial', id);
    res.status(201).json({ id });
  });

  router.put('/admin/testimonials/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id) as
      | DbRow
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Testimonial not found' });
      return;
    }
    db.prepare(`
      UPDATE testimonials SET
        client_name = ?, designation = ?, company = ?, photo_url = ?, review = ?,
        rating = ?, is_featured = ?, is_placeholder = ?, status = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.client_name ?? existing.client_name,
      req.body.designation ?? existing.designation,
      req.body.company ?? existing.company,
      req.body.photo_url ?? existing.photo_url,
      req.body.review ?? existing.review,
      Number(req.body.rating ?? existing.rating),
      typeof req.body.is_featured === 'boolean' ? (req.body.is_featured ? 1 : 0) : existing.is_featured,
      typeof req.body.is_placeholder === 'boolean' ? (req.body.is_placeholder ? 1 : 0) : existing.is_placeholder,
      req.body.status ?? existing.status,
      Number(req.body.sort_order ?? existing.sort_order),
      nowIso(),
      req.params.id
    );
    logActivity(req, 'testimonial_updated', 'testimonial', req.params.id);
    res.json({ ok: true });
  });

  router.delete('/admin/testimonials/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
    logActivity(req, 'testimonial_deleted', 'testimonial', req.params.id);
    res.json({ ok: true });
  });

  // Skills & Tools
  router.get('/admin/skills-tools', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const skills = (db.prepare('SELECT * FROM skills ORDER BY sort_order ASC').all() as Record<string, unknown>[]).map(
      (s) => ({ ...s, show_proficiency: s.show_proficiency === 1 })
    );
    const tools = db.prepare('SELECT * FROM tools ORDER BY sort_order ASC').all();
    res.json({ skills, tools });
  });

  router.post('/admin/skills', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = newId();
    const now = nowIso();
    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM skills').get() as { m: number }).m;
    db.prepare(`
      INSERT INTO skills (id, name, description, icon_name, proficiency, show_proficiency, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.body.name || 'New Skill',
      req.body.description || '',
      req.body.icon_name || 'Layers',
      req.body.proficiency !== undefined && req.body.proficiency !== null ? Number(req.body.proficiency) : null,
      req.body.show_proficiency ? 1 : 0,
      req.body.status || 'published',
      maxOrder + 1,
      now,
      now
    );
    logActivity(req, 'skill_created', 'skill', id);
    res.status(201).json({ id });
  });

  router.put('/admin/skills/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id) as DbRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    db.prepare(`
      UPDATE skills SET name = ?, description = ?, icon_name = ?, proficiency = ?, show_proficiency = ?, status = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.name ?? existing.name,
      req.body.description ?? existing.description,
      req.body.icon_name ?? existing.icon_name,
      req.body.proficiency !== undefined
        ? req.body.proficiency === null || req.body.proficiency === ''
          ? null
          : Number(req.body.proficiency)
        : existing.proficiency,
      typeof req.body.show_proficiency === 'boolean' ? (req.body.show_proficiency ? 1 : 0) : existing.show_proficiency,
      req.body.status ?? existing.status,
      Number(req.body.sort_order ?? existing.sort_order),
      nowIso(),
      req.params.id
    );
    res.json({ ok: true });
  });

  router.delete('/admin/skills/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  router.post('/admin/tools', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = newId();
    const now = nowIso();
    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM tools').get() as { m: number }).m;
    db.prepare(`
      INSERT INTO tools (id, name, category, icon_url, badge_text, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.body.name || 'New Tool',
      req.body.category || 'Creative & AI',
      req.body.icon_url || '',
      req.body.badge_text || '',
      req.body.status || 'published',
      maxOrder + 1,
      now,
      now
    );
    logActivity(req, 'tool_created', 'tool', id);
    res.status(201).json({ id });
  });

  router.put('/admin/tools/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as DbRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Tool not found' });
      return;
    }
    db.prepare(`
      UPDATE tools SET name = ?, category = ?, icon_url = ?, badge_text = ?, status = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.name ?? existing.name,
      req.body.category ?? existing.category,
      req.body.icon_url ?? existing.icon_url,
      req.body.badge_text ?? existing.badge_text,
      req.body.status ?? existing.status,
      Number(req.body.sort_order ?? existing.sort_order),
      nowIso(),
      req.params.id
    );
    res.json({ ok: true });
  });

  router.delete('/admin/tools/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // About & Timeline
  router.get('/admin/about', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const settings = getSiteSettingsRow();
    const timeline = db.prepare('SELECT * FROM timeline_items ORDER BY sort_order ASC').all();
    res.json({ settings, timeline });
  });

  router.put('/admin/about', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM site_settings LIMIT 1').get() as DbRow;
    db.prepare(`
      UPDATE site_settings SET
        about_heading = ?, about_bio = ?, about_mission = ?, about_portrait_url = ?,
        location = ?, contact_email = ?, experience_summary = ?, languages = ?,
        availability = ?, cv_url = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.about_heading ?? existing.about_heading,
      req.body.about_bio ?? existing.about_bio,
      req.body.about_mission ?? existing.about_mission,
      req.body.about_portrait_url ?? existing.about_portrait_url,
      req.body.location ?? existing.location,
      req.body.contact_email ?? existing.contact_email,
      req.body.experience_summary ?? existing.experience_summary,
      req.body.languages ?? existing.languages,
      req.body.availability ?? existing.availability,
      req.body.cv_url ?? existing.cv_url,
      nowIso(),
      existing.id
    );
    logActivity(req, 'about_updated', 'site_settings', existing.id as string);
    res.json({ ok: true });
  });

  router.post('/admin/timeline', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = newId();
    const now = nowIso();
    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM timeline_items').get() as { m: number }).m;
    db.prepare(`
      INSERT INTO timeline_items (id, year, role, description, image_url, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.body.year || '2026',
      req.body.role || 'Milestone',
      req.body.description || '',
      req.body.image_url || '',
      req.body.status || 'published',
      maxOrder + 1,
      now,
      now
    );
    res.status(201).json({ id });
  });

  router.put('/admin/timeline/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM timeline_items WHERE id = ?').get(req.params.id) as
      | DbRow
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Timeline item not found' });
      return;
    }
    db.prepare(`
      UPDATE timeline_items SET year = ?, role = ?, description = ?, image_url = ?, status = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.year ?? existing.year,
      req.body.role ?? existing.role,
      req.body.description ?? existing.description,
      req.body.image_url ?? existing.image_url,
      req.body.status ?? existing.status,
      Number(req.body.sort_order ?? existing.sort_order),
      nowIso(),
      req.params.id
    );
    res.json({ ok: true });
  });

  router.delete('/admin/timeline/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM timeline_items WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // =========================================================================
  // ADMIN CONTACT MESSAGES / LEAD CRM
  // =========================================================================
  router.get('/admin/messages', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const rows = db
      .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC')
      .all()
      .map((m: Record<string, unknown>) => ({ ...m, is_read: m.is_read === 1 }));
    res.json({ messages: rows });
  });

  router.patch('/admin/messages/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id) as
      | DbRow
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    db.prepare(`
      UPDATE contact_messages SET lead_status = ?, is_read = ?, internal_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.lead_status ?? existing.lead_status,
      typeof req.body.is_read === 'boolean' ? (req.body.is_read ? 1 : 0) : existing.is_read,
      req.body.internal_notes ?? existing.internal_notes,
      nowIso(),
      req.params.id
    );
    logActivity(req, 'lead_updated', 'contact_message', req.params.id, {
      lead_status: req.body.lead_status ?? existing.lead_status,
    });
    res.json({ ok: true });
  });

  router.delete('/admin/messages/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
    logActivity(req, 'lead_deleted', 'contact_message', req.params.id);
    res.json({ ok: true });
  });

  // =========================================================================
  // ADMIN NAVIGATION & WEBSITE SETTINGS (Super Admin for Settings)
  // =========================================================================
  router.get('/admin/navigation', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const items = db
      .prepare('SELECT * FROM navigation_items ORDER BY sort_order ASC')
      .all()
      .map((n: Record<string, unknown>) => ({
        ...n,
        is_cta: n.is_cta === 1,
        is_visible: n.is_visible === 1,
      }));
    res.json({ items });
  });

  router.put('/admin/navigation', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const items =
      (req.body.items as Array<{
        id?: string;
        label?: string;
        url?: string;
        is_cta?: boolean;
        is_visible?: boolean;
      }>) || [];
    const now = nowIso();
    db.prepare('DELETE FROM navigation_items').run();
    const ins = db.prepare(`
      INSERT INTO navigation_items (id, label, url, is_cta, is_visible, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    items.forEach((item, idx) => {
      ins.run(
        item.id || newId(),
        item.label || 'Link',
        item.url || '/',
        item.is_cta ? 1 : 0,
        item.is_visible === false ? 0 : 1,
        idx + 1,
        now,
        now
      );
    });
    logActivity(req, 'navigation_updated', 'navigation', 'menu');
    res.json({ ok: true });
  });

  router.get('/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    res.json({ settings: getSiteSettingsRow() });
  });

  router.put('/admin/settings', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM site_settings LIMIT 1').get() as DbRow;
    db.prepare(`
      UPDATE site_settings SET
        site_name = ?, logo_url = ?, favicon_url = ?, contact_email = ?, whatsapp_number = ?,
        location = ?, business_hours = ?, social_links = ?, seo_default_title = ?,
        seo_default_description = ?, google_analytics_id = ?, meta_pixel_id = ?,
        cloudflare_cdn_domain = ?, cloudflare_r2_public_url = ?, footer_intro = ?,
        copyright_text = ?, maintenance_mode = ?, theme_colors = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.body.site_name ?? existing.site_name,
      req.body.logo_url ?? existing.logo_url,
      req.body.favicon_url ?? existing.favicon_url,
      req.body.contact_email ?? existing.contact_email,
      req.body.whatsapp_number ?? existing.whatsapp_number,
      req.body.location ?? existing.location,
      req.body.business_hours ?? existing.business_hours,
      JSON.stringify(req.body.social_links ?? parseJson(existing.social_links, [])),
      req.body.seo_default_title ?? existing.seo_default_title,
      req.body.seo_default_description ?? existing.seo_default_description,
      req.body.google_analytics_id ?? existing.google_analytics_id,
      req.body.meta_pixel_id ?? existing.meta_pixel_id,
      req.body.cloudflare_cdn_domain ?? existing.cloudflare_cdn_domain,
      req.body.cloudflare_r2_public_url ?? existing.cloudflare_r2_public_url,
      req.body.footer_intro ?? existing.footer_intro,
      req.body.copyright_text ?? existing.copyright_text,
      typeof req.body.maintenance_mode === 'boolean'
        ? req.body.maintenance_mode
          ? 1
          : 0
        : existing.maintenance_mode,
      JSON.stringify(req.body.theme_colors ?? parseJson(existing.theme_colors, {})),
      nowIso(),
      existing.id
    );
    logActivity(req, 'settings_updated', 'site_settings', existing.id as string);
    res.json({ settings: getSiteSettingsRow(), message: 'Website settings saved.' });
  });

  // =========================================================================
  // ADMIN USERS & INVITATIONS (Super Admin Only)
  // =========================================================================
  router.get('/admin/users', requireSuperAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const users = db
      .prepare(
        'SELECT id, email, full_name, role, avatar_url, is_active, email_verified, last_login_at, created_at FROM profiles ORDER BY created_at ASC'
      )
      .all()
      .map((u: Record<string, unknown>) => ({
        ...u,
        is_active: u.is_active === 1,
        email_verified: u.email_verified === 1,
      }));
    const invitations = db
      .prepare('SELECT * FROM admin_invitations ORDER BY created_at DESC')
      .all();
    res.json({ users, invitations });
  });

  router.post('/admin/invitations', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      email: z.string().email(),
      role: z.enum(['super_admin', 'editor']).default('editor'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email and role required.' });
      return;
    }
    const id = newId();
    const token = crypto.randomBytes(18).toString('hex');
    const now = nowIso();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO admin_invitations (id, email, role, token, invited_by, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, parsed.data.email.trim().toLowerCase(), parsed.data.role, token, req.admin?.id || null, expires, now, now);

    logActivity(req, 'admin_invited', 'admin_invitation', id, {
      email: parsed.data.email,
      role: parsed.data.role,
    });
    res.status(201).json({ id, token, email: parsed.data.email, role: parsed.data.role, expires_at: expires });
  });

  router.patch('/admin/users/:id', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
    if (req.params.id === req.admin?.id && req.body.is_active === false) {
      res.status(400).json({ error: 'You cannot deactivate your own active Super Admin session.' });
      return;
    }
    const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id) as
      | DbRow
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    db.prepare('UPDATE profiles SET role = ?, is_active = ?, updated_at = ? WHERE id = ?').run(
      req.body.role ?? existing.role,
      typeof req.body.is_active === 'boolean' ? (req.body.is_active ? 1 : 0) : existing.is_active,
      nowIso(),
      req.params.id
    );
    logActivity(req, 'admin_user_updated', 'profile', req.params.id, {
      role: req.body.role ?? existing.role,
      is_active: req.body.is_active,
    });
    res.json({ ok: true });
  });

  router.delete('/admin/invitations/:id', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
    db.prepare('DELETE FROM admin_invitations WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // =========================================================================
  // MEDIA LIBRARY, FILE UPLOAD, GOOGLE DRIVE & CLOUDFLARE CDN
  // =========================================================================
  router.get('/admin/media', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const cdn = getCdnDomain();
    const assets = (
      db.prepare('SELECT * FROM media_assets ORDER BY created_at DESC').all() as Record<string, unknown>[]
    ).map((a) => ({
      ...a,
      cdn_url: resolveCdnUrl(a.url as string, cdn),
    }));
    res.json({ assets });
  });

  router.post(
    '/admin/media/upload',
    requireAdmin,
    upload.array('files', 12),
    (req: AuthenticatedRequest, res: Response) => {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        res.status(400).json({ error: 'No files uploaded.' });
        return;
      }
      const cdn = getCdnDomain();
      const folder = (req.body.folder as string) || 'uploads';
      const now = nowIso();
      const created: Record<string, unknown>[] = [];

      const ins = db.prepare(`
        INSERT INTO media_assets (
          id, title, url, cdn_url, storage_provider, file_type, mime_type,
          file_size_bytes, alt_text, folder, uploaded_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const f of files) {
        const id = newId();
        const url = `/uploads/${f.filename}`;
        const cdnUrl = resolveCdnUrl(url, cdn);
        const fileType = f.mimetype.startsWith('video/')
          ? 'video'
          : f.mimetype === 'application/pdf'
            ? 'pdf'
            : 'image';
        const title = (req.body.title as string) || f.originalname.replace(/\.[^.]+$/, '');
        ins.run(
          id,
          title,
          url,
          cdnUrl,
          cdn ? 'cloudflare_r2' : 'local',
          fileType,
          f.mimetype,
          f.size,
          (req.body.alt_text as string) || title,
          folder,
          req.admin?.id || null,
          now,
          now
        );
        created.push({ id, title, url, cdn_url: cdnUrl, file_type: fileType });
      }
      logActivity(req, 'media_uploaded', 'media_asset', created[0]?.id as string, { count: created.length });
      res.status(201).json({ assets: created });
    }
  );

  router.post('/admin/media/gdrive', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      url: z.string().url(),
      title: z.string().min(1).max(160),
      file_type: z.enum(['image', 'video', 'pdf', 'document']).default('pdf'),
      folder: z.string().default('google-drive'),
      alt_text: z.string().optional().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Valid Google Drive URL and title required.' });
      return;
    }

    try {
      const info = await verifyGoogleDriveFile(parsed.data.url);
      if (!info.accessible) {
        res.status(422).json({
          error: info.warning || 'Google Drive file is private or inaccessible.',
          driveInfo: info,
        });
        return;
      }

      const id = newId();
      const now = nowIso();
      const publicUrl =
        parsed.data.file_type === 'image' ? info.directImageUrl : info.embedUrl;

      db.prepare(`
        INSERT INTO media_assets (
          id, title, url, cdn_url, storage_provider, file_type, mime_type,
          file_size_bytes, alt_text, folder, drive_file_id, drive_embed_url,
          drive_open_url, uploaded_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'google_drive', ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        parsed.data.title.trim(),
        publicUrl,
        publicUrl,
        parsed.data.file_type,
        parsed.data.file_type === 'pdf' ? 'application/pdf' : 'application/octet-stream',
        parsed.data.alt_text || parsed.data.title,
        parsed.data.folder,
        info.fileId,
        info.embedUrl,
        info.openUrl,
        req.admin?.id || null,
        now,
        now
      );

      logActivity(req, 'gdrive_asset_added', 'media_asset', id, { drive_file_id: info.fileId });
      res.status(201).json({
        id,
        url: publicUrl,
        drive_file_id: info.fileId,
        drive_embed_url: info.embedUrl,
        drive_open_url: info.openUrl,
        warning: info.warning,
      });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch('/admin/media/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(req.params.id) as
      | DbRow
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Media asset not found' });
      return;
    }
    db.prepare('UPDATE media_assets SET title = ?, alt_text = ?, folder = ?, updated_at = ? WHERE id = ?').run(
      req.body.title ?? existing.title,
      req.body.alt_text ?? existing.alt_text,
      req.body.folder ?? existing.folder,
      nowIso(),
      req.params.id
    );
    res.json({ ok: true });
  });

  router.delete('/admin/media/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT url, storage_provider FROM media_assets WHERE id = ?').get(req.params.id) as
      | { url: string; storage_provider: string }
      | undefined;
    if (existing && existing.storage_provider === 'local' && existing.url.startsWith('/uploads/')) {
      const target = path.resolve(process.cwd(), 'public', existing.url.replace(/^\/+/, ''));
      if (fs.existsSync(target)) {
        try {
          fs.unlinkSync(target);
        } catch {
          // ignore fs unlink errors
        }
      }
    }
    db.prepare('DELETE FROM media_assets WHERE id = ?').run(req.params.id);
    logActivity(req, 'media_deleted', 'media_asset', req.params.id);
    res.json({ ok: true });
  });

  return router;
}
