import {
  BarChart3,
  Bot,
  Compass,
  Film,
  Globe,
  Image as ImageIcon,
  Instagram,
  Layers,
  Linkedin,
  Megaphone,
  MessageCircle,
  MessageSquareCode,
  Palette,
  PenTool,
  Scissors,
  Share2,
  Sparkles,
  Youtube,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Share2,
  Sparkles,
  Palette,
  MessageSquareCode,
  Compass,
  Image: ImageIcon,
  Film,
  PenTool,
  Scissors,
  Megaphone,
  Bot,
  BarChart3,
  Layers,
  Zap,
  Globe,
};

export function DynamicIcon({
  name,
  className = 'w-5 h-5',
}: {
  name?: string;
  className?: string;
}) {
  const IconComp = (name && ICON_MAP[name]) || Sparkles;
  return <IconComp className={className} aria-hidden="true" />;
}

export function SocialIcon({
  platform,
  className = 'w-4 h-4',
}: {
  platform: string;
  className?: string;
}) {
  const key = platform.toLowerCase();
  if (key.includes('instagram')) return <Instagram className={className} aria-hidden="true" />;
  if (key.includes('linkedin')) return <Linkedin className={className} aria-hidden="true" />;
  if (key.includes('youtube')) return <Youtube className={className} aria-hidden="true" />;
  if (key.includes('whatsapp')) return <MessageCircle className={className} aria-hidden="true" />;
  return <Globe className={className} aria-hidden="true" />;
}
