import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CheckCircle2, ExternalLink, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { ProjectRecord } from '../types/cms';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { SeoHead } from '../components/SeoHead';
import { SmartImage } from '../components/SmartImage';
import { GoogleDriveViewer } from '../components/GoogleDriveViewer';

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isPreview } = usePortfolioData();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiRequest<{ project: ProjectRecord }>(
          `/api/public/projects/${slug}${isPreview ? '?preview=1' : ''}`
        );
        if (mounted) setProject(res.project);
      } catch (err) {
        if (mounted) setError((err as Error).message || 'Project not found.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (slug) void load();
    return () => {
      mounted = false;
    };
  }, [slug, isPreview]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-20 space-y-6 animate-pulse">
        <div className="h-6 w-36 rounded bg-[#0D2747]" />
        <div className="h-12 w-2/3 rounded bg-[#0D2747]" />
        <div className="h-[420px] rounded-2xl bg-[#0D2747]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-24 text-center">
        <h1 className="text-3xl font-bold text-[#F5F8FF]">Project Not Found</h1>
        <p className="mt-3 text-[#A9BBD3]">{error || 'This project may be unpublished or removed.'}</p>
        <Link
          to="/projects"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2878FF] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  const images = (project.media || []).filter((m) => m.media_type === 'image');
  const videos = (project.media || []).filter((m) => m.media_type === 'video' || m.media_type === 'embed');
  const driveDocs = (project.media || []).filter((m) => m.media_type === 'gdrive_pdf');

  return (
    <>
      <SeoHead title={`${project.title} | Shyam Shahi`} description={project.short_description} />

      <article className="py-14 sm:py-20 bg-[#06152B]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#00B8FF] hover:text-[#F5F8FF] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Projects
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#A9BBD3] mb-3">
              <span className="text-[#00B8FF] font-semibold">{project.category_name}</span>
              {project.client_name && (
                <>
                  <span className="text-[#24466C]">·</span>
                  <span>{project.client_name}</span>
                </>
              )}
              {project.completion_date && (
                <>
                  <span className="text-[#24466C]">·</span>
                  <span className="tabular-nums">{project.completion_date}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F8FF] text-balance">
              {project.title}
            </h1>
            <p className="mt-4 text-lg text-[#A9BBD3] max-w-3xl leading-relaxed">
              {project.short_description}
            </p>

            {project.external_url && (
              <div className="mt-6">
                <a
                  href={project.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold transition-colors"
                >
                  <span>Visit Live Campaign</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Hero Thumbnail */}
          {project.thumbnail_url && (
            <div className="rounded-3xl border border-[#24466C] overflow-hidden bg-[#0D2747] aspect-[16/9]">
              <SmartImage
                src={project.thumbnail_url}
                alt={project.title}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Metrics Row (Admin-entered only) */}
          {project.metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {project.metrics.map((m, idx) => (
                <div key={idx} className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6">
                  <div className="text-xs font-medium text-[#00B8FF] uppercase tracking-wider">{m.label}</div>
                  <div className="mt-2 text-2xl font-display font-bold text-[#F5F8FF] tabular-nums">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Case Study Narrative Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              {project.overview && (
                <section className="space-y-3">
                  <h2 className="text-2xl font-bold text-[#F5F8FF]">Project Overview</h2>
                  <div
                    className="text-base text-[#A9BBD3] leading-relaxed space-y-3 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: project.overview }}
                  />
                </section>
              )}

              {project.challenge && (
                <section className="space-y-3">
                  <h2 className="text-2xl font-bold text-[#F5F8FF]">Client Challenge</h2>
                  <div
                    className="text-base text-[#A9BBD3] leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: project.challenge }}
                  />
                </section>
              )}

              {project.strategy && (
                <section className="space-y-3">
                  <h2 className="text-2xl font-bold text-[#F5F8FF]">Strategy</h2>
                  <div
                    className="text-base text-[#A9BBD3] leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: project.strategy }}
                  />
                </section>
              )}

              {project.creative_execution && (
                <section className="space-y-3">
                  <h2 className="text-2xl font-bold text-[#F5F8FF]">Creative Execution</h2>
                  <div
                    className="text-base text-[#A9BBD3] leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: project.creative_execution }}
                  />
                </section>
              )}
            </div>

            {/* Sidebar: Deliverables & Tools */}
            <aside className="lg:col-span-4 space-y-6">
              {project.deliverables.length > 0 && (
                <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#F5F8FF]">Final Deliverables</h3>
                  <ul className="space-y-2.5 text-sm text-[#A9BBD3]">
                    {project.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.tools_used.length > 0 && (
                <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-3">
                  <h3 className="text-lg font-bold text-[#F5F8FF]">Tools &amp; Technologies</h3>
                  <p className="text-sm text-[#A9BBD3] leading-relaxed">
                    {project.tools_used.join(' · ')}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-[#24466C] bg-[#0B1F3A] p-6 space-y-4">
                <h3 className="text-lg font-bold text-[#F5F8FF]">Need a Similar Result?</h3>
                <p className="text-sm text-[#A9BBD3]">
                  Let’s discuss how this creative and strategic workflow can support your brand.
                </p>
                <Link
                  to={`/contact?service=${encodeURIComponent(project.category_name)}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold transition-colors"
                >
                  <span>Discuss Your Project</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </aside>
          </div>

          {/* Embedded Google Drive Case Study PDF / Presentation */}
          {project.drive_doc_url && (
            <GoogleDriveViewer
              url={project.drive_doc_url}
              fileId={project.drive_file_id}
              title={`${project.title} — Case Study Deck / PDF`}
            />
          )}
          {driveDocs.map((doc) => (
            <GoogleDriveViewer
              key={doc.id}
              url={doc.url}
              fileId={doc.drive_file_id}
              title={doc.caption || 'Supporting Portfolio Document'}
            />
          ))}

          {/* Embedded Videos */}
          {videos.length > 0 && (
            <section className="space-y-5">
              <h2 className="text-2xl font-bold text-[#F5F8FF]">Campaign Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((v) => (
                  <div key={v.id} className="rounded-2xl border border-[#24466C] bg-[#0D2747] overflow-hidden">
                    <div className="aspect-video bg-black">
                      {v.media_type === 'video' ? (
                        <video src={v.url} controls className="w-full h-full object-contain" />
                      ) : (
                        <iframe
                          src={v.url}
                          title={v.caption || project.title}
                          className="w-full h-full border-0"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                        />
                      )}
                    </div>
                    {v.caption && <p className="px-4 py-3 text-xs text-[#A9BBD3]">{v.caption}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Project Image Gallery */}
          {images.length > 0 && (
            <section className="space-y-5">
              <h2 className="text-2xl font-bold text-[#F5F8FF]">Visual Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightboxUrl(img.url)}
                    className="group rounded-2xl border border-[#24466C] bg-[#0D2747] overflow-hidden text-left hover:border-[#2878FF] transition-colors"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <SmartImage
                        src={img.url}
                        alt={img.caption || project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {img.caption && <p className="px-4 py-3 text-xs text-[#A9BBD3]">{img.caption}</p>}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-[#0D2747] border border-[#24466C] flex items-center justify-center text-white"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Project media preview"
            className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
