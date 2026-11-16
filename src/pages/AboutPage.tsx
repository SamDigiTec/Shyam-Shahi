import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  Clock,
  Compass,
  Download,
  Globe,
  Languages,
  Mail,
  MapPin,
  Sparkles,
  Target,
} from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { SeoHead } from '../components/SeoHead';
import { SmartImage } from '../components/SmartImage';
import { GoogleDriveViewer } from '../components/GoogleDriveViewer';

const APPROACH_PRINCIPLES = [
  {
    title: 'Strategy First',
    description:
      'Every visual and campaign begins with audience research, funnel architecture, and clear business objectives.',
    icon: Target,
  },
  {
    title: 'Creativity With Purpose',
    description:
      'Design and storytelling built to stop the scroll while communicating brand clarity and trust.',
    icon: Compass,
  },
  {
    title: 'AI-Powered Innovation',
    description:
      'Leveraging AI image synthesis, video generation, and prompt systems to produce studio-grade creative faster.',
    icon: Sparkles,
  },
  {
    title: 'Data-Driven Growth',
    description:
      'Continuous iteration guided by real engagement, creative retention, and lead conversion feedback.',
    icon: BarChart3,
  },
];

export function AboutPage() {
  const { data } = usePortfolioData();
  const settings = data?.settings;
  const aboutPage = data?.pages.find((p) => p.slug === 'about');
  const tools = data?.tools || [];

  const isDriveCv = Boolean(
    settings?.cv_url &&
      (settings.cv_url.includes('drive.google.com') || settings.cv_url.includes('docs.google.com'))
  );

  return (
    <>
      <SeoHead
        title={aboutPage?.seo_title || 'About Shyam Shahi | Social Media Manager & AI Content Creator'}
        description={
          aboutPage?.meta_description ||
          'Discover Shyam Shahi’s creative philosophy, digital marketing journey, AI content toolkit, and professional background.'
        }
      />

      {/* A. About Hero */}
      <section className="py-16 sm:py-24 bg-[#06152B] border-b border-[#24466C]/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-[#24466C] bg-[#0D2747] overflow-hidden aspect-[4/5]">
                <SmartImage
                  src={settings?.about_portrait_url || '/assets/aistudio/Shyam_Shahi_b9fbadd2.png'}
                  alt="Shyam Shahi portrait"
                  objectPosition="50% 12%"
                  className="w-full h-full object-cover"
                />
              </div>

              {settings?.about_mission && (
                <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6">
                  <p className="text-base font-medium text-[#F5F8FF] leading-relaxed">
                    {settings.about_mission}
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold transition-colors"
                >
                  <span>Work With Me</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                {settings?.cv_url && (
                  <a
                    href={settings.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#24466C] bg-[#0B1F3A] hover:border-[#2878FF] text-sm font-semibold text-[#F5F8FF] transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#00B8FF]" />
                    <span>Download / View CV</span>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF]">
                About me
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F8FF] text-balance leading-[1.12]">
                {settings?.about_heading || "Let's turn your business goals into digital opportunities.."}
              </h1>

              <div className="text-base text-[#A9BBD3] leading-relaxed space-y-4 whitespace-pre-line">
                {settings?.about_bio}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. My Approach */}
      <section className="py-20 bg-[#06152B] border-b border-[#24466C]/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FF]">
              My Approach
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {APPROACH_PRINCIPLES.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6">
                  <div className="w-11 h-11 rounded-xl bg-[#2878FF]/15 border border-[#2878FF]/30 flex items-center justify-center text-[#00B8FF] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F5F8FF]">{p.title}</h3>
                  <p className="mt-2 text-sm text-[#A9BBD3] leading-relaxed">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* D. Tools & Technologies */}
      <section className="py-20 bg-[#0B1F3A] border-b border-[#24466C]/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF] mb-2">
              Software &amp; AI Platforms
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FF]">
              Tools &amp; Technologies
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-5 hover:border-[#2878FF] transition-colors"
              >
                <div className="text-xs font-medium text-[#00B8FF] mb-1">{tool.category}</div>
                <div className="font-display font-bold text-base text-[#F5F8FF]">{tool.name}</div>
                {tool.badge_text && (
                  <div className="mt-1 text-xs text-[#A9BBD3]">{tool.badge_text}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E. Professional Information & Optional Embedded CV */}
      <section className="py-20 bg-[#06152B]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="rounded-3xl border border-[#24466C] bg-[#0D2747] p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-[#F5F8FF] mb-6">Professional Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-[#A9BBD3]">Location</div>
                  <div className="font-medium text-[#F5F8FF] mt-0.5">{settings?.location || 'India · Remote'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-[#A9BBD3]">Email</div>
                  <div className="font-medium text-[#F5F8FF] mt-0.5">{settings?.contact_email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-[#A9BBD3]">Focus</div>
                  <div className="font-medium text-[#F5F8FF] mt-0.5">
                    {settings?.experience_summary || 'Social Media, AI Content & Automation'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Languages className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-[#A9BBD3]">Languages</div>
                  <div className="font-medium text-[#F5F8FF] mt-0.5">{settings?.languages || 'English, Nepali'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-[#A9BBD3]">Availability</div>
                  <div className="font-medium text-[#22C55E] mt-0.5">
                    {settings?.availability || 'Open for Projects'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isDriveCv && settings?.cv_url && (
            <GoogleDriveViewer url={settings.cv_url} title="Shyam Shahi — Curriculum Vitae" heightClass="h-[540px]" />
          )}
        </div>
      </section>
    </>
  );
}
