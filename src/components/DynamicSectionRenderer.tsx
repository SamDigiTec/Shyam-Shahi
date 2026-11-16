import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { PageSection } from '../types/cms';
import { SmartImage } from './SmartImage';

export function DynamicSectionRenderer({ section }: { section: PageSection }) {
  if (!section.is_visible) return null;

  const alignClass =
    section.text_alignment === 'center'
      ? 'text-center mx-auto'
      : section.text_alignment === 'right'
        ? 'text-right ml-auto'
        : 'text-left';

  return (
    <section
      className="py-16 sm:py-20 border-t border-[#24466C]/50"
      style={{ backgroundColor: section.background_color || '#06152B' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {section.section_type === 'cta' ? (
          <div className="rounded-3xl border border-[#24466C] bg-gradient-to-br from-[#0D2747] via-[#0B1F3A] to-[#06152B] p-8 sm:p-14 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              {section.subtitle && (
                <p className="text-xs font-semibold tracking-widest uppercase text-[#00B8FF] mb-3">
                  {section.subtitle}
                </p>
              )}
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FF]">
                {section.title}
              </h2>
              {section.description && (
                <p className="mt-4 text-base text-[#A9BBD3] leading-relaxed">{section.description}</p>
              )}
              {section.cta_label && (
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    to={section.cta_url || '/contact'}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold transition-colors"
                  >
                    <span>{section.cta_label}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className={`${section.image_url ? 'lg:col-span-7' : 'lg:col-span-12 max-w-3xl'} ${alignClass}`}>
              {section.subtitle && (
                <p className="text-xs font-semibold tracking-widest uppercase text-[#00B8FF] mb-2">
                  {section.subtitle}
                </p>
              )}
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FF]">
                {section.title}
              </h2>
              {section.description && (
                <p className="mt-4 text-base text-[#A9BBD3] leading-relaxed whitespace-pre-line">
                  {section.description}
                </p>
              )}
              {section.cta_label && (
                <div className="mt-6">
                  <Link
                    to={section.cta_url || '/contact'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold transition-colors"
                  >
                    <span>{section.cta_label}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
            {section.image_url && (
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-[#24466C] overflow-hidden bg-[#0D2747] aspect-[4/3]">
                  <SmartImage
                    src={section.image_url}
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
