import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Database,
  Mail,
  Plus,
  Save,
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type {
  ActivityLog,
  AdminInvitation,
  AdminProfile,
  ContactMessage,
  NavigationItem,
  SiteSettings,
} from '../../types/cms';
import { useToast } from '../../components/ToastProvider';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// 11. CONTACT MESSAGES / LEAD CRM
// ---------------------------------------------------------------------------
export function ContactMessagesPanel() {
  const { toast, confirm } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const load = async () => {
    const res = await apiRequest<{ messages: ContactMessage[] }>('/api/admin/messages');
    setMessages(res.messages);
    if (selected) {
      const updated = res.messages.find((m) => m.id === selected.id) || null;
      setSelected(updated);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateLead = async (id: string, patch: Partial<ContactMessage>) => {
    await apiRequest(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    toast('Lead updated.');
    await load();
  };

  const deleteLead = async (m: ContactMessage) => {
    const ok = await confirm({
      title: `Delete inquiry from ${m.full_name}?`,
      description: 'This permanently deletes the contact submission.',
      confirmLabel: 'Delete Message',
      destructive: true,
    });
    if (!ok) return;
    await apiRequest(`/api/admin/messages/${m.id}`, { method: 'DELETE' });
    toast('Message deleted.');
    setSelected(null);
    await load();
  };

  const uniqueServices = ['All', ...Array.from(new Set(messages.map((m) => m.service_required)))];
  const filtered = messages.filter((m) => {
    if (serviceFilter !== 'All' && m.service_required !== serviceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.project_details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#F5F8FF]">Contact Messages &amp; Lead CRM</h2>
        <p className="text-sm text-[#A9BBD3]">
          Review inbound project leads, update status pipelines, and keep internal notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads by name, email, company..."
          className="flex-1 min-w-[220px] rounded-xl border border-[#24466C] bg-[#0D2747] px-3.5 py-2 text-sm text-[#F5F8FF]"
        />
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="rounded-xl border border-[#24466C] bg-[#0D2747] px-3.5 py-2 text-sm text-[#F5F8FF]"
        >
          {uniqueServices.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-8 text-center text-sm text-[#A9BBD3]">
              No matching contact submissions found.
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelected(m);
                  if (!m.is_read) void updateLead(m.id, { is_read: true });
                }}
                className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                  selected?.id === m.id
                    ? 'border-[#2878FF] bg-[#0D2747]'
                    : 'border-[#24466C] bg-[#0B1F3A] hover:border-[#2878FF]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[#F5F8FF]">{m.full_name}</span>
                  <span className="text-[11px] font-mono text-[#00B8FF] uppercase">
                    {m.lead_status}
                  </span>
                </div>
                <div className="text-xs text-[#A9BBD3] mt-0.5">
                  {m.service_required} · {m.created_at.slice(0, 10)}
                </div>
                {!m.is_read && (
                  <span className="inline-block mt-1.5 text-[11px] font-semibold text-[#22C55E]">
                    New Unread Lead
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-7">
          {selected ? (
            <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#F5F8FF]">{selected.full_name}</h3>
                  <p className="text-xs text-[#A9BBD3] mt-1">
                    {selected.email}
                    {selected.company ? ` · ${selected.company}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void updateLead(selected.id, { is_read: !selected.is_read })}
                    className="px-3 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#F5F8FF]"
                  >
                    {selected.is_read ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteLead(selected)}
                    className="p-2 rounded-lg border border-[#24466C] text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#24466C] bg-[#06152B] p-4 text-xs">
                <div>
                  <span className="text-[#A9BBD3]">Service Required</span>
                  <div className="font-semibold text-[#00B8FF] mt-0.5">{selected.service_required}</div>
                </div>
                <div>
                  <span className="text-[#A9BBD3]">Estimated Budget</span>
                  <div className="font-semibold text-[#F5F8FF] mt-0.5">
                    {selected.estimated_budget || 'Not specified'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#A9BBD3] mb-1.5">Project Details</div>
                <p className="text-sm text-[#F5F8FF] leading-relaxed whitespace-pre-line bg-[#06152B] rounded-xl border border-[#24466C] p-4">
                  {selected.project_details}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">Lead Status</label>
                  <select
                    value={selected.lead_status}
                    onChange={(e) =>
                      void updateLead(selected.id, {
                        lead_status: e.target.value as ContactMessage['lead_status'],
                      })
                    }
                    className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.service_required)}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
                  >
                    <Mail className="w-3.5 h-3.5" /> Reply via Email
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">Internal Notes</label>
                <textarea
                  rows={3}
                  value={selected.internal_notes}
                  onChange={(e) => setSelected({ ...selected, internal_notes: e.target.value })}
                  className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                />
                <button
                  type="button"
                  onClick={() => void updateLead(selected.id, { internal_notes: selected.internal_notes })}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-[#0B1F3A] border border-[#24466C] text-xs font-semibold text-[#00B8FF]"
                >
                  Save Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-12 text-center text-sm text-[#A9BBD3]">
              Select a submission on the left to view full details and manage lead status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 12. NAVIGATION MENU EDITOR
// ---------------------------------------------------------------------------
export function NavigationManagerPanel() {
  const { toast } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [items, setItems] = useState<NavigationItem[]>([]);

  useEffect(() => {
    apiRequest<{ items: NavigationItem[] }>('/api/admin/navigation').then((r) => setItems(r.items));
  }, []);

  const move = (idx: number, delta: number) => {
    const next = [...items];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    const [m] = next.splice(idx, 1);
    next.splice(target, 0, m);
    setItems(next);
  };

  const save = async () => {
    await apiRequest('/api/admin/navigation', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
    toast('Navigation menu saved.');
    await refreshPortfolio();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Navigation Menu</h2>
          <p className="text-sm text-[#A9BBD3]">Reorder, rename, or toggle header navigation links.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setItems([
                ...items,
                { id: '', label: 'NEW LINK', url: '/', is_cta: false, is_visible: true, sort_order: items.length + 1 },
              ])
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#24466C] text-xs font-semibold text-[#F5F8FF]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Link
          </button>
          <button
            type="button"
            onClick={() => void save()}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5" /> Save Menu
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
          >
            <input
              type="text"
              value={item.label}
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...item, label: e.target.value };
                setItems(next);
              }}
              className="sm:col-span-3 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs font-semibold text-[#F5F8FF]"
            />
            <input
              type="text"
              value={item.url}
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...item, url: e.target.value };
                setItems(next);
              }}
              className="sm:col-span-4 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs font-mono text-[#F5F8FF]"
            />
            <label className="sm:col-span-2 inline-flex items-center gap-2 text-xs text-[#F5F8FF]">
              <input
                type="checkbox"
                checked={item.is_cta}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, is_cta: e.target.checked };
                  setItems(next);
                }}
              />
              <span>Blue CTA</span>
            </label>
            <label className="sm:col-span-1 inline-flex items-center gap-1.5 text-xs text-[#F5F8FF]">
              <input
                type="checkbox"
                checked={item.is_visible}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, is_visible: e.target.checked };
                  setItems(next);
                }}
              />
              <span>Show</span>
            </label>
            <div className="sm:col-span-2 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                className="p-2 rounded-lg border border-[#24466C] text-[#A9BBD3]"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                className="p-2 rounded-lg border border-[#24466C] text-[#A9BBD3]"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                className="p-2 rounded-lg border border-[#24466C] text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 13. WEBSITE SETTINGS (Super Admin Only)
// ---------------------------------------------------------------------------
export function WebsiteSettingsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    apiRequest<{ settings: SiteSettings }>('/api/admin/settings').then((r) => setSettings(r.settings));
  }, []);

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-8 text-center">
        <Shield className="w-8 h-8 text-[#00B8FF] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#F5F8FF]">Super Admin Access Required</h2>
        <p className="text-sm text-[#A9BBD3] mt-1">
          Editors cannot modify global website settings, Cloudflare CDN, or analytics keys.
        </p>
      </div>
    );
  }

  if (!settings) return null;

  const handleSave = async () => {
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      toast('Website settings published.');
      await refreshPortfolio();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Website Settings &amp; CDN</h2>
          <p className="text-sm text-[#A9BBD3]">
            Configure branding, SEO defaults, analytics IDs, Cloudflare CDN, and maintenance mode.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Website / Brand Name</label>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Contact Email</label>
          <input
            type="email"
            value={settings.contact_email}
            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">WhatsApp Number</label>
          <input
            type="text"
            value={settings.whatsapp_number}
            onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Business Hours</label>
          <input
            type="text"
            value={settings.business_hours}
            onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Default SEO Title</label>
          <input
            type="text"
            value={settings.seo_default_title}
            onChange={(e) => setSettings({ ...settings, seo_default_title: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Default Meta Description</label>
          <input
            type="text"
            value={settings.seo_default_description}
            onChange={(e) => setSettings({ ...settings, seo_default_description: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Google Analytics ID</label>
          <input
            type="text"
            placeholder="G-XXXXXXXXXX"
            value={settings.google_analytics_id}
            onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm font-mono text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Meta Pixel ID</label>
          <input
            type="text"
            placeholder="1234567890"
            value={settings.meta_pixel_id}
            onChange={(e) => setSettings({ ...settings, meta_pixel_id: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm font-mono text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Cloudflare CDN Domain (Optional)</label>
          <input
            type="text"
            placeholder="cdn.shyamshahi.studio"
            value={settings.cloudflare_cdn_domain}
            onChange={(e) => setSettings({ ...settings, cloudflare_cdn_domain: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm font-mono text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Cloudflare R2 Public Bucket URL</label>
          <input
            type="text"
            placeholder="https://media.shyamshahi.studio"
            value={settings.cloudflare_r2_public_url}
            onChange={(e) => setSettings({ ...settings, cloudflare_r2_public_url: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm font-mono text-[#F5F8FF]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-[#A9BBD3] mb-1">Footer Intro Text</label>
          <input
            type="text"
            value={settings.footer_intro}
            onChange={(e) => setSettings({ ...settings, footer_intro: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Copyright Notice</label>
          <input
            type="text"
            value={settings.copyright_text}
            onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>
        <label className="flex items-center gap-2.5 text-sm text-[#F5F8FF] pt-5 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.maintenance_mode}
            onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
            className="w-4 h-4 accent-[#2878FF]"
          />
          <span>Enable Maintenance Mode on Public Site</span>
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 14. ADMIN USERS & INVITATIONS (Super Admin Only)
// ---------------------------------------------------------------------------
export function AdminUsersPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'super_admin'>('editor');

  const load = async () => {
    if (user?.role !== 'super_admin') return;
    const res = await apiRequest<{ users: AdminProfile[]; invitations: AdminInvitation[] }>(
      '/api/admin/users'
    );
    setUsers(res.users);
    setInvitations(res.invitations);
  };

  useEffect(() => {
    void load();
  }, [user?.role]);

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-8 text-center">
        <Shield className="w-8 h-8 text-[#00B8FF] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#F5F8FF]">Super Admin Access Required</h2>
        <p className="text-sm text-[#A9BBD3] mt-1">
          Only Super Admins can invite, promote, or deactivate administrator accounts.
        </p>
      </div>
    );
  }

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail('');
      toast('Invitation token generated.');
      await load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const toggleActive = async (u: AdminProfile) => {
    try {
      await apiRequest(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      toast('Administrator status updated.');
      await load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const changeRole = async (u: AdminProfile, role: 'super_admin' | 'editor') => {
    await apiRequest(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    toast('Role updated.');
    await load();
  };

  const copyInviteLink = async (inv: AdminInvitation) => {
    const url = `${window.location.origin}/admin/signup?email=${encodeURIComponent(
      inv.email
    )}&token=${encodeURIComponent(inv.token)}`;
    await navigator.clipboard.writeText(url);
    toast('Invitation signup URL copied.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#F5F8FF]">Admin Users &amp; Invitations</h2>
        <p className="text-sm text-[#A9BBD3]">
          Role-based access control (Super Admin &amp; Editor) with invite-only onboarding.
        </p>
      </div>

      <form
        onSubmit={createInvite}
        className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-5 flex flex-wrap items-center gap-3"
      >
        <UserPlus className="w-4 h-4 text-[#00B8FF]" />
        <input
          type="email"
          required
          placeholder="Invite administrator email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as 'editor' | 'super_admin')}
          className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
        >
          <option value="editor">Editor</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
        >
          Generate Invite Token
        </button>
      </form>

      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-3">
        <h3 className="text-sm font-bold text-[#F5F8FF]">Active &amp; Registered Admins</h3>
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-[#24466C] bg-[#06152B] p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div className="text-sm font-bold text-[#F5F8FF]">{u.full_name}</div>
              <div className="text-xs text-[#A9BBD3]">{u.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={u.role}
                disabled={u.id === user.id}
                onChange={(e) => void changeRole(u, e.target.value as 'super_admin' | 'editor')}
                className="rounded-lg border border-[#24466C] bg-[#0D2747] px-2.5 py-1.5 text-xs text-[#F5F8FF]"
              >
                <option value="super_admin">Super Admin</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="button"
                disabled={u.id === user.id}
                onClick={() => void toggleActive(u)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  u.is_active
                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                    : 'bg-rose-500/15 text-rose-300'
                } disabled:opacity-50`}
              >
                {u.is_active ? 'Active' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {invitations.length > 0 && (
        <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-3">
          <h3 className="text-sm font-bold text-[#F5F8FF]">Pending &amp; Used Invitations</h3>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="rounded-xl border border-[#24466C] bg-[#06152B] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-semibold text-[#F5F8FF]">{inv.email}</span>
                <span className="ml-2 font-mono text-[#00B8FF]">[{inv.role}]</span>
                <span className="ml-2 text-[#A9BBD3]">
                  {inv.accepted_at ? `Accepted ${inv.accepted_at.slice(0, 10)}` : 'Pending'}
                </span>
              </div>
              {!inv.accepted_at && (
                <button
                  type="button"
                  onClick={() => void copyInviteLink(inv)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#24466C] text-[#00B8FF]"
                >
                  <Copy className="w-3 h-3" /> Copy Invite URL
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 15. DATABASE & ACTIVITY LOGS
// ---------------------------------------------------------------------------
export function ActivityLogsPanel() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    apiRequest<{ logs: ActivityLog[] }>('/api/admin/logs').then((r) => setLogs(r.logs));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#F5F8FF]">Database &amp; Activity Logs</h2>
        <p className="text-sm text-[#A9BBD3]">
          Runtime storage health, Supabase deployment bridge, and full CMS audit trail.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-5 flex items-center gap-4">
          <Database className="w-7 h-7 text-[#22C55E]" />
          <div>
            <div className="text-xs text-[#A9BBD3]">Active Local Relational Engine</div>
            <div className="text-sm font-bold text-[#F5F8FF]">SQLite WAL Persistent Database (20 Tables)</div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-5 flex items-center gap-4">
          <Check className="w-7 h-7 text-[#00B8FF]" />
          <div>
            <div className="text-xs text-[#A9BBD3]">Supabase PostgreSQL + RLS Bridge</div>
            <div className="text-sm font-bold text-[#F5F8FF]">
              {isSupabaseConfigured
                ? 'Connected via VITE_SUPABASE_URL'
                : 'Ready — Schema & RLS in database/supabase_schema.sql'}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1F3A] border-b border-[#24466C] text-[#A9BBD3]">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24466C]/50">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-[#0B1F3A]/60">
                  <td className="px-4 py-3 font-mono tabular-nums text-[#A9BBD3]">
                    {l.created_at.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#00B8FF]">{l.action}</td>
                  <td className="px-4 py-3 text-[#F5F8FF]">{l.entity_type}</td>
                  <td className="px-4 py-3 text-[#A9BBD3]">{l.actor_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
