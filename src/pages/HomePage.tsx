import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Quote,
  Star,
} from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { SeoHead } from '../components/SeoHead';
import { SmartImage } from '../components/SmartImage';
import { DynamicIcon, SocialIcon } from '../components/Icons';
import { DynamicSectionRenderer } from '../components/DynamicSectionRenderer';

const CORE_SECTION_TYPES = new Set([
  'hero',
  'project_grid',
  'statistics',
  'services_grid',
  'testimonials',
  'cta',
]);

export function HomePage() {
  const { data, loading } = usePortfolioData();
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const settings = data?.settings;
  const hero = data?.hero;
  const homePage = data?.pages.find((p) => p.slug === 'home');
  const homeSections = homePage?.sections || [];
  const featuredProjects = (data?.featuredProjects || []).slice(0, 6);
  const skills = data?.skills || [];
  const tools = data?.tools || [];
  const services = (data?.services || []).slice(0, 4);
  const testimonials = data?.testimonials || [];

  // Custom extra sections appended to Home in Page Builder
  const customExtraSections = homeSections.filter((s) => !CORE_SECTION_TYPES.has(s.section_type));

  // Respect section visibility toggles from Page Builder if configured
  const isSectionVisible = (type: string) => {
    const match = homeSections.find((s) => s.section_type === type);
    return match ? match.is_visible : true;
  };
  const sectionCopy = (type: string) => homeSections.find((s) => s.section_type === type);

  const activeTestimonial = testimonials[testimonialIdx] || testimonials[0];

  const handlePrevTestimonial = () => {
    if (testimonials.length === 0) return;
    setTestimonialIdx((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };
  const handleNextTestimonial = () => {
    if (testimonials.length === 0) return;
    setTestimonialIdx((prev) => (prev + 1) % testimonials.length);
  };

  // Format hero heading to highlight "SHYAM SHAHI" in electric cyan/blue
  const renderMainHeading = (heading: string) => {
    const marker = 'SHYAM SHAHI';
    if (heading.toUpperCase().includes(marker)) {
      const idx = heading.toUpperCase().indexOf(marker);
      const before = heading.slice(0, idx);
      const match = heading.slice(idx, idx + marker.length);
      const after = heading.slice(idx + marker.length);
      return (
        <>
          {before}
          <span className="text-[#00B8FF]">{match}</span>
          {after}
        </>
      );
    }
    return heading;
  };

  if (loading && !data) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
          <div className="lg:col-span-7 space-y-5">
            <div className="h-4 w-56 rounded bg-[#0D2747]" />
            <div className="h-14 w-3/4 rounded bg-[#0D2747]" />
            <div className="h-6 w-2/3 rounded bg-[#0D2747]" />
            <div className="h-24 w-full rounded bg-[#0D2747]" />
          </div>
          <div className="lg:col-span-5 h-[440px] rounded-2xl bg-[#0D2747]" />
        </div>
      </div>
    );
  }

  const animateHero = hero?.animation_enabled !== false;

  return (
    <>
      <SeoHead
        title={homePage?.seo_title || settings?.seo_default_title || 'Shyam Shahi | Social Media Manager & AI Content Creator'}
        description={
          homePage?.meta_description ||
          settings?.seo_default_description ||
          'Social Media Manager & AI Content Creator combining strategy, AI visuals, video production, and WhatsApp automation.'
        }
      />

      {/* A. HERO SECTION */}
      {isSectionVisible('hero') && (
        <section
          className="relative overflow-hidden border-b border-[#24466C]/60"
          style={{
            backgroundColor: hero?.background_color || '#06152B',
            backgroundImage: hero?.background_image_url
              ? `linear-gradient(to right, rgba(6,21,43,0.92), rgba(6,21,43,0.75)), url(${hero.background_image_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Subtle Atmospheric Blue Radial Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 right-0 w-[640px] h-[640px] rounded-full bg-[#2878FF]/15 blur-[140px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/3 w-[420px] h-[320px] rounded-full bg-[#00B8FF]/10 blur-[120px]"
          />

          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
              {/* Left Column */}
              <motion.div
                initial={animateHero ? { opacity: 0, y: 18 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-7 space-y-6"
              >
                <p className="text-sm sm:text-base font-medium text-[#00B8FF] tracking-wide">
                  {hero?.intro_text || 'Turning Creative Ideas Into Digital Growth.'}
                </p>

                <h1 className="text-4xl sm:text-5xl xl:text-[56px] font-bold tracking-tight leading-[1.08] text-[#F5F8FF] text-balance">
                  {renderMainHeading(hero?.main_heading || 'HI, I am SHYAM SHAHI')}
                </h1>

                <p className="text-lg sm:text-xl font-display font-medium text-[#F5F8FF]/90">
                  {hero?.supporting_heading || 'Social Media Manager | AI Content Creator'}
                </p>

                <div className="text-base text-[#A9BBD3] leading-relaxed max-w-2xl space-y-3 whitespace-pre-line">
                  {hero?.description}
                </div>

                {/* CTAs */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    to={hero?.primary_cta_url || '/projects'}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold transition-all shadow-[0_8px_30px_rgba(40,120,255,0.35)] hover:-translate-y-0.5"
                  >
                    <span>{hero?.primary_cta_label || 'Explore My Work'}</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  <Link
                    to={hero?.secondary_cta_url || '/contact'}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#24466C] bg-[#0B1F3A]/80 hover:border-[#2878FF] hover:bg-[#0D2747] text-[#F5F8FF] text-sm font-semibold transition-all"
                  >
                    <span>{hero?.secondary_cta_label || "Let's Work Together"}</span>
                    <ArrowUpRight className="w-4 h-4 text-[#00B8FF]" aria-hidden="true" />
                  </Link>
                </div>

                {/* Editable Social Icons */}
                <div className="pt-3 flex items-center gap-3">
                  {(hero?.social_links || []).map((soc, idx) => (
                    <a
                      key={`${soc.platform}-${idx}`}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={soc.platform}
                      title={soc.platform}
                      className="w-10 h-10 rounded-xl border border-[#24466C] bg-[#0B1F3A] flex items-center justify-center text-[#A9BBD3] hover:text-[#00B8FF] hover:border-[#2878FF] transition-colors"
                    >
                      <SocialIcon platform={soc.platform} className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Right Column: Portrait & Floating Creative Labels */}
              <motion.div
                initial={animateHero ? { opacity: 0, scale: 0.97 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5 relative flex justify-center lg:justify-end"
              >
                <div className="relative w-full max-w-[440px]">
                  {/* Geometric Atmospheric Backdrop */}
                  <div
                    aria-hidden="true"
                    className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#2878FF]/20 via-[#00B8FF]/10 to-transparent blur-xl"
                  />

                  <div className="relative rounded-3xl border border-[#24466C] bg-gradient-to-b from-[#0D2747] to-[#06152B] overflow-hidden aspect-[4/5] shadow-2xl">
                    <SmartImage
                      src={hero?.portrait_url || '/assets/aistudio/Shyam_Shahi_b9fbadd2.png'}
                      alt="Shyam Shahi — Social Media Manager & AI Content Creator"
                      loading="eager"
                      objectPosition={`${hero?.crop_x ?? 50}% ${hero?.crop_y ?? 12}%`}
                      zoom={hero?.zoom ?? 1}
                      className="w-full h-full object-cover transition-transform duration-500"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#06152B]/85 via-transparent to-transparent pointer-events-none"
                    />

                    {/* Subtle Floating Labels inside portrait bottom edge */}
                    <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                      {(hero?.floating_labels || []).map((label, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg border border-[#24466C]/90 bg-[#06152B]/85 backdrop-blur-md text-xs font-medium text-[#F5F8FF]"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Subtle Floating Social Accent Badges */}
                  {(hero?.social_links || []).slice(0, 2).map((soc, idx) => (
                    <motion.a
                      key={`float-${soc.platform}`}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={soc.platform}
                      animate={
                        animateHero
                          ? { y: idx === 0 ? [0, -6, 0] : [0, 6, 0] }
                          : undefined
                      }
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                      className={`hidden sm:flex items-center justify-center w-11 h-11 rounded-xl border border-[#24466C] bg-[#0B1F3A]/95 backdrop-blur-md text-[#00B8FF] shadow-lg absolute ${
                        idx === 0 ? '-left-5 top-10' : '-right-4 top-28'
                      }`}
                    >
                      <SocialIcon platform={soc.platform} className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Ecosystem / Platform Strip (Inspired by reference brand strip) */}
          {tools.length > 0 && (
            <div className="border-t border-[#24466C]/50 bg-[#040E1E]/80">
              <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-wrap items-center justify-between gap-6">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#A9BBD3]/80 whitespace-nowrap">
                  Creative &amp; Automation Stack
                </span>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm font-display font-medium text-[#A9BBD3]">
                  {tools.slice(0, 7).map((tool) => (
                    <span key={tool.id} className="hover:text-[#F5F8FF] transition-colors">
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* B. FEATURED PROJECTS ("Selected Works") */}
      {isSectionVisible('project_grid') && (
        <section className="py-20 bg-[#06152B]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF] mb-2">
                  Selected Works
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FF]">
                  {sectionCopy('project_grid')?.title || 'Selected Works'}
                </h2>
                <p className="mt-3 text-base text-[#A9BBD3]">
                  {sectionCopy('project_grid')?.subtitle ||
                    'A collection of creative campaigns, strategic projects, and AI-powered content.'}
                </p>
              </div>
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#24466C] bg-[#0B1F3A] hover:border-[#2878FF] text-sm font-semibold text-[#F5F8FF] transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
              >
                <span>View All Projects</span>
                <ArrowUpRight className="w-4 h-4 text-[#00B8FF]" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {featuredProjects.map((project, idx) => (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className="group rounded-2xl border border-[#24466C] bg-[#0D2747] overflow-hidden flex flex-col hover:border-[#2878FF] transition-colors"
                >
                  <Link to={`/projects/${project.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-[#06152B]">
                    <SmartImage
                      src={project.thumbnail_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Clean unboxed metadata per design constitution */}
                    <div className="flex items-center gap-2 text-xs text-[#00B8FF] font-medium mb-2">
                      <span>{project.category_name}</span>
                      {project.completion_date && (
                        <>
                          <span aria-hidden="true" className="text-[#24466C]">·</span>
                          <span className="text-[#A9BBD3] tabular-nums">{project.completion_date}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-[#F5F8FF] group-hover:text-[#00B8FF] transition-colors">
                      <Link to={`/projects/${project.slug}`}>{project.title}</Link>
                    </h3>

                    <p className="mt-2.5 text-sm text-[#A9BBD3] leading-relaxed line-clamp-3 flex-1">
                      {project.short_description}
                    </p>

                    {project.tools_used.length > 0 && (
                      <p className="mt-4 pt-4 border-t border-[#24466C]/70 text-xs text-[#A9BBD3]/90 truncate">
                        Tools: {project.tools_used.join(' · ')}
                      </p>
                    )}

                    <div className="mt-4">
                      <Link
                        to={`/projects/${project.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2878FF] hover:text-[#00B8FF] transition-colors"
                      >
                        <span>View Project</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* C. EXPERTISE / SKILLS ("My Creative Toolkit") */}
      {isSectionVisible('statistics') && (
        <section className="py-20 bg-[#0B1F3A] border-y border-[#24466C]/60">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF] mb-2">
                Expertise
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FF]">
                {sectionCopy('statistics')?.title || 'My Creative Toolkit'}
              </h2>
              <p className="mt-3 text-base text-[#A9BBD3]">
                Core marketing, creative AI production, and automation capabilities managed via CMS.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 hover:border-[#2878FF] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#2878FF]/15 border border-[#2878FF]/30 flex items-center justify-center text-[#00B8FF]">
                      <DynamicIcon name={skill.icon_name} className="w-5 h-5" />
                    </div>
                    {skill.show_proficiency && skill.proficiency !== null && (
                      <span className="text-xs font-mono font-medium text-[#00B8FF] tabular-nums">
                        {skill.proficiency}%
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#F5F8FF]">{skill.name}</h3>
                  {skill.description && (
                    <p className="mt-2 text-sm text-[#A9BBD3] leading-relaxed">{skill.description}</p>
                  )}
                  {skill.show_proficiency && skill.proficiency !== null && (
                    <div className="mt-4 h-1.5 w-full rounded-full bg-[#06152B] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2878FF] to-[#00B8FF]"
                        style={{ width: `${Math.min(100, Math.max(0, skill.proficiency))}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* D. SERVICES PREVIEW */}
      {isSectionVisible('services_grid') && (
        <section className="py-20 bg-[#06152B]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF] mb-2">
                  What I Offer
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FF]">
                  {sectionCopy('services_grid')?.title || 'Creative Solutions for Digital Growth'}
                </h2>
              </div>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#00B8FF] hover:text-[#F5F8FF] transition-colors whitespace-nowrap"
              >
                <span>View All Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 flex flex-col justify-between hover:border-[#2878FF] transition-colors"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#2878FF]/15 border border-[#2878FF]/30 flex items-center justify-center text-[#00B8FF] mb-5">
                      <DynamicIcon name={service.icon_name} className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#F5F8FF]">{service.title}</h3>
                    <p className="mt-3 text-sm text-[#A9BBD3] leading-relaxed">
                      {service.short_description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#24466C]/70">
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2878FF] hover:text-[#00B8FF] transition-colors"
                    >
                      <span>Learn More</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* E. TESTIMONIALS PREVIEW */}
      {isSectionVisible('testimonials') && testimonials.length > 0 && (
        <section className="py-20 bg-[#0B1F3A] border-y border-[#24466C]/60">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF] mb-2">
                  Client Perspectives
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FF]">
                  {sectionCopy('testimonials')?.title || 'Testimonials'}
                </h2>
              </div>
              {testimonials.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevTestimonial}
                    aria-label="Previous testimonial"
                    className="w-11 h-11 rounded-xl border border-[#24466C] bg-[#0D2747] hover:border-[#2878FF] flex items-center justify-center text-[#F5F8FF] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextTestimonial}
                    aria-label="Next testimonial"
                    className="w-11 h-11 rounded-xl border border-[#24466C] bg-[#0D2747] hover:border-[#2878FF] flex items-center justify-center text-[#F5F8FF] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {activeTestimonial && (
                <motion.div
                  key={activeTestimonial.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-3xl border border-[#24466C] bg-[#0D2747] p-8 sm:p-10"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex-1 space-y-5">
                      <div className="flex items-center justify-between gap-4">
                        <Quote className="w-8 h-8 text-[#2878FF]" aria-hidden="true" />
                        <div className="flex items-center gap-1" aria-label={`Rated ${activeTestimonial.rating} out of 5`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < activeTestimonial.rating
                                  ? 'text-[#00B8FF] fill-[#00B8FF]'
                                  : 'text-[#24466C]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-lg sm:text-xl text-[#F5F8FF] leading-relaxed">
                        “{activeTestimonial.review}”
                      </p>

                      <div className="flex items-center gap-4 pt-2">
                        {activeTestimonial.photo_url ? (
                          <SmartImage
                            src={activeTestimonial.photo_url}
                            alt={activeTestimonial.client_name}
                            className="w-12 h-12 rounded-full object-cover border border-[#24466C]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#2878FF]/20 border border-[#2878FF]/40 flex items-center justify-center text-sm font-bold text-[#00B8FF]">
                            {activeTestimonial.client_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-[#F5F8FF]">
                            {activeTestimonial.client_name}
                          </div>
                          <div className="text-xs text-[#A9BBD3]">
                            {activeTestimonial.designation}
                            {activeTestimonial.company ? ` · ${activeTestimonial.company}` : ''}
                            {activeTestimonial.is_placeholder ? ' · Demo Placeholder' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Custom CMS Sections appended to Home */}
      {customExtraSections.map((sec) => (
        <DynamicSectionRenderer key={sec.id} section={sec} />
      ))}

      {/* F. FINAL CTA */}
      {isSectionVisible('cta') && (
        <section className="py-20 bg-[#06152B]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="relative rounded-3xl border border-[#24466C] bg-gradient-to-br from-[#0D2747] via-[#0B1F3A] to-[#06152B] px-6 py-16 sm:p-16 text-center overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[540px] h-[260px] rounded-full bg-[#2878FF]/25 blur-[110px]"
              />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F8FF] text-balance">
                  {sectionCopy('cta')?.title || "Let's Build Something Extraordinary."}
                </h2>
                <p className="mt-4 text-base sm:text-lg text-[#A9BBD3] leading-relaxed">
                  {sectionCopy('cta')?.description ||
                    "Have a brand, project, or creative idea in mind? Let's turn it into something impactful."}
                </p>
                <div className="mt-8">
                  <Link
                    to={sectionCopy('cta')?.cta_url || '/contact'}
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold transition-all shadow-[0_8px_30px_rgba(40,120,255,0.35)]"
                  >
                    <span>{sectionCopy('cta')?.cta_label || 'Start a Conversation'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
