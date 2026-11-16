import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { ProjectRecord } from '../types/cms';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { SeoHead } from '../components/SeoHead';
import { SmartImage } from '../components/SmartImage';

export function ProjectsPage() {
  const { data, isPreview } = usePortfolioData();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const projectsPage = data?.pages.find((p) => p.slug === 'projects');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{
          projects: ProjectRecord[];
        }>(isPreview ? '/api/public/projects?preview=1' : '/api/public/projects');
        if (!mounted) return;
        setProjects(res.projects);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [isPreview]);

  return (
    <>
      <SeoHead
        title={projectsPage?.seo_title || 'Projects & Case Studies | Shyam Shahi'}
        description={
          projectsPage?.meta_description ||
          'Explore selected projects showcasing social media campaigns, AI-powered creative production, brand storytelling, and digital marketing.'
        }
      />

      <section className="py-16 sm:py-24 bg-[#06152B]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF] mb-2">
              Case Studies
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F8FF]">
              Creative Projects. Strategic Results.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#A9BBD3] leading-relaxed">
              Explore selected projects showcasing social media campaigns, AI-powered creative production, brand storytelling, and digital marketing.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-2xl border border-[#24466C] bg-[#0D2747] animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-12 text-center">
              <p className="text-base text-[#A9BBD3]">No projects published yet.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              <AnimatePresence mode="popLayout">
                {projects.map((project) => (
                  <motion.article
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="group rounded-2xl border border-[#24466C] bg-[#0D2747] overflow-hidden flex flex-col hover:border-[#2878FF] transition-colors"
                  >
                    <Link
                      to={`/projects/${project.slug}`}
                      className="block aspect-[4/3] overflow-hidden bg-[#06152B]"
                    >
                      <SmartImage
                        src={project.thumbnail_url}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-[#00B8FF] font-medium mb-2">
                        <span>{project.category_name}</span>
                        {project.completion_date && (
                          <>
                            <span className="text-[#24466C]">·</span>
                            <span className="text-[#A9BBD3] tabular-nums">{project.completion_date}</span>
                          </>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-[#F5F8FF] group-hover:text-[#00B8FF] transition-colors">
                        <Link to={`/projects/${project.slug}`}>{project.title}</Link>
                      </h2>

                      <p className="mt-2.5 text-sm text-[#A9BBD3] leading-relaxed flex-1">
                        {project.short_description}
                      </p>

                      {project.tools_used.length > 0 && (
                        <p className="mt-4 pt-4 border-t border-[#24466C]/70 text-xs text-[#A9BBD3]">
                          Tools: {project.tools_used.join(' · ')}
                        </p>
                      )}

                      <div className="mt-4">
                        <Link
                          to={`/projects/${project.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2878FF] hover:text-[#00B8FF] transition-colors"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
