import { useEffect, useState } from 'react';
import {
  FileText,
  FolderKanban,
  Image,
  Layers,
  Mail,
  MessageSquareQuote,
  Sparkles,
  FileEdit,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { ActivityLog, ContactMessage } from '../../types/cms';

interface OverviewResponse {
  stats: {
    totalProjects: number;
    totalGalleryItems: number;
    totalServices: number;
    totalTestimonials: number;
    totalMessages: number;
    unreadMessages: number;
    publishedPages: number;
    draftContent: number;
  };
  recentLogs: ActivityLog[];
  recentMessages: ContactMessage[];
}

export function OverviewPanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiRequest<OverviewResponse>('/api/admin/overview')
      .then((res) => {
        if (mounted) setData(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-[#24466C] bg-[#0D2747]" />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Projects', value: data.stats.totalProjects, icon: FolderKanban, tab: 'projects' },
    { label: 'Gallery Items', value: data.stats.totalGalleryItems, icon: Image, tab: 'gallery' },
    { label: 'Services', value: data.stats.totalServices, icon: Sparkles, tab: 'services' },
    { label: 'Testimonials', value: data.stats.totalTestimonials, icon: MessageSquareQuote, tab: 'testimonials' },
    { label: 'Contact Messages', value: data.stats.totalMessages, icon: Mail, tab: 'messages' },
    { label: 'Unread Messages', value: data.stats.unreadMessages, icon: Mail, tab: 'messages', highlight: data.stats.unreadMessages > 0 },
    { label: 'Published Pages', value: data.stats.publishedPages, icon: FileText, tab: 'pages' },
    { label: 'Draft Content', value: data.stats.draftContent, icon: FileEdit, tab: 'pages' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#F5F8FF]">Dashboard Overview</h2>
        <p className="text-sm text-[#A9BBD3] mt-1">
          Live portfolio database metrics and recent editorial activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onNavigate(c.tab)}
              className={`text-left rounded-2xl border p-5 transition-colors ${
                c.highlight
                  ? 'border-[#2878FF] bg-[#0D2747]'
                  : 'border-[#24466C] bg-[#0D2747] hover:border-[#2878FF]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#A9BBD3]">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.highlight ? 'text-[#00B8FF]' : 'text-[#2878FF]'}`} />
              </div>
              <div className="mt-3 text-3xl font-display font-bold text-[#F5F8FF] tabular-nums">
                {c.value}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#F5F8FF]">Recent Inquiries</h3>
            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="text-xs font-semibold text-[#00B8FF] hover:underline"
            >
              View All
            </button>
          </div>
          {data.recentMessages.length === 0 ? (
            <p className="text-sm text-[#A9BBD3]">No contact form submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentMessages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-[#24466C]/80 bg-[#06152B] p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#F5F8FF] truncate">{m.full_name}</span>
                      {!m.is_read && (
                        <span className="text-[11px] font-semibold text-[#00B8FF]">Unread</span>
                      )}
                    </div>
                    <p className="text-xs text-[#A9BBD3] truncate">{m.service_required}</p>
                  </div>
                  <span className="text-[11px] font-mono text-[#A9BBD3] shrink-0">
                    {m.created_at.slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Logs */}
        <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#F5F8FF]">Recent CMS Activity</h3>
            <button
              type="button"
              onClick={() => onNavigate('logs')}
              className="text-xs font-semibold text-[#00B8FF] hover:underline"
            >
              Full Logs
            </button>
          </div>
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
            {data.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-[#24466C]/50 last:border-0 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-mono text-[#00B8FF]">{log.action}</span>
                  <span className="text-[#A9BBD3] ml-2">
                    by {log.actor_email || 'system'}
                  </span>
                </div>
                <span className="font-mono text-[#A9BBD3]/80 tabular-nums shrink-0">
                  {log.created_at.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
