export type UserRole = 'super_admin' | 'editor';
export type ContentStatus = 'draft' | 'published';

export type SectionType =
  | 'hero'
  | 'text_image'
  | 'image_gallery'
  | 'project_grid'
  | 'video_gallery'
  | 'services_grid'
  | 'testimonials'
  | 'statistics'
  | 'timeline'
  | 'cta'
  | 'contact_form';

export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  invited_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  seo_title: string;
  meta_description: string;
  banner_image_url: string;
  is_system: boolean;
  is_enabled: boolean;
  status: ContentStatus;
  draft_data: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  sections?: PageSection[];
}

export interface PageSection {
  id: string;
  page_id: string;
  section_type: SectionType;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  background_color: string;
  text_alignment: 'left' | 'center' | 'right';
  layout_variant: string;
  cta_label: string;
  cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  config_json: Record<string, unknown>;
  is_visible: boolean;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HeroContent {
  id: string;
  intro_text: string;
  main_heading: string;
  supporting_heading: string;
  description: string;
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  portrait_url: string;
  background_image_url: string;
  background_color: string;
  crop_x: number;
  crop_y: number;
  zoom: number;
  floating_labels: string[];
  social_links: SocialLink[];
  animation_enabled: boolean;
  status: ContentStatus;
  draft_data: Partial<HeroContent> | null;
  updated_at: string;
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  media_type: 'image' | 'video' | 'embed' | 'gdrive_pdf';
  url: string;
  drive_file_id: string;
  caption: string;
  sort_order: number;
}

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectRecord {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  category_id: string | null;
  category_name: string;
  short_description: string;
  overview: string;
  challenge: string;
  strategy: string;
  creative_execution: string;
  deliverables: string[];
  tools_used: string[];
  metrics: ProjectMetric[];
  thumbnail_url: string;
  external_url: string;
  drive_doc_url: string;
  drive_file_id: string;
  completion_date: string;
  is_featured: boolean;
  is_demo: boolean;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  media?: ProjectMedia[];
}

export interface GalleryItem {
  id: string;
  title: string;
  category_id: string | null;
  category_name: string;
  description: string;
  media_type: 'image' | 'video' | 'embed';
  media_url: string;
  thumbnail_url: string;
  embed_url: string;
  drive_file_id: string;
  tool_used: string;
  tags: string[];
  creation_date: string;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceFeature {
  id: string;
  service_id: string;
  feature_text: string;
  sort_order: number;
}

export interface ServiceRecord {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  icon_name: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
  is_featured: boolean;
  status: ContentStatus;
  sort_order: number;
  features: ServiceFeature[];
}

export interface TestimonialRecord {
  id: string;
  client_name: string;
  designation: string;
  company: string;
  photo_url: string;
  review: string;
  rating: number;
  is_featured: boolean;
  is_placeholder: boolean;
  status: ContentStatus;
  sort_order: number;
}

export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  proficiency: number | null;
  show_proficiency: boolean;
  status: ContentStatus;
  sort_order: number;
}

export interface ToolRecord {
  id: string;
  name: string;
  category: string;
  icon_url: string;
  badge_text: string;
  status: ContentStatus;
  sort_order: number;
}

export interface TimelineItem {
  id: string;
  year: string;
  role: string;
  description: string;
  image_url: string;
  status: ContentStatus;
  sort_order: number;
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  company: string;
  service_required: string;
  estimated_budget: string;
  project_details: string;
  lead_status: 'new' | 'contacted' | 'qualified' | 'archived';
  is_read: boolean;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  is_cta: boolean;
  is_visible: boolean;
  sort_order: number;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  logo_url: string;
  favicon_url: string;
  contact_email: string;
  whatsapp_number: string;
  location: string;
  languages: string;
  availability: string;
  experience_summary: string;
  cv_url: string;
  business_hours: string;
  about_heading: string;
  about_bio: string;
  about_mission: string;
  about_portrait_url: string;
  social_links: SocialLink[];
  seo_default_title: string;
  seo_default_description: string;
  google_analytics_id: string;
  meta_pixel_id: string;
  cloudflare_cdn_domain: string;
  cloudflare_r2_public_url: string;
  footer_intro: string;
  copyright_text: string;
  maintenance_mode: boolean;
  theme_colors: Record<string, string>;
}

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  cdn_url: string;
  storage_provider: 'local' | 'supabase_storage' | 'cloudflare_r2' | 'google_drive' | 'external';
  file_type: 'image' | 'video' | 'pdf' | 'document';
  mime_type: string;
  file_size_bytes: number;
  alt_text: string;
  folder: string;
  drive_file_id: string;
  drive_embed_url: string;
  drive_open_url: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface PublicBootstrapPayload {
  settings: SiteSettings;
  navigation: NavigationItem[];
  hero: HeroContent;
  pages: PageRecord[];
  featuredProjects: ProjectRecord[];
  services: ServiceRecord[];
  skills: SkillRecord[];
  tools: ToolRecord[];
  testimonials: TestimonialRecord[];
  timeline: TimelineItem[];
}
