import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { SiteSettings, SkillRecord, TimelineItem, ToolRecord } from '../../types/cms';
import { useToast } from '../../components/ToastProvider';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import { MediaPickerModal } from '../components/MediaPickerModal';

export function AboutManagerPanel() {
  const { toast } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [newMilestone, setNewMilestone] = useState({ year: '', role: '', description: '' });
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = async () => {
    const res = await apiRequest<{ settings: SiteSettings; timeline: TimelineItem[] }>('/api/admin/about');
    setSettings(res.settings);
    setTimeline(res.timeline);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveAbout = async () => {
    if (!settings) return;
    await apiRequest('/api/admin/about', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    toast('About page details updated.');
    await refreshPortfolio();
  };

  const addMilestone = async () => {
    if (!newMilestone.year || !newMilestone.role) return;
    await apiRequest('/api/admin/timeline', {
      method: 'POST',
      body: JSON.stringify(newMilestone),
    });
    setNewMilestone({ year: '', role: '', description: '' });
    toast('Timeline milestone added.');
    await load();
    await refreshPortfolio();
  };

  const deleteMilestone = async (id: string) => {
    await apiRequest(`/api/admin/timeline/${id}`, { method: 'DELETE' });
    toast('Milestone removed.');
    await load();
    await refreshPortfolio();
  };

  if (!settings) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">About Page &amp; Journey</h2>
          <p className="text-sm text-[#A9BBD3]">
            Control biography, mission statement, CV link, professional info, and timeline milestones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void saveAbout()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
        >
          <Save className="w-4 h-4" /> Save About Profile
        </button>
      </div>

      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">About Hero Heading</label>
            <input
              type="text"
              value={settings.about_heading}
              onChange={(e) => setSettings({ ...settings, about_heading: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">About Portrait</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.about_portrait_url}
                onChange={(e) => setSettings({ ...settings, about_portrait_url: e.target.value })}
                className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
              />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3 py-2 rounded-xl border border-[#24466C] text-xs text-[#00B8FF]"
              >
                Pick
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Professional Biography</label>
          <textarea
            rows={7}
            value={settings.about_bio}
            onChange={(e) => setSettings({ ...settings, about_bio: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>

        <div>
          <label className="block text-xs text-[#A9BBD3] mb-1">Mission Statement</label>
          <input
            type="text"
            value={settings.about_mission}
            onChange={(e) => setSettings({ ...settings, about_mission: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Location</label>
            <input
              type="text"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Languages</label>
            <input
              type="text"
              value={settings.languages}
              onChange={(e) => setSettings({ ...settings, languages: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Availability</label>
            <input
              type="text"
              value={settings.availability}
              onChange={(e) => setSettings({ ...settings, availability: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Experience Focus</label>
            <input
              type="text"
              value={settings.experience_summary}
              onChange={(e) => setSettings({ ...settings, experience_summary: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-[#A9BBD3] mb-1">
              Downloadable CV URL (PDF or Google Drive Link)
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={settings.cv_url}
              onChange={(e) => setSettings({ ...settings, cv_url: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-4">
        <h3 className="text-base font-bold text-[#F5F8FF]">My Journey Timeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Year / Phase"
            value={newMilestone.year}
            onChange={(e) => setNewMilestone({ ...newMilestone, year: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <input
            type="text"
            placeholder="Role / Milestone"
            value={newMilestone.role}
            onChange={(e) => setNewMilestone({ ...newMilestone, role: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <input
            type="text"
            placeholder="Short description"
            value={newMilestone.description}
            onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <button
            type="button"
            onClick={() => void addMilestone()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2878FF] text-white text-xs font-semibold py-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Milestone
          </button>
        </div>

        <div className="space-y-2.5">
          {timeline.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#24466C] bg-[#06152B] p-4 flex items-center justify-between gap-4"
            >
              <div>
                <span className="text-xs font-mono text-[#00B8FF]">{item.year}</span>
                <h4 className="text-sm font-bold text-[#F5F8FF]">{item.role}</h4>
                <p className="text-xs text-[#A9BBD3] mt-0.5">{item.description}</p>
              </div>
              <button
                type="button"
                onClick={() => void deleteMilestone(item.id)}
                className="p-2 rounded-lg border border-[#24466C] text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => setSettings({ ...settings, about_portrait_url: url })}
      />
    </div>
  );
}

export function SkillsToolsPanel() {
  const { toast } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    icon_name: 'Sparkles',
    proficiency: '',
    show_proficiency: false,
  });
  const [newTool, setNewTool] = useState({ name: '', category: 'AI Production', badge_text: '' });

  const load = async () => {
    const res = await apiRequest<{ skills: SkillRecord[]; tools: ToolRecord[] }>(
      '/api/admin/skills-tools'
    );
    setSkills(res.skills);
    setTools(res.tools);
  };

  useEffect(() => {
    void load();
  }, []);

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;
    await apiRequest('/api/admin/skills', {
      method: 'POST',
      body: JSON.stringify({
        ...newSkill,
        proficiency: newSkill.proficiency ? Number(newSkill.proficiency) : null,
      }),
    });
    setNewSkill({ name: '', description: '', icon_name: 'Sparkles', proficiency: '', show_proficiency: false });
    toast('Skill added.');
    await load();
    await refreshPortfolio();
  };

  const toggleSkillProficiency = async (sk: SkillRecord) => {
    await apiRequest(`/api/admin/skills/${sk.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        show_proficiency: !sk.show_proficiency,
        proficiency: sk.proficiency ?? 90,
      }),
    });
    await load();
    await refreshPortfolio();
  };

  const deleteSkill = async (id: string) => {
    await apiRequest(`/api/admin/skills/${id}`, { method: 'DELETE' });
    await load();
    await refreshPortfolio();
  };

  const addTool = async () => {
    if (!newTool.name.trim()) return;
    await apiRequest('/api/admin/tools', {
      method: 'POST',
      body: JSON.stringify(newTool),
    });
    setNewTool({ name: '', category: 'AI Production', badge_text: '' });
    toast('Tool added.');
    await load();
    await refreshPortfolio();
  };

  const deleteTool = async (id: string) => {
    await apiRequest(`/api/admin/tools/${id}`, { method: 'DELETE' });
    await load();
    await refreshPortfolio();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#F5F8FF]">Skills &amp; Tools Manager</h2>
        <p className="text-sm text-[#A9BBD3]">
          Manage Creative Toolkit cards, optional proficiency bars, and Tools &amp; Technologies.
        </p>
      </div>

      {/* Skills */}
      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-4">
        <h3 className="text-base font-bold text-[#F5F8FF]">Skills (Creative Toolkit)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Skill name"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <input
            type="text"
            placeholder="Description"
            value={newSkill.description}
            onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
            className="sm:col-span-2 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Proficiency % (optional)"
            value={newSkill.proficiency}
            onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <button
            type="button"
            onClick={() => void addSkill()}
            className="rounded-xl bg-[#2878FF] text-white text-xs font-semibold py-2"
          >
            + Add Skill
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {skills.map((sk) => (
            <div
              key={sk.id}
              className="rounded-xl border border-[#24466C] bg-[#06152B] p-4 flex items-start justify-between gap-3"
            >
              <div>
                <div className="text-sm font-bold text-[#F5F8FF]">{sk.name}</div>
                <p className="text-xs text-[#A9BBD3] mt-1">{sk.description}</p>
                <button
                  type="button"
                  onClick={() => void toggleSkillProficiency(sk)}
                  className="mt-2 text-[11px] font-medium text-[#00B8FF] hover:underline"
                >
                  {sk.show_proficiency ? `Showing ${sk.proficiency}% bar (Hide)` : 'Show proficiency bar'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => void deleteSkill(sk.id)}
                className="p-1.5 rounded-lg border border-[#24466C] text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-4">
        <h3 className="text-base font-bold text-[#F5F8FF]">Tools &amp; Technologies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Tool name (e.g. Midjourney)"
            value={newTool.name}
            onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <input
            type="text"
            placeholder="Category (e.g. AI Visuals)"
            value={newTool.category}
            onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <input
            type="text"
            placeholder="Role / Badge"
            value={newTool.badge_text}
            onChange={(e) => setNewTool({ ...newTool, badge_text: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <button
            type="button"
            onClick={() => void addTool()}
            className="rounded-xl bg-[#2878FF] text-white text-xs font-semibold py-2"
          >
            + Add Tool
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {tools.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-[#24466C] bg-[#06152B] p-3.5 flex items-start justify-between gap-2"
            >
              <div>
                <div className="text-[11px] text-[#00B8FF]">{t.category}</div>
                <div className="text-sm font-bold text-[#F5F8FF]">{t.name}</div>
              </div>
              <button
                type="button"
                onClick={() => void deleteTool(t.id)}
                className="text-rose-400 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
