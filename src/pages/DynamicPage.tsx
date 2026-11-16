import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { SeoHead } from '../components/SeoHead';
import { DynamicSectionRenderer } from '../components/DynamicSectionRenderer';
import { SmartImage } from '../components/SmartImage';

export function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading } = usePortfolioData();

  if (loading && !data) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-24 animate-pulse">
        <div className="h-12 w-1/2 rounded bg-[#0D2747]" />
      </div>
    );
  }

  const page = data?.pages.find((p) => p.slug === slug);
  if (!page) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-[#F5F8FF]">Page Not Found</h1>
        <p className="mt-3 text-[#A9BBD3]">The page you requested does not exist or is unpublished.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2878FF] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title={page.seo_title || page.title}
        description={page.meta_description || `${page.title} — Shyam Shahi Studio`}
      />

      <section className="py-16 bg-[#0B1F3A] border-b border-[#24466C]/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#F5F8FF]">{page.title}</h1>
          {page.meta_description && (
            <p className="mt-3 text-base text-[#A9BBD3] max-w-2xl">{page.meta_description}</p>
          )}
          {page.banner_image_url && (
            <div className="mt-8 rounded-2xl border border-[#24466C] overflow-hidden max-h-[380px]">
              <SmartImage
                src={page.banner_image_url}
                alt={page.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {(page.sections || []).map((section) => (
        <DynamicSectionRenderer key={section.id} section={section} />
      ))}
    </>
  );
}
