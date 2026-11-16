import { useEffect, useState } from 'react';
import { ExternalLink, Eye, Image as ImageIcon, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { HeroContent } from '../../types/cms';
import { useToast } from '../../components/ToastProvider';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { SmartImage } from '../../components/SmartImage';

export function HeroEditorPanel() {
  const { toast } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'portrait' | 'background' | null>(null);
  const [newLabel, setNewLabel] = useState('');

  const loadHero = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ hero: HeroContent }>('/api/admin/hero');
      const active = res.hero.draft_data ? { ...res.hero, ...res.hero.draft_data } : res.hero;
      setHero(active);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHero();
  }, []);

  const saveHero = async (mode: 'save_draft' | 'publish' | 'discard_draft') => {
    if (!hero) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ hero: HeroContent; message: string }>('/api/admin/hero', {
        method: 'PUT',
        body: JSON.stringify({ ...hero, mode }),
      });
      setHero(res.hero.draft_data ? { ...res.hero, ...res.hero.draft_data } : res.hero);
      toast(res.message);
      await refreshPortfolio();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !hero) {
    return <div className="h-96 rounded-2xl border border-[#24466C] bg-[#0D2747] animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Hero Section Editor</h2>
          <p className="text-sm text-[#A9BBD3]">
            Customize headlines, portrait positioning/cropping, floating labels, and CTAs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hero.draft_data && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveHero('discard_draft')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#24466C] text-xs font-semibold text-[#A9BBD3] hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Discard Draft
            </button>
          )}
          <a
            href="/?preview=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#24466C] bg-[#0D2747] text-xs font-semibold text-[#00B8FF] hover:border-[#2878FF]"
          >
            <Eye className="w-3.5 h-3.5" /> Preview <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveHero('save_draft')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#24466C] bg-[#0B1F3A] text-xs font-semibold text-[#F5F8FF] hover:border-[#2878FF]"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveHero('publish')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-xs font-semibold text-white"
          >
            <Send className="w-3.5 h-3.5" /> Publish Live
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="xl:col-span-7 space-y-5 rounded-2xl border border-[#24466C] bg-[#0D2747] p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Intro Kicker</label>
              <input
                type="text"
                value={hero.intro_text}
                onChange={(e) => setHero({ ...hero, intro_text: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Main Heading</label>
              <input
                type="text"
                value={hero.main_heading}
                onChange={(e) => setHero({ ...hero, main_heading: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Supporting Heading</label>
            <input
              type="text"
              value={hero.supporting_heading}
              onChange={(e) => setHero({ ...hero, supporting_heading: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Hero Description</label>
            <textarea
              rows={4}
              value={hero.description}
              onChange={(e) => setHero({ ...hero, description: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Primary CTA Label</label>
              <input
                type="text"
                value={hero.primary_cta_label}
                onChange={(e) => setHero({ ...hero, primary_cta_label: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Primary CTA URL</label>
              <input
                type="text"
                value={hero.primary_cta_url}
                onChange={(e) => setHero({ ...hero, primary_cta_url: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Secondary CTA Label</label>
              <input
                type="text"
                value={hero.secondary_cta_label}
                onChange={(e) => setHero({ ...hero, secondary_cta_label: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Secondary CTA URL</label>
              <input
                type="text"
                value={hero.secondary_cta_url}
                onChange={(e) => setHero({ ...hero, secondary_cta_url: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
          </div>

          {/* Portrait & Background Controls */}
          <div className="pt-2 border-t border-[#24466C]/70 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#F5F8FF]">Portrait Image &amp; Framing</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerTarget('portrait')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2878FF]/20 border border-[#2878FF]/40 text-xs font-semibold text-[#00B8FF]"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Replace Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setPickerTarget('background')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#A9BBD3]"
                >
                  Set Background Image
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#A9BBD3] mb-1">
                  Horizontal Crop ({hero.crop_x}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hero.crop_x}
                  onChange={(e) => setHero({ ...hero, crop_x: Number(e.target.value) })}
                  className="w-full accent-[#2878FF]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A9BBD3] mb-1">
                  Vertical Crop ({hero.crop_y}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hero.crop_y}
                  onChange={(e) => setHero({ ...hero, crop_y: Number(e.target.value) })}
                  className="w-full accent-[#2878FF]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A9BBD3] mb-1">
                  Zoom ({hero.zoom.toFixed(2)}x)
                </label>
                <input
                  type="range"
                  min={1}
                  max={1.6}
                  step={0.02}
                  value={hero.zoom}
                  onChange={(e) => setHero({ ...hero, zoom: Number(e.target.value) })}
                  className="w-full accent-[#2878FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs text-[#A9BBD3] mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hero.background_color || '#06152B'}
                    onChange={(e) => setHero({ ...hero, background_color: e.target.value })}
                    className="h-9 w-12 rounded border border-[#24466C] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={hero.background_color}
                    onChange={(e) => setHero({ ...hero, background_color: e.target.value })}
                    className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs font-mono text-[#F5F8FF]"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-[#F5F8FF] pt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hero.animation_enabled}
                  onChange={(e) => setHero({ ...hero, animation_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#2878FF]"
                />
                <span>Enable Subtle Motion Animations</span>
              </label>
            </div>
          </div>

          {/* Floating Labels */}
          <div className="pt-2 border-t border-[#24466C]/70 space-y-3">
            <label className="block text-xs font-semibold text-[#F5F8FF]">Floating Portrait Labels</label>
            <div className="flex flex-wrap gap-2">
              {hero.floating_labels.map((lbl, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#24466C] bg-[#06152B] text-xs text-[#F5F8FF]"
                >
                  {lbl}
                  <button
                    type="button"
                    onClick={() =>
                      setHero({
                        ...hero,
                        floating_labels: hero.floating_labels.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-[#A9BBD3] hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add label e.g. AI Strategist"
                className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newLabel.trim()) return;
                  setHero({ ...hero, floating_labels: [...hero.floating_labels, newLabel.trim()] });
                  setNewLabel('');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Social Links */}
          <div className="pt-2 border-t border-[#24466C]/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F5F8FF]">Hero Social Links</span>
              <button
                type="button"
                onClick={() =>
                  setHero({
                    ...hero,
                    social_links: [...hero.social_links, { platform: 'Instagram', url: 'https://' }],
                  })
                }
                className="text-xs text-[#00B8FF] font-semibold hover:underline"
              >
                + Add Social Link
              </button>
            </div>
            <div className="space-y-2">
              {hero.social_links.map((soc, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={soc.platform}
                    onChange={(e) => {
                      const next = [...hero.social_links];
                      next[idx] = { ...soc, platform: e.target.value };
                      setHero({ ...hero, social_links: next });
                    }}
                    placeholder="Platform"
                    className="col-span-4 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                  />
                  <input
                    type="url"
                    value={soc.url}
                    onChange={(e) => {
                      const next = [...hero.social_links];
                      next[idx] = { ...soc, url: e.target.value };
                      setHero({ ...hero, social_links: next });
                    }}
                    placeholder="https://..."
                    className="col-span-7 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setHero({
                        ...hero,
                        social_links: hero.social_links.filter((_, i) => i !== idx),
                      })
                    }
                    className="col-span-1 flex items-center justify-center rounded-xl border border-[#24466C] text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instant Live Preview */}
        <div className="xl:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-[#24466C] bg-[#0B1F3A] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00B8FF]">
                Instant Hero Preview
              </span>
              <span className="text-[11px] text-[#A9BBD3]">
                {hero.draft_data ? 'Unpublished Draft Changes' : 'Live Synced'}
              </span>
            </div>

            <div
              className="rounded-xl border border-[#24466C] p-5 space-y-4"
              style={{ backgroundColor: hero.background_color || '#06152B' }}
            >
              <p className="text-[11px] font-medium text-[#00B8FF]">{hero.intro_text}</p>
              <h3 className="text-xl font-bold text-[#F5F8FF] leading-tight">{hero.main_heading}</h3>
              <p className="text-xs font-medium text-[#F5F8FF]/90">{hero.supporting_heading}</p>
              <p className="text-xs text-[#A9BBD3] line-clamp-3">{hero.description}</p>

              <div className="relative rounded-xl border border-[#24466C] overflow-hidden aspect-[4/5] max-w-[260px] mx-auto bg-[#06152B]">
                <SmartImage
                  src={hero.portrait_url}
                  alt="Hero portrait preview"
                  objectPosition={`${hero.crop_x}% ${hero.crop_y}%`}
                  zoom={hero.zoom}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                  {hero.floating_labels.map((l, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[#06152B]/85 border border-[#24466C] text-[10px] text-white"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(url) => {
          if (pickerTarget === 'portrait') setHero({ ...hero, portrait_url: url });
          if (pickerTarget === 'background') setHero({ ...hero, background_image_url: url });
        }}
      />
    </div>
  );
}
