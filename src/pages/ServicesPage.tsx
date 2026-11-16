import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { SeoHead } from '../components/SeoHead';
import { DynamicIcon } from '../components/Icons';
import { SmartImage } from '../components/SmartImage';

export function ServicesPage() {
  const { data, loading } = usePortfolioData();
  const services = data?.services || [];
  const servicesPage = data?.pages.find((p) => p.slug === 'services');

  return (
    <>
      <SeoHead
        title={servicesPage?.seo_title || 'Services | Shyam Shahi'}
        description={
          servicesPage?.meta_description ||
          'From managing your social presence to producing AI-powered content and WhatsApp Business API automation.'
        }
      />

      <section className="py-16 sm:py-24 bg-[#06152B]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF] mb-2">
              Services
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F8FF]">
              Creative Solutions for Digital Growth.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#A9BBD3] leading-relaxed">
              From managing your social presence to producing AI-powered content, I help businesses communicate, connect, and grow.
            </p>
          </div>

          {loading && services.length === 0 ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-3xl border border-[#24466C] bg-[#0D2747] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {services.map((service, idx) => (
                <div
                  key={service.id}
                  className="rounded-3xl border border-[#24466C] bg-[#0D2747] overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    <div
                      className={`lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between ${
                        idx % 2 === 1 ? 'lg:order-2' : ''
                      }`}
                    >
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#2878FF]/15 border border-[#2878FF]/30 flex items-center justify-center text-[#00B8FF]">
                            <DynamicIcon name={service.icon_name} className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-mono font-semibold text-[#00B8FF]">
                            0{idx + 1}. Service
                          </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F8FF]">{service.title}</h2>

                        <p className="text-base text-[#A9BBD3] leading-relaxed">
                          {service.full_description || service.short_description}
                        </p>

                        {service.features.length > 0 && (
                          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {service.features.map((feat) => (
                              <div key={feat.id} className="flex items-start gap-2.5 text-sm text-[#F5F8FF]/90">
                                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                                <span>{feat.feature_text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-8 pt-6 border-t border-[#24466C]/70">
                        <Link
                          to={
                            service.cta_url.startsWith('/contact')
                              ? service.cta_url
                              : `/contact?service=${encodeURIComponent(service.title)}`
                          }
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold transition-colors"
                        >
                          <span>{service.cta_label}</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    <div
                      className={`lg:col-span-5 bg-[#0B1F3A] min-h-[280px] ${
                        idx % 2 === 1 ? 'lg:order-1' : ''
                      }`}
                    >
                      <SmartImage
                        src={service.image_url}
                        alt={service.title}
                        fallbackLabel={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
