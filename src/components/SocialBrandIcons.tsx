import React from 'react';
import { Facebook, Instagram, Mail, MessageCircle, Youtube } from 'lucide-react';

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'email' | 'whatsapp' | 'youtube';

interface SocialIconProps {
  platform: SocialPlatform | string;
  className?: string;
  size?: number;
}

/**
 * Official recognizable brand icons.
 * Lucide is used for Facebook, Instagram, Mail, MessageCircle, and Youtube.
 * Pixel-perfect SVG matching official brand guidelines is used for TikTok.
 */
export const SocialBrandIcon: React.FC<SocialIconProps> = ({
  platform,
  className = 'w-4 h-4',
  size = 18
}) => {
  const p = (platform || '').toLowerCase().trim();

  switch (p) {
    case 'facebook':
    case 'fb':
      return <Facebook className={className} size={size} strokeWidth={2.2} />;

    case 'instagram':
    case 'ig':
      return <Instagram className={className} size={size} strokeWidth={2.2} />;

    case 'email':
    case 'mail':
    case 'supportemail':
      return <Mail className={className} size={size} strokeWidth={2.2} />;

    case 'tiktok':
    case 'tt':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          width={size}
          height={size}
          aria-hidden="true"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.068-.102a2.896 2.896 0 0 1 2.373-4.513c.277 0 .544.039.798.111V9.43a6.337 6.337 0 0 0-.798-.051C6.017 9.379 3.2 12.196 3.2 15.658c0 3.461 2.817 6.278 6.278 6.278 3.39 0 6.155-2.702 6.273-6.069V8.625a8.21 8.21 0 0 0 4.838 1.57V6.75a4.84 4.84 0 0 1-1-.064z" />
        </svg>
      );

    case 'whatsapp':
    case 'wa':
      return <MessageCircle className={className} size={size} strokeWidth={2.2} />;

    case 'youtube':
    case 'yt':
      return <Youtube className={className} size={size} strokeWidth={2.2} />;

    default:
      return <Mail className={className} size={size} strokeWidth={2.2} />;
  }
};

export interface SocialLinkItem {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'email';
  name: string;
  url: string;
  tooltip: string;
  hoverClass: string;
  brandColor: string;
}

interface SocialLinksBarProps {
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    email?: string;
    [key: string]: string | undefined;
  };
  supportEmail?: string;
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const SocialLinksBar: React.FC<SocialLinksBarProps> = ({
  socialLinks,
  supportEmail,
  theme = 'dark',
  size = 'md',
  showLabels = false,
  className = ''
}) => {
  const links = socialLinks || {};
  // Collect active platforms with valid, non-empty links
  const activeItems: SocialLinkItem[] = [];

  // 1. Facebook
  const fbUrl = (links.facebook || '').trim();
  if (fbUrl) {
    activeItems.push({
      platform: 'facebook',
      name: 'Facebook',
      url: fbUrl.startsWith('http') ? fbUrl : `https://${fbUrl}`,
      tooltip: 'Visit Ammi Express on Facebook',
      hoverClass: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]',
      brandColor: '#1877F2'
    });
  }

  // 2. Instagram
  const igUrl = (links.instagram || '').trim();
  if (igUrl) {
    activeItems.push({
      platform: 'instagram',
      name: 'Instagram',
      url: igUrl.startsWith('http') ? igUrl : `https://${igUrl}`,
      tooltip: 'Follow Ammi Express on Instagram',
      hoverClass: 'hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:text-white hover:border-pink-500',
      brandColor: '#E4405F'
    });
  }

  // 3. TikTok
  const ttUrl = (links.tiktok || '').trim();
  if (ttUrl) {
    activeItems.push({
      platform: 'tiktok',
      name: 'TikTok',
      url: ttUrl.startsWith('http') ? ttUrl : `https://${ttUrl}`,
      tooltip: 'Watch Ammi Express on TikTok',
      hoverClass: 'hover:bg-black hover:text-white hover:border-neutral-500 hover:shadow-[0_0_12px_rgba(37,244,238,0.3)]',
      brandColor: '#000000'
    });
  }

  // 4. Email
  const rawEmail = (links.email || supportEmail || '').trim();
  if (rawEmail) {
    const cleanMail = rawEmail.replace(/^mailto:/i, '').trim();
    if (cleanMail) {
      activeItems.push({
        platform: 'email',
        name: 'Email',
        url: `mailto:${cleanMail}`,
        tooltip: `Send email to ${cleanMail}`,
        hoverClass: 'hover:bg-[#EA4335] hover:text-white hover:border-[#EA4335]',
        brandColor: '#EA4335'
      });
    }
  }

  // If no links have been configured in Admin, render nothing
  if (activeItems.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base'
  };

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 22
  };

  const baseThemeClasses =
    theme === 'dark'
      ? 'bg-neutral-800 text-neutral-300 border border-neutral-700/80 hover:scale-105 active:scale-95'
      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:scale-105 active:scale-95';

  return (
    <div className={`flex items-center flex-wrap gap-2.5 ${className}`}>
      {activeItems.map((item) => (
        <a
          key={item.platform}
          href={item.url}
          target={item.platform === 'email' ? undefined : '_blank'}
          rel={item.platform === 'email' ? undefined : 'noopener noreferrer'}
          title={item.tooltip}
          aria-label={item.tooltip}
          className={`relative group inline-flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer ${sizeClasses[size]} ${baseThemeClasses} ${item.hoverClass}`}
        >
          <SocialBrandIcon platform={item.platform} size={iconSizes[size]} />

          {showLabels && (
            <span className="ml-2 font-bold text-xs">{item.name}</span>
          )}

          {/* Accessible Tooltip */}
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-50 shadow-md">
            {item.name}
          </span>
        </a>
      ))}
    </div>
  );
};
