import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Activity,
  ExternalLink,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Navigation,
  Settings,
  Sparkles,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SeoHead } from '../components/SeoHead';
import { OverviewPanel } from './sections/OverviewPanel';
import { PagesSectionsPanel } from './sections/PagesSectionsPanel';
import { HeroEditorPanel } from './sections/HeroEditorPanel';
import { AboutManagerPanel, SkillsToolsPanel } from './sections/AboutSkillsToolsPanel';
import { ProjectsManagerPanel } from './sections/ProjectsManagerPanel';
import { GalleryManagerPanel } from './sections/GalleryManagerPanel';
import { ServicesManagerPanel, TestimonialsManagerPanel } from './sections/ServicesTestimonialsPanel';
import { MediaLibraryPanel } from './sections/MediaLibraryPanel';
import {
  ActivityLogsPanel,
  AdminUsersPanel,
  ContactMessagesPanel,
  NavigationManagerPanel,
  WebsiteSettingsPanel,
} from './sections/MessagesSettingsUsersPanel';

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'hero', label: 'Hero Section', icon: Sparkles },
  { id: 'about', label: 'About', icon: User },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'services', label: 'Services', icon: Layers },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { id: 'skills', label: 'Skills & Tools', icon: Wrench },
  { id: 'media', label: 'Media Library', icon: ImageIcon },
  { id: 'messages', label: 'Contact Messages', icon: Mail },
  { id: 'navigation', label: 'Navigation Menu', icon: Navigation },
  { id: 'settings', label: 'Website Settings', icon: Settings },
  { id: 'users', label: 'Admin Users', icon: Users },
  { id: 'logs', label: 'Database / Activity Logs', icon: Activity },
];

export function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06152B] flex items-center justify-center text-sm text-[#A9BBD3]">
        Verifying administrator session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#06152B] text-[#F5F8FF] flex">
      <SeoHead title="Admin CMS Dashboard | Shyam Shahi Studio" description="Portfolio CMS" noIndex />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar (All 16 Navigation Items) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[268px] shrink-0 border-r border-[#24466C] bg-[#0B1F3A] flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-[68px] px-5 border-b border-[#24466C] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#2878FF] flex items-center justify-center font-display font-bold text-sm text-white">
              SS
            </span>
            <span className="font-display font-bold text-sm tracking-tight text-[#F5F8FF]">
              Studio CMS
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#A9BBD3] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  active
                    ? 'bg-[#2878FF] text-white'
                    : 'text-[#A9BBD3] hover:text-[#F5F8FF] hover:bg-[#0D2747]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#24466C] space-y-2">
          <div className="px-3 py-2 rounded-xl bg-[#06152B] border border-[#24466C]/70">
            <div className="text-xs font-bold text-[#F5F8FF] truncate">{user.full_name}</div>
            <div className="text-[11px] text-[#00B8FF] font-mono">
              {user.role === 'super_admin' ? 'Super Admin' : 'Editor'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-[68px] border-b border-[#24466C] bg-[#06152B]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#24466C] bg-[#0B1F3A] text-[#F5F8FF]"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono text-[#A9BBD3]">
              CMS / {SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label}
            </span>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#24466C] bg-[#0B1F3A] hover:border-[#2878FF] text-xs font-semibold text-[#F5F8FF] whitespace-nowrap"
          >
            <span>View Public Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#00B8FF]" />
          </a>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === 'overview' && <OverviewPanel onNavigate={setActiveTab} />}
          {activeTab === 'pages' && <PagesSectionsPanel />}
          {activeTab === 'hero' && <HeroEditorPanel />}
          {activeTab === 'about' && <AboutManagerPanel />}
          {activeTab === 'projects' && <ProjectsManagerPanel />}
          {activeTab === 'gallery' && <GalleryManagerPanel />}
          {activeTab === 'services' && <ServicesManagerPanel />}
          {activeTab === 'testimonials' && <TestimonialsManagerPanel />}
          {activeTab === 'skills' && <SkillsToolsPanel />}
          {activeTab === 'media' && <MediaLibraryPanel />}
          {activeTab === 'messages' && <ContactMessagesPanel />}
          {activeTab === 'navigation' && <NavigationManagerPanel />}
          {activeTab === 'settings' && <WebsiteSettingsPanel />}
          {activeTab === 'users' && <AdminUsersPanel />}
          {activeTab === 'logs' && <ActivityLogsPanel />}
        </main>
      </div>
    </div>
  );
}
