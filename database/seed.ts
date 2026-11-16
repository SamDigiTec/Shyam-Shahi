import { db, newId, nowIso } from './db.ts';

const IMG_HERO = '/src/assets/images/hero_shyam_portrait_1794707177207.jpg';
const IMG_HERO_PORTRAIT = '/assets/aistudio/Shyam_Shahi_b9fbadd2.png';
const IMG_SOCIAL = '/src/assets/images/project_social_campaign_1794707177094.jpg';
const IMG_AI_VISUAL = '/src/assets/images/project_ai_visuals_1794707179717.jpg';
const IMG_AI_VIDEO = '/src/assets/images/project_ai_video_1794707178400.jpg';
const IMG_BRANDING = '/src/assets/images/project_graphic_branding_1794707178923.jpg';
const IMG_AUTOMATION = '/src/assets/images/project_whatsapp_automation_1794707180131.jpg';

export function seedDatabaseIfEmpty(): void {
  const existingSettings = db.prepare('SELECT COUNT(*) as cnt FROM site_settings').get() as { cnt: number };
  if (existingSettings.cnt > 0) {
    return;
  }

  const now = nowIso();

  // 1. Site Settings
  db.prepare(`
    INSERT INTO site_settings (
      id, site_name, logo_url, favicon_url, contact_email, whatsapp_number, location,
      languages, availability, experience_summary, cv_url, business_hours,
      about_heading, about_bio, about_mission, about_portrait_url, social_links,
      seo_default_title, seo_default_description, google_analytics_id, meta_pixel_id,
      cloudflare_cdn_domain, cloudflare_r2_public_url, footer_intro, copyright_text,
      maintenance_mode, theme_colors, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId(),
    'SHYAM SHAHI',
    '',
    '',
    'samsalewayscnc@gmail.com',
    '+977 9825419779',
    'Madhyapur Thimi-4, Bhaktapur, Nepal',
    'English, Nepali',
    'Available for Brand Retainers & AI Creative Projects',
    'Social Media Strategy, AI Production & Marketing Automation',
    '',
    'Mon – Sat',
    "Let's turn your business goals into digital opportunities..",
    `I am Shyam Shahi, a passionate Social Media Marketing Manager specializing in social media strategy, AI-powered content creation, and marketing automation.\n\nI help businesses build a strong digital presence through strategic marketing, engaging content, and intelligent automation. My approach combines creative storytelling with data-driven marketing strategies to attract the right audience, increase brand awareness, generate quality leads, and support business growth.\n\nFrom developing comprehensive marketing funnels and conducting competitor research to creating scroll-stopping AI-generated images and videos, I enjoy transforming marketing ideas into practical digital experiences.\n\nMy expertise also includes Facebook, Instagram, and LinkedIn campaign management, WhatsApp Business API automation, email marketing, and landing page design.\n\nI continuously explore emerging AI tools and digital marketing trends to create smarter, more engaging, and efficient marketing solutions.`,
    'My Mission: To help businesses grow digitally by combining strategic marketing, creative AI content, and powerful automation.',
    IMG_HERO_PORTRAIT,
    JSON.stringify([
      { platform: 'Instagram', url: 'https://instagram.com', label: 'Instagram' },
      { platform: 'LinkedIn', url: 'https://linkedin.com', label: 'LinkedIn' },
      { platform: 'YouTube', url: 'https://youtube.com', label: 'YouTube' },
      { platform: 'Behance', url: 'https://behance.net', label: 'Behance' },
    ]),
    'Shyam Shahi | Social Media Manager & AI Content Creator',
    'Portfolio of Shyam Shahi — combining social media strategy, AI-powered visuals & video, creative direction, and WhatsApp Business automation.',
    '',
    '',
    '',
    '',
    'Combining creative storytelling, strategic marketing, AI-powered production, and intelligent automation to help brands grow.',
    '© 2026 Shyam Shahi. All rights reserved.',
    0,
    JSON.stringify({
      primaryBg: '#06152B',
      secondaryBg: '#0B1F3A',
      cardBg: '#0D2747',
      primaryAccent: '#2878FF',
      secondaryAccent: '#00B8FF',
      primaryText: '#F5F8FF',
      secondaryText: '#A9BBD3',
      border: '#24466C',
    }),
    now,
    now
  );

  // 2. Hero Content
  db.prepare(`
    INSERT INTO hero_content (
      id, intro_text, main_heading, supporting_heading, description,
      primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url,
      portrait_url, background_image_url, background_color, crop_x, crop_y, zoom,
      floating_labels, social_links, animation_enabled, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId(),
    'Turning Creative Ideas Into Digital Growth.',
    'HI, I am SHYAM SHAHI',
    'Social Media Manager | AI Content Creator',
    'I combine marketing strategy, AI-powered creativity, and intelligent automation to help businesses build their online presence and connect with their ideal customers.\nFrom social media campaigns and marketing funnels to AI-generated videos, images, and WhatsApp automation, I create digital marketing solutions designed to turn attention into opportunities.',
    'Explore My Work',
    '/projects',
    "Let's Work Together",
    '/contact',
    IMG_HERO_PORTRAIT,
    '',
    '#06152B',
    50,
    12,
    1.0,
    JSON.stringify(['AI Content Creator', 'Social Media Strategy', 'Digital Growth']),
    JSON.stringify([
      { platform: 'Instagram', url: 'https://instagram.com' },
      { platform: 'LinkedIn', url: 'https://linkedin.com' },
      { platform: 'YouTube', url: 'https://youtube.com' },
      { platform: 'WhatsApp', url: 'https://wa.me/' },
    ]),
    1,
    'published',
    now,
    now
  );

  // 3. Navigation Items
  const navItems = [
    { label: 'HOME', url: '/', is_cta: 0, sort_order: 1 },
    { label: 'ABOUT', url: '/about', is_cta: 0, sort_order: 2 },
    { label: 'PROJECTS', url: '/projects', is_cta: 0, sort_order: 3 },
    { label: 'SERVICES', url: '/services', is_cta: 0, sort_order: 4 },
    { label: 'CONTACT', url: '/contact', is_cta: 1, sort_order: 5 },
  ];
  const insertNav = db.prepare(`
    INSERT INTO navigation_items (id, label, url, is_cta, is_visible, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
  `);
  for (const item of navItems) {
    insertNav.run(newId(), item.label, item.url, item.is_cta, item.sort_order, now, now);
  }

  // 4. Pages
  const pagesSeed = [
    {
      slug: 'home',
      title: 'Home',
      seo_title: 'Shyam Shahi | Social Media Manager & AI Content Creator',
      meta_description: 'Combining marketing strategy, AI-powered creativity, and WhatsApp automation to help businesses grow digitally.',
      is_system: 1,
      sort_order: 1,
    },
    {
      slug: 'about',
      title: 'About',
      seo_title: 'About Shyam Shahi | Social Media Strategist & AI Creator',
      meta_description: 'Learn about Shyam Shahi, his creative philosophy, marketing journey, and AI content toolkit.',
      is_system: 1,
      sort_order: 2,
    },
    {
      slug: 'projects',
      title: 'Projects',
      seo_title: 'Projects & Case Studies | Shyam Shahi Studio',
      meta_description: 'Explore selected social media campaigns, AI image direction, AI video reels, and marketing automation workflows.',
      is_system: 1,
      sort_order: 3,
    },
    {
      slug: 'services',
      title: 'Services',
      seo_title: 'Services | Social Media Management, AI Content & Automation',
      meta_description: 'Full-funnel social media management, AI image and video creation, graphic design, and WhatsApp Business API automation.',
      is_system: 1,
      sort_order: 4,
    },
    {
      slug: 'contact',
      title: 'Contact',
      seo_title: 'Contact Shyam Shahi | Start a Project',
      meta_description: 'Get in touch with Shyam Shahi for social media campaigns, AI creative production, and WhatsApp automation.',
      is_system: 1,
      sort_order: 5,
    },
  ];

  const insertPage = db.prepare(`
    INSERT INTO pages (id, slug, title, seo_title, meta_description, is_system, is_enabled, status, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'published', ?, ?, ?)
  `);
  const pageIds: Record<string, string> = {};
  for (const p of pagesSeed) {
    const id = newId();
    pageIds[p.slug] = id;
    insertPage.run(id, p.slug, p.title, p.seo_title, p.meta_description, p.is_system, p.sort_order, now, now);
  }

  // Default Home Page Sections (manageable & reorderable in Admin CMS)
  const insertSection = db.prepare(`
    INSERT INTO page_sections (
      id, page_id, section_type, title, subtitle, description, image_url,
      background_color, text_alignment, layout_variant, cta_label, cta_url,
      config_json, is_visible, status, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'published', ?, ?, ?)
  `);

  const homeSections = [
    {
      type: 'hero',
      title: 'Hero Showcase',
      subtitle: 'Turning Creative Ideas Into Digital Growth.',
      description: 'Dynamic hero profile, portrait, and primary CTAs controlled via Hero Editor.',
      cta_label: 'Explore My Work',
      cta_url: '/projects',
      sort_order: 1,
    },
    {
      type: 'project_grid',
      title: 'Selected Works',
      subtitle: 'A collection of creative campaigns, strategic projects, and AI-powered content.',
      description: 'Six featured works pulled dynamically from your Projects library.',
      cta_label: 'View All Projects',
      cta_url: '/projects',
      sort_order: 2,
    },
    {
      type: 'statistics',
      title: 'My Creative Toolkit',
      subtitle: 'Core Disciplines & Capabilities',
      description: 'Managed dynamically through Skills & Tools in the Admin CMS.',
      cta_label: '',
      cta_url: '',
      sort_order: 3,
    },
    {
      type: 'services_grid',
      title: 'Creative Solutions for Digital Growth',
      subtitle: 'Services Preview',
      description: 'From social media strategy to AI creative production and WhatsApp automation.',
      cta_label: 'Explore All Services',
      cta_url: '/services',
      sort_order: 4,
    },
    {
      type: 'testimonials',
      title: 'Client Perspectives',
      subtitle: 'Testimonials',
      description: 'Editable client reviews managed in the Testimonials section.',
      cta_label: '',
      cta_url: '',
      sort_order: 5,
    },
    {
      type: 'cta',
      title: "Let's Build Something Extraordinary.",
      subtitle: 'Ready to collaborate?',
      description: 'Have a brand, project, or creative idea in mind? Let\'s turn it into something impactful.',
      cta_label: 'Start a Conversation',
      cta_url: '/contact',
      sort_order: 6,
    },
  ];
  for (const s of homeSections) {
    insertSection.run(
      newId(),
      pageIds.home,
      s.type,
      s.title,
      s.subtitle,
      s.description,
      '',
      '#06152B',
      'left',
      'default',
      s.cta_label,
      s.cta_url,
      '{}',
      s.sort_order,
      now,
      now
    );
  }

  // 5. Project Categories
  const projCats = [
    'Social Media Management',
    'AI Images',
    'AI Videos',
    'Graphic Design',
    'Content Strategy',
    'Automation',
  ];
  const catIds: Record<string, string> = {};
  const insertProjCat = db.prepare(`
    INSERT INTO project_categories (id, name, slug, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  projCats.forEach((name, idx) => {
    const id = newId();
    catIds[name] = id;
    insertProjCat.run(id, name, name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), idx + 1, now, now);
  });

  // 6. Demo Projects (6 featured sample case studies — clearly marked is_demo = 1 for easy editing/replacement)
  const projectsSeed = [
    {
      slug: 'aurora-fashion-social-launch',
      title: 'Aurora Editorial Social Campaign',
      client_name: 'Demo Brand — Aurora Apparel (Sample Case Study)',
      category_name: 'Social Media Management',
      short_description: 'Full-funnel Instagram & Meta launch architecture combining editorial grid direction, short-form Reels scripting, and creator seeding.',
      overview: 'Sample case study template demonstrating a multi-channel social media launch framework across Instagram, Facebook, and Meta Ads Manager.',
      challenge: 'Establishing cohesive visual storytelling and consistent weekly publishing cadence across carousel posts, Reels, and Stories.',
      strategy: 'Structured a 4-pillar monthly content calendar pairing editorial lookbooks with high-retention vertical video hooks.',
      creative_execution: 'Designed modular carousel templates, authored conversion-focused captions, and coordinated Meta campaign assets.',
      deliverables: ['Monthly Content Calendar', '18 Instagram Carousel & Story Assets', '8 Short-Form Video Scripts', 'Meta Campaign Creative Kit'],
      tools_used: ['Meta Business Suite', 'Canva', 'CapCut', 'Adobe Photoshop'],
      metrics: [{ label: 'Sample Template', value: 'Add verified metrics in Admin CMS' }],
      thumbnail_url: IMG_SOCIAL,
      completion_date: '2026-09',
      is_featured: 1,
      sort_order: 1,
    },
    {
      slug: 'onyx-nuit-ai-product-direction',
      title: 'Onyx Nuit AI Product Photography',
      client_name: 'Demo Concept — Vestige Fragrance (AI Showcase)',
      category_name: 'AI Images',
      short_description: 'Photorealistic AI product photography and studio lighting direction replacing high-overhead physical set builds for commercial ad creatives.',
      overview: 'Demonstrates AI-directed commercial product imagery engineered for luxury beauty and fragrance performance ads.',
      challenge: 'Producing studio-grade dark-basalt and caustic-light ad visuals across multiple seasonal themes without studio logistics.',
      strategy: 'Developed consistent prompt architecture, lighting controls, and post-production compositing pipelines.',
      creative_execution: 'Generated high-resolution hero stills in Midjourney & Google AI Studio, refined typography and bottle label fidelity in Photoshop.',
      deliverables: ['12 Hero Product Visuals', 'Meta & Display Ad Variations', 'Art Direction Prompt System'],
      tools_used: ['Google AI Studio', 'Midjourney', 'Adobe Photoshop'],
      metrics: [{ label: 'Sample Template', value: 'Add verified metrics in Admin CMS' }],
      thumbnail_url: IMG_AI_VISUAL,
      completion_date: '2026-10',
      is_featured: 1,
      sort_order: 2,
    },
    {
      slug: 'kinetic-brand-ai-video-reel',
      title: 'AI Commercial Video Storytelling Reel',
      client_name: 'Demo Concept — Studio Motion Series',
      category_name: 'AI Videos',
      short_description: 'Image-to-video commercial storytelling workflow combining AI scene synthesis, voiceover pacing, and precision short-form editing.',
      overview: 'Sample AI video production pipeline turning static brand key visuals into dynamic 9:16 and 16:9 promotional films.',
      challenge: 'Delivering high-retention video hooks within the first 2 seconds for social feeds and paid social placements.',
      strategy: 'Storyboarded 5-beat narrative arcs with AI keyframe generation, smooth camera motion synthesis, and rhythmic sound design.',
      creative_execution: 'Edited and color-graded final deliverables in Premiere Pro and CapCut with burned-in kinetic captions.',
      deliverables: ['30s Brand Launch Film', '3 Vertical 9:16 Reels Cuts', 'Storyboard & Motion Prompt Deck'],
      tools_used: ['Google AI Studio', 'Premiere Pro', 'CapCut'],
      metrics: [{ label: 'Sample Template', value: 'Add verified metrics in Admin CMS' }],
      thumbnail_url: IMG_AI_VIDEO,
      completion_date: '2026-10',
      is_featured: 1,
      sort_order: 3,
    },
    {
      slug: 'aethel-architectural-brand-kit',
      title: 'Aethel Brand Visuals & Poster System',
      client_name: 'Demo Concept — Aethel Studio',
      category_name: 'Graphic Design',
      short_description: 'Cohesive dark-navy and cobalt visual identity system spanning promotional posters, digital collateral, and packaging visuals.',
      overview: 'Sample graphic design and creative direction showcase focusing on typographic discipline and modular campaign layouts.',
      challenge: 'Unifying print-style editorial elegance with fast-turnaround digital advertising formats.',
      strategy: 'Built a scalable grid, palette, and typographic hierarchy adaptable across Instagram, LinkedIn, and pitch decks.',
      creative_execution: 'Crafted master templates in Illustrator and Photoshop with reusable brand guidelines.',
      deliverables: ['Brand Visual System', 'Campaign Poster Suite', 'LinkedIn & Carousel Templates'],
      tools_used: ['Adobe Illustrator', 'Adobe Photoshop', 'Canva'],
      metrics: [{ label: 'Sample Template', value: 'Add verified metrics in Admin CMS' }],
      thumbnail_url: IMG_BRANDING,
      completion_date: '2026-08',
      is_featured: 1,
      sort_order: 4,
    },
    {
      slug: 'whatsapp-lead-qualification-funnel',
      title: 'WhatsApp Business API Lead Funnel',
      client_name: 'Demo Workflow — Automated CRM Pipeline',
      category_name: 'Automation',
      short_description: 'Automated WhatsApp Business API conversation flow qualifying inbound ad clicks, capturing requirements, and routing hot leads.',
      overview: 'End-to-end marketing automation blueprint connecting Meta Click-to-WhatsApp ads with structured automated intake workflows.',
      challenge: 'Eliminating slow manual lead response times and organizing inbound inquiries by budget and service intent.',
      strategy: 'Designed a conversational decision tree with instant service menus, automated follow-up reminders, and CRM handoff.',
      creative_execution: 'Configured message templates, trigger keywords, and multi-step lead tagging logic.',
      deliverables: ['WhatsApp API Flow Architecture', 'Approved Template Copy', 'Lead Qualification Logic'],
      tools_used: ['WhatsApp Business API', 'Meta Business Suite', 'ChatGPT'],
      metrics: [{ label: 'Sample Template', value: 'Add verified metrics in Admin CMS' }],
      thumbnail_url: IMG_AUTOMATION,
      completion_date: '2026-11',
      is_featured: 1,
      sort_order: 5,
    },
    {
      slug: 'omnibus-growth-content-engine',
      title: 'Full-Funnel Content & Growth Strategy',
      client_name: 'Demo Blueprint — Multi-Platform Funnel',
      category_name: 'Content Strategy',
      short_description: 'Integrated content strategy bridging awareness Reels, educational LinkedIn carousels, landing pages, and email nurture.',
      overview: 'Sample strategic blueprint aligning organic social content with conversion-ready landing pages and lead capture.',
      challenge: 'Bridging top-of-funnel attention with structured conversion touchpoints across social, landing pages, and messaging.',
      strategy: 'Mapped TOFU/MOFU/BOFU content pillars supported by AI-assisted research and weekly analytics reviews.',
      creative_execution: 'Built campaign calendar, landing page wireframe copy, and nurture sequence assets.',
      deliverables: ['90-Day Content Roadmap', 'Funnel Architecture Map', 'Campaign Reporting Framework'],
      tools_used: ['ChatGPT', 'Google AI Studio', 'Meta Business Suite', 'Canva'],
      metrics: [{ label: 'Sample Template', value: 'Add verified metrics in Admin CMS' }],
      thumbnail_url: IMG_SOCIAL,
      completion_date: '2026-09',
      is_featured: 1,
      sort_order: 6,
    },
  ];

  const insertProject = db.prepare(`
    INSERT INTO projects (
      id, slug, title, client_name, category_id, category_name, short_description,
      overview, challenge, strategy, creative_execution, deliverables, tools_used,
      metrics, thumbnail_url, completion_date, is_featured, is_demo, status, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'published', ?, ?, ?)
  `);
  const insertProjectMedia = db.prepare(`
    INSERT INTO project_media (id, project_id, media_type, url, caption, sort_order, created_at, updated_at)
    VALUES (?, ?, 'image', ?, ?, ?, ?, ?)
  `);

  projectsSeed.forEach((p) => {
    const pid = newId();
    insertProject.run(
      pid,
      p.slug,
      p.title,
      p.client_name,
      catIds[p.category_name] || null,
      p.category_name,
      p.short_description,
      p.overview,
      p.challenge,
      p.strategy,
      p.creative_execution,
      JSON.stringify(p.deliverables),
      JSON.stringify(p.tools_used),
      JSON.stringify(p.metrics),
      p.thumbnail_url,
      p.completion_date,
      p.is_featured,
      p.sort_order,
      now,
      now
    );
    insertProjectMedia.run(newId(), pid, p.thumbnail_url, `${p.title} — Primary Showcase`, 1, now, now);
  });

  // 7. Gallery Categories & Demo Items
  const galCats = [
    'AI-Generated Images',
    'AI Videos',
    'Social Media Creatives',
    'Posters & Advertisements',
    'Branding & Graphic Design',
    'Marketing Campaigns',
    'Reels & Short Videos',
  ];
  const galCatIds: Record<string, string> = {};
  const insertGalCat = db.prepare(`
    INSERT INTO gallery_categories (id, name, slug, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  galCats.forEach((name, idx) => {
    const id = newId();
    galCatIds[name] = id;
    insertGalCat.run(id, name, name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), idx + 1, now, now);
  });

  const gallerySeed = [
    {
      title: 'Onyx Nuit — AI Studio Product Shot',
      category_name: 'AI-Generated Images',
      description: 'Commercial AI product visualization on volcanic basalt with cobalt caustic light reflections.',
      media_type: 'image',
      media_url: IMG_AI_VISUAL,
      tool_used: 'Midjourney · Photoshop',
      tags: ['AI Photography', 'Luxury Product', 'Ad Creative'],
      creation_date: '2026-10',
    },
    {
      title: 'Aurora Editorial — Multi-Device Social Grid',
      category_name: 'Social Media Creatives',
      description: 'Cohesive campaign grid and story architecture designed for brand launches.',
      media_type: 'image',
      media_url: IMG_SOCIAL,
      tool_used: 'Canva · Photoshop',
      tags: ['Instagram Grid', 'Campaign', 'Editorial'],
      creation_date: '2026-09',
    },
    {
      title: 'Aethel — Brand Identity & Print Suite',
      category_name: 'Branding & Graphic Design',
      description: 'Deep navy and electric cobalt visual identity mockups and typographic poster layouts.',
      media_type: 'image',
      media_url: IMG_BRANDING,
      tool_used: 'Adobe Illustrator',
      tags: ['Brand Identity', 'Typography', 'Print'],
      creation_date: '2026-08',
    },
    {
      title: 'AI Storyboard & Color Grade Workflow',
      category_name: 'AI Videos',
      description: 'Motion storyboard and post-production timeline for AI-assisted video commercials.',
      media_type: 'image',
      media_url: IMG_AI_VIDEO,
      tool_used: 'Google AI Studio · Premiere Pro',
      tags: ['AI Video', 'Commercial', 'Color Grading'],
      creation_date: '2026-10',
    },
    {
      title: 'WhatsApp Conversational Funnel UI',
      category_name: 'Marketing Campaigns',
      description: 'Automated customer qualification journey triggered from Meta click-to-message ads.',
      media_type: 'image',
      media_url: IMG_AUTOMATION,
      tool_used: 'WhatsApp Business API',
      tags: ['Automation', 'Lead Funnel', 'CRM'],
      creation_date: '2026-11',
    },
    {
      title: 'Studio Creative Direction Portrait',
      category_name: 'Posters & Advertisements',
      description: 'High-contrast studio portrait lighting with deep cobalt rim accents.',
      media_type: 'image',
      media_url: IMG_HERO,
      tool_used: 'Studio Direction · Lightroom',
      tags: ['Portrait', 'Personal Brand', 'Lighting'],
      creation_date: '2026-11',
    },
  ];
  const insertGallery = db.prepare(`
    INSERT INTO gallery_items (
      id, title, category_id, category_name, description, media_type, media_url,
      thumbnail_url, tool_used, tags, creation_date, status, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)
  `);
  gallerySeed.forEach((g, idx) => {
    insertGallery.run(
      newId(),
      g.title,
      galCatIds[g.category_name] || null,
      g.category_name,
      g.description,
      g.media_type,
      g.media_url,
      g.media_url,
      g.tool_used,
      JSON.stringify(g.tags),
      g.creation_date,
      idx + 1,
      now,
      now
    );
  });

  // 8. Services (4 primary services with full feature checklists)
  const servicesSeed = [
    {
      slug: 'social-media-management',
      title: 'Social Media Management',
      short_description: 'End-to-end social strategy, monthly content calendars, creative production, and active community growth across Instagram, Facebook, and LinkedIn.',
      full_description: 'Structured social media management built around clear audience positioning, consistent visual storytelling, and measurable lead generation.',
      icon_name: 'Share2',
      image_url: IMG_SOCIAL,
      cta_label: 'Discuss Your Social Media Strategy',
      cta_url: '/contact?service=Social%20Media%20Management',
      features: [
        'Social media strategy & competitor positioning',
        'Funnel Design & audience journey mapping',
        'Content planning & monthly content calendars',
        'High-converting caption writing & copywriting',
        'Custom social media graphic design',
        'Reels & short-form video planning',
        'Community management & engagement',
        'Clear monthly performance reporting',
      ],
    },
    {
      slug: 'ai-content-video-creation',
      title: 'AI Content & Video Creation',
      short_description: 'Studio-quality AI product photography, scroll-stopping ad visuals, image-to-video storytelling, and rapid creative iteration.',
      full_description: 'Leverage modern AI visual and video generation pipelines combined with human art direction to produce standout commercial assets fast.',
      icon_name: 'Sparkles',
      image_url: IMG_AI_VISUAL,
      cta_label: 'Create With AI',
      cta_url: '/contact?service=AI%20Content%20%26%20Video%20Creation',
      features: [
        'AI-generated brand & editorial images',
        'AI commercial product photography',
        'High-converting AI advertising creatives',
        'AI promotional videos & motion ads',
        'AI video storytelling & script-to-screen',
        'Image-to-video production workflows',
        'AI-assisted multi-variant creative campaigns',
      ],
    },
    {
      slug: 'graphic-design-creative-production',
      title: 'Graphic Design',
      short_description: 'Distinctive social creatives, paid ad banners, promotional posters, and brand identity visuals engineered to stop the scroll.',
      full_description: 'Cohesive visual systems and campaign graphics designed with typographic rigor, strong focal hierarchy, and platform-native sizing.',
      icon_name: 'Palette',
      image_url: IMG_BRANDING,
      cta_label: "Let's Design Something",
      cta_url: '/contact?service=Graphic%20Design',
      features: [
        'Social media graphics & carousel systems',
        'Meta & display advertising creatives',
        'Promotional posters & launch banners',
        'Cohesive brand visuals & guidelines',
        'Marketing collateral & pitch decks',
        'End-to-end creative campaign design',
      ],
    },
    {
      slug: 'whatsapp-business-api-automation',
      title: 'WhatsApp Business API & Automation',
      short_description: 'Intelligent WhatsApp conversation flows, instant lead qualification, support automation, and campaign broadcast workflows.',
      full_description: 'Turn attention into structured conversations with automated WhatsApp Business API workflows that respond instantly and capture qualified leads 24/7.',
      icon_name: 'MessageSquareCode',
      image_url: IMG_AUTOMATION,
      cta_label: 'Automate Your Business',
      cta_url: '/contact?service=WhatsApp%20Business%20API%20%26%20Automation',
      features: [
        'WhatsApp Business API integration setup',
        'Automated customer communication flows',
        'Lead generation & qualification workflows',
        'Customer support FAQ & routing automation',
        'Segmented marketing message workflows',
        'Custom business communication solutions',
      ],
    },
  ];
  const insertService = db.prepare(`
    INSERT INTO services (
      id, slug, title, short_description, full_description, icon_name, image_url,
      cta_label, cta_url, is_featured, status, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'published', ?, ?, ?)
  `);
  const insertServiceFeat = db.prepare(`
    INSERT INTO service_features (id, service_id, feature_text, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  servicesSeed.forEach((srv, idx) => {
    const sid = newId();
    insertService.run(
      sid,
      srv.slug,
      srv.title,
      srv.short_description,
      srv.full_description,
      srv.icon_name,
      srv.image_url,
      srv.cta_label,
      srv.cta_url,
      idx + 1,
      now,
      now
    );
    srv.features.forEach((ft, fIdx) => {
      insertServiceFeat.run(newId(), sid, ft, fIdx + 1, now, now);
    });
  });

  // 9. Skills ("My Creative Toolkit" — no invented percentages; proficiency toggleable by admin)
  const skillsSeed = [
    { name: 'Social Media Management', description: 'End-to-end channel strategy, publishing cadence, and audience growth across Instagram, Facebook & LinkedIn.', icon_name: 'Share2' },
    { name: 'Content Strategy', description: 'Funnel-aligned content pillars, competitor research, and campaign roadmaps.', icon_name: 'Compass' },
    { name: 'AI Image Generation', description: 'Commercial product photography and campaign visuals directed with Midjourney and Google AI Studio.', icon_name: 'Image' },
    { name: 'AI Video Production', description: 'Image-to-video motion storytelling, AI commercials, and short-form vertical reels.', icon_name: 'Film' },
    { name: 'Graphic Design', description: 'Editorial carousels, ad creatives, posters, and brand identity visuals.', icon_name: 'PenTool' },
    { name: 'Video Editing', description: 'High-retention pacing, kinetic typography, and color grading in Premiere Pro & CapCut.', icon_name: 'Scissors' },
    { name: 'Meta Ads', description: 'Creative testing, audience targeting, and Click-to-WhatsApp performance campaigns.', icon_name: 'Megaphone' },
    { name: 'WhatsApp Automation', description: 'WhatsApp Business API chatbots, lead capture, and automated customer workflows.', icon_name: 'Bot' },
    { name: 'Marketing Analytics', description: 'Campaign attribution, creative performance diagnostics, and conversion optimization.', icon_name: 'BarChart3' },
  ];
  const insertSkill = db.prepare(`
    INSERT INTO skills (id, name, description, icon_name, proficiency, show_proficiency, status, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, 0, 'published', ?, ?, ?)
  `);
  skillsSeed.forEach((sk, idx) => {
    insertSkill.run(newId(), sk.name, sk.description, sk.icon_name, idx + 1, now, now);
  });

  // 10. Tools & Technologies
  const toolsSeed = [
    { name: 'Canva', category: 'Design', badge_text: 'Graphic Design' },
    { name: 'Adobe Photoshop', category: 'Design', badge_text: 'Compositing & Retouching' },
    { name: 'Adobe Illustrator', category: 'Design', badge_text: 'Vector & Brand Identity' },
    { name: 'Premiere Pro', category: 'Video', badge_text: 'Video Editing' },
    { name: 'CapCut', category: 'Video', badge_text: 'Short-Form Reels' },
    { name: 'ChatGPT', category: 'AI Strategy', badge_text: 'Copy & Workflows' },
    { name: 'Google AI Studio', category: 'AI Production', badge_text: 'Multimodal AI' },
    { name: 'Midjourney', category: 'AI Visuals', badge_text: 'AI Image Direction' },
    { name: 'Meta Business Suite', category: 'Marketing', badge_text: 'Campaigns & Ads' },
    { name: 'WhatsApp Business API', category: 'Automation', badge_text: 'Lead Automation' },
  ];
  const insertTool = db.prepare(`
    INSERT INTO tools (id, name, category, badge_text, status, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'published', ?, ?, ?)
  `);
  toolsSeed.forEach((t, idx) => {
    insertTool.run(newId(), t.name, t.category, t.badge_text, idx + 1, now, now);
  });

  // 11. Timeline ("My Journey")
  const timelineSeed = [
    {
      year: 'Foundation',
      role: 'Graphic Design & Visual Storytelling',
      description: 'Built core expertise in visual hierarchy, brand collateral, social graphics, and video editing fundamentals.',
    },
    {
      year: 'Strategy',
      role: 'Social Media & Campaign Management',
      description: 'Expanded into full-funnel social media management, competitor research, Meta Ads, and content calendar systems.',
    },
    {
      year: 'AI Integration',
      role: 'AI-Powered Content Creation',
      description: 'Pioneered commercial AI image generation and AI video storytelling workflows to accelerate campaign creative output.',
    },
    {
      year: 'Automation',
      role: 'WhatsApp Business API & Marketing Funnels',
      description: 'Combined creative campaigns with WhatsApp Business API automation and landing funnels to turn attention into qualified leads.',
    },
  ];
  const insertTimeline = db.prepare(`
    INSERT INTO timeline_items (id, year, role, description, image_url, status, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, '', 'published', ?, ?, ?)
  `);
  timelineSeed.forEach((tl, idx) => {
    insertTimeline.run(newId(), tl.year, tl.role, tl.description, idx + 1, now, now);
  });

  // 12. Testimonials (Clearly identified placeholder content until actual client reviews are entered)
  const testimonialsSeed = [
    {
      client_name: 'Placeholder Client Review 01',
      designation: 'Brand Founder (Sample Entry)',
      company: 'Replace via Admin Dashboard',
      review: 'Sample testimonial placeholder: Replace this entry in the Admin Dashboard under Testimonials with an authentic client quote, photo, and company details.',
      rating: 5,
    },
    {
      client_name: 'Placeholder Client Review 02',
      designation: 'Marketing Lead (Sample Entry)',
      company: 'Replace via Admin Dashboard',
      review: 'Sample testimonial placeholder: Use this slot to showcase verified client feedback on your social media campaigns, AI creative production, or WhatsApp automation.',
      rating: 5,
    },
    {
      client_name: 'Placeholder Client Review 03',
      designation: 'Business Owner (Sample Entry)',
      company: 'Replace via Admin Dashboard',
      review: 'Sample testimonial placeholder: Easily edit, reorder, upload client portraits, or unpublish sample reviews anytime from the CMS without touching code.',
      rating: 5,
    },
  ];
  const insertTestimonial = db.prepare(`
    INSERT INTO testimonials (
      id, client_name, designation, company, photo_url, review, rating,
      is_featured, is_placeholder, status, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, '', ?, ?, 1, 1, 'published', ?, ?, ?)
  `);
  testimonialsSeed.forEach((ts, idx) => {
    insertTestimonial.run(newId(), ts.client_name, ts.designation, ts.company, ts.review, ts.rating, idx + 1, now, now);
  });

  // 13. Seed initial generated images into Media Library
  const mediaSeed = [
    { title: 'Shyam Shahi Hero Portrait', url: IMG_HERO_PORTRAIT, folder: 'portraits', alt: 'Shyam Shahi portrait' },
    { title: 'Shyam Shahi Studio Portrait', url: IMG_HERO, folder: 'portraits', alt: 'Shyam Shahi studio portrait' },
    { title: 'Aurora Social Campaign Showcase', url: IMG_SOCIAL, folder: 'projects', alt: 'Social media campaign mockup' },
    { title: 'Onyx Nuit AI Product Visual', url: IMG_AI_VISUAL, folder: 'ai-images', alt: 'AI generated luxury fragrance product photography' },
    { title: 'AI Video Production Timeline', url: IMG_AI_VIDEO, folder: 'videos', alt: 'Creative studio video editing monitor' },
    { title: 'Aethel Brand Identity Suite', url: IMG_BRANDING, folder: 'branding', alt: 'Brand identity stationery showcase' },
    { title: 'WhatsApp Automation Flow UI', url: IMG_AUTOMATION, folder: 'projects', alt: 'WhatsApp Business API automation mockup' },
  ];
  const insertMedia = db.prepare(`
    INSERT INTO media_assets (
      id, title, url, cdn_url, storage_provider, file_type, mime_type,
      file_size_bytes, alt_text, folder, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'local', 'image', 'image/jpeg', 0, ?, ?, ?, ?)
  `);
  mediaSeed.forEach((m) => {
    insertMedia.run(newId(), m.title, m.url, m.url, m.alt, m.folder, now, now);
  });

  // 14. Activity Log initial entry
  db.prepare(`
    INSERT INTO activity_logs (id, actor_email, action, entity_type, entity_id, details, created_at, updated_at)
    VALUES (?, 'system', 'database_initialized', 'system', 'seed', ?, ?, ?)
  `).run(newId(), JSON.stringify({ message: 'Initial portfolio database schema and demo content seeded' }), now, now);
}
