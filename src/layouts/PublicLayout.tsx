import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Mail, Menu, X, Lock, Wrench } from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { SocialIcon } from '../components/Icons';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data, isPreview } = usePortfolioData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const settings = data?.settings;
  const navigation = data?.navigation || [
    { id: '1', label: 'HOME', url: '/', is_cta: false, is_visible: true, sort_order: 1 },
    { id: '2', label: 'ABOUT', url: '/about', is_cta: false, is_visible: true, sort_order: 2 },
    { id: '3', label: 'PROJECTS', url: '/projects', is_cta: false, is_visible: true, sort_order: 3 },
    { id: '5', label: 'SERVICES', url: '/services', is_cta: false, is_visible: true, sort_order: 4 },
    { id: '6', label: 'CONTACT', url: '/contact', is_cta: true, is_visible: true, sort_order: 5 },
  ];

  const mainNavLinks = navigation.filter((n) => !n.is_cta);
  const ctaNav = navigation.find((n) => n.is_cta) || {
    id: 'contact',
    label: "Let's Talk",
    url: '/contact',
  };

  if (settings?.maintenance_mode && !isPreview) {
    return (
      <div className="min-h-screen bg-[#06152B] text-[#F5F8FF] flex flex-col items-center justify-center px-6 text-center">
        <Wrench className="w-10 h-10 text-[#00B8FF] mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">Studio Refresh In Progress</h1>
        <p className="mt-3 text-[#A9BBD3] max-w-md">
          {settings.site_name || 'Shyam Shahi Studio'} is currently updating its portfolio showcase. Please check back shortly.
        </p>
        <Link
          to="/admin/login"
          className="mt-8 inline-flex items-center gap-2 text-xs text-[#A9BBD3] hover:text-[#F5F8FF]"
        >
          <Lock className="w-3.5 h-3.5" /> Admin Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#06152B] text-[#F5F8FF]">
      {isPreview && (
        <div className="bg-[#2878FF] text-white text-xs font-medium py-1.5 px-4 text-center">
          Preview Mode Active — Viewing unpublished draft changes.{' '}
          <Link to="/admin/dashboard" className="underline ml-2">
            Return to Admin CMS
          </Link>
        </div>
      )}

      {/* Sticky 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[#24466C]/70 bg-[#06152B]/90 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-[72px] flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2878FF] rounded-lg"
          >
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name}
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#2878FF] text-white font-display font-bold text-base tracking-tight">
                SS
              </span>
            )}
            <span className="font-display font-bold text-lg tracking-tight text-[#F5F8FF]">
              {settings?.site_name || 'SHYAM SHAHI'}
            </span>
          </Link>

          {/* Zone 2: Primary Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wider"
          >
            {mainNavLinks.map((item) => {
              const active =
                item.url === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.url);
              return (
                <NavLink
                  key={item.id}
                  to={item.url}
                  className={`relative py-2 whitespace-nowrap shrink-0 transition-colors ${
                    active ? 'text-[#00B8FF]' : 'text-[#A9BBD3] hover:text-[#F5F8FF]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#2878FF] rounded-full" />
                  )}
                </NavLink>
              );
            })}
            {/* Also show CONTACT link in nav if configured */}
            <NavLink
              to="/contact"
              className={`relative py-2 whitespace-nowrap shrink-0 transition-colors ${
                location.pathname.startsWith('/contact')
                  ? 'text-[#00B8FF]'
                  : 'text-[#A9BBD3] hover:text-[#F5F8FF]'
              }`}
            >
              CONTACT
              {location.pathname.startsWith('/contact') && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#2878FF] rounded-full" />
              )}
            </NavLink>
          </nav>

          {/* Zone 3: Highlighted Electric Blue CTA + Mobile Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={ctaNav.url || '/contact'}
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#1E66E5] text-white text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0 shadow-[0_0_24px_rgba(40,120,255,0.3)]"
            >
              <span>{ctaNav.label === 'CONTACT' ? "Let's Talk" : ctaNav.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#24466C] bg-[#0B1F3A] text-[#F5F8FF]"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#24466C] bg-[#0B1F3A] px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.id}
                to={item.url}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-semibold tracking-wide ${
                  item.is_cta
                    ? 'bg-[#2878FF] text-white text-center mt-3'
                    : location.pathname === item.url
                      ? 'bg-[#0D2747] text-[#00B8FF]'
                      : 'text-[#A9BBD3] hover:text-[#F5F8FF] hover:bg-[#0D2747]/60'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Shared Footer */}
      <footer className="border-t border-[#24466C] bg-[#040E1E]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
            {/* Brand Intro */}
            <div className="lg:col-span-4 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#2878FF] text-white font-display font-bold text-base">
                  SS
                </span>
                <span className="font-display font-bold text-lg text-[#F5F8FF]">
                  {settings?.site_name || 'SHYAM SHAHI'}
                </span>
              </Link>
              <p className="text-sm text-[#A9BBD3] leading-relaxed max-w-sm">
                {settings?.footer_intro ||
                  'Combining creative storytelling, strategic marketing, AI-powered production, and intelligent automation to help brands grow.'}
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                {(settings?.social_links || []).map((soc, idx) => (
                  <a
                    key={`${soc.platform}-${idx}`}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={soc.platform}
                    className="w-10 h-10 rounded-lg border border-[#24466C] bg-[#0B1F3A] flex items-center justify-center text-[#A9BBD3] hover:text-[#00B8FF] hover:border-[#2878FF] transition-colors"
                  >
                    <SocialIcon platform={soc.platform} className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-semibold tracking-wider text-[#F5F8FF] uppercase">
                Navigation
              </h3>
              <ul className="space-y-2.5 text-sm text-[#A9BBD3]">
                {navigation.map((item) => (
                  <li key={item.id}>
                    <Link to={item.url} className="hover:text-[#00B8FF] transition-colors">
                      {item.label.charAt(0) + item.label.slice(1).toLowerCase()}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Links */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-semibold tracking-wider text-[#F5F8FF] uppercase">
                Services
              </h3>
              <ul className="space-y-2.5 text-sm text-[#A9BBD3]">
                {(data?.services || []).slice(0, 4).map((srv) => (
                  <li key={srv.id}>
                    <Link to="/services" className="hover:text-[#00B8FF] transition-colors">
                      {srv.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-semibold tracking-wider text-[#F5F8FF] uppercase">
                Get In Touch
              </h3>
              <a
                href={`mailto:${settings?.contact_email || 'hello@shyamshahi.studio'}`}
                className="inline-flex items-center gap-2 text-sm text-[#A9BBD3] hover:text-[#00B8FF] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#2878FF] shrink-0" />
                <span>{settings?.contact_email || 'hello@shyamshahi.studio'}</span>
              </a>
              {settings?.location && (
                <p className="text-sm text-[#A9BBD3]">{settings.location}</p>
              )}
              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D2747] border border-[#24466C] hover:border-[#2878FF] text-xs font-semibold text-[#F5F8FF] transition-colors"
                >
                  Start a Project <ArrowUpRight className="w-3.5 h-3.5 text-[#00B8FF]" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-[#24466C]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A9BBD3]">
            <p>{settings?.copyright_text || '© 2026 Shyam Shahi. All rights reserved.'}</p>
            <div className="flex items-center gap-5">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-[#A9BBD3]/70 hover:text-[#00B8FF] transition-colors"
              >
                <Lock className="w-3 h-3" aria-hidden="true" />
                <span>Admin CMS</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
