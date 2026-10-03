import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getMainOffice } from '../../api/offices.js';
import RHULogo from '../../content/servicesImage/RHU.jpg';
import YouthLogo from '../../content/servicesImage/Youth.jpg';
import RedCrossLogo from '../../content/servicesImage/RedCross.png';
import '../../styles/serviceDetail.css';

/**
 * The eight services listed in the sidebar. Kept here (rather than in the
 * navbar layout) so the sidebar, the current-page highlight and the MEIF
 * "service availed" select all read from one identical, ordered list.
 */
export const SERVICE_ITEMS = [
  { to: '/services/pre-marriage-orientation', label: 'Pre-Marriage Orientation (PMOC)' },
  { to: '/services/usapan-series', label: 'Usapan Sessions' },
  { to: '/services/rpfp', label: 'Responsible Parenthood (RPFP)' },
  { to: '/services/ahdp', label: 'Adolescent Health (AHDP)' },
  { to: '/services/iec', label: 'Population Awareness (IEC)' },
  { to: '/services/population-profiling', label: 'Demographic Profiling' },
  { to: '/services/community-events', label: 'Community Events' },
  { to: '/services/other-assistance', label: 'Other Assistance' },
];

/**
 * The agencies the Population Office works with. Defined once here so every
 * service detail page shows the same Partner Agencies card in the sidebar.
 */
export const PARTNER_AGENCIES = [
  {
    logo: RedCrossLogo,
    logoAlt: 'Philippine Red Cross',
    name: 'Philippine Red Cross',
    description:
      'Partner in emergency response, first aid, blood donation mobilization, and community health information during caravans and outreach events.',
  },
  {
    logo: YouthLogo,
    logoAlt: 'Local youth organizations',
    name: 'Local Youth Organizations',
    description:
      'Engage youth leaders and volunteers in U4U/AHYD activities, peer education, and information sessions that are youth-friendly and inclusive.',
  },
  {
    logo: RHULogo,
    logoAlt: 'RHU of San Fabian',
    name: 'RHU of San Fabian',
    description:
      'Provides clinical services, counseling, and referrals during caravans; coordinates schedules and facility-based follow-up for clients reached in the community.',
  },
];

const YOUTUBE_NOCOOKIE = 'https://www.youtube-nocookie.com/embed/';

/**
 * Turn any YouTube URL into a privacy-enhanced embed with no query string,
 * so videos never autoplay and nothing is sent to youtube.com directly.
 */
export function toPrivacyEmbed(url = '') {
  const value = String(url || '').trim();
  if (!value) return '';
  const match = value.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{6,})/
  );
  if (match) return `${YOUTUBE_NOCOOKIE}${match[1]}`;
  try {
    const parsed = new URL(value);
    parsed.searchParams.delete('autoplay');
    return parsed.toString();
  } catch (_) {
    return value;
  }
}

/**
 * Responsive 16/9 video wrapper. Renders nothing when there is no source,
 * so pages without a video never show an empty box.
 */
export function VideoEmbed({ src, title }) {
  if (!src) return null;
  return (
    <div className="sf-video">
      <iframe
        src={toPrivacyEmbed(src)}
        title={title || 'Embedded video'}
        loading="lazy"
        allow="fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

/**
 * Partner-agency cards. Rendered in the sidebar underneath the office
 * location, so the narrow column always stacks them one per row.
 * Renders nothing when there is no data, so pages without partners show no
 * empty gap.
 */
export function PartnerAgencyGrid({ items = PARTNER_AGENCIES, headingId = 'sf-partners-heading' }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="sf-scard">
      <h2 className="sf-scard__title" id={headingId}>
        Partner Agencies
      </h2>
      <ul className="sf-partners sf-partners--sidebar">
        {items.map((partner) => (
          <li className="sf-partner" key={partner.name}>
            <div className="sf-partner__logo">
              <img src={partner.logo} alt={partner.logoAlt || ''} loading="lazy" />
            </div>
            <h3>{partner.name}</h3>
            <p>{partner.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Stable ids shared by the tab buttons and their panels, so the layout can
 * render the tablist while the page renders the panel markup.
 */
export const tabButtonId = (tabsId, tabId) => `${tabsId}-tab-${tabId}`;
export const tabPanelId = (tabsId, tabId) => `${tabsId}-panel-${tabId}`;

/**
 * Underlined, accessible tab set. Full ARIA wiring (tablist / tab,
 * aria-selected, aria-controls, aria-labelledby on the panel), roving
 * tabindex and Left/Right/Home/End keyboard support.
 *
 * Only the tab strip is rendered here - the page owns the panel content and
 * wraps it in `role="tabpanel"` using `tabPanelId` / `tabButtonId`, so the
 * panel always shows up directly after the tabs.
 * Renders nothing when there are no tabs.
 */
function TabsBlock({ tabs }) {
  const { id, items, activeId, onChange } = tabs;
  const tabRefs = useRef([]);
  const safeItems = Array.isArray(items) ? items : [];
  const active = safeItems.some((item) => item.id === activeId)
    ? activeId
    : safeItems[0]?.id;

  const handleKeyDown = (event) => {
    const index = safeItems.findIndex((item) => item.id === active);
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % safeItems.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + safeItems.length) % safeItems.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = safeItems.length - 1;
    if (nextIndex === null || nextIndex === index) return;
    event.preventDefault();
    onChange(safeItems[nextIndex].id);
    const node = tabRefs.current[nextIndex];
    if (node) node.focus();
  };

  if (safeItems.length === 0) return null;

  return (
    <div className="sf-tabs__scroll">
      <div className="sf-tabs">
        <div
          className="sf-tabs__list"
          role="tablist"
          aria-label="Service sections"
          onKeyDown={handleKeyDown}
        >
          {safeItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={tabButtonId(id, item.id)}
              className="sf-tab"
              aria-selected={item.id === active}
              aria-controls={tabPanelId(id, item.id)}
              tabIndex={item.id === active ? 0 : -1}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Shared shell for every /services/* detail page.
 *
 * Two columns on desktop (main ~2/3, sticky sidebar ~1/3, 32px gutter) and a
 * single column below 1024px, where the sidebar moves under the main content.
 * The optional blocks (video, tabs) only render when the page supplies them,
 * so a page without a video or tabs never shows an empty region.
 * The Partner Agencies card is always shown, below the office location.
 *
 * This component is presentational only - the Client Satisfaction (CSM) form
 * modal lives in ServiceBootstrapLayout and is opened through `onOpenFeedback`.
 */
export function ServiceDetailLayout({
  title,
  imageUrl,
  imageAlt,
  intro,
  video,
  tabs,
  showBack = true,
  onOpenFeedback,
  children,
}) {
  const navigate = useNavigate();
  const [office, setOffice] = useState(null);

  // Best effort: the office address only shows when the API returns one.
  useEffect(() => {
    let cancelled = false;
    getMainOffice()
      .then((res) => {
        if (!cancelled) setOffice(res.data?.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/services');
  };

  return (
    <section className="sf-page sf-detail">
      <div className="sf-detail__container">
        <div className="sf-detail__grid">
          <div className="sf-detail__main">
            {showBack ? (
              <button type="button" className="sf-detail__back" onClick={goBack}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M11.354 1.146a.5.5 0 0 1 0 .708L5.207 8l6.147 6.146a.5.5 0 0 1-.708.708l-6.5-6.5a.5.5 0 0 1 0-.708l6.5-6.5a.5.5 0 0 1 .708 0z" />
                </svg>
                <span>Back to Services</span>
              </button>
            ) : null}

            {title ? (
              <header className="sf-detail__head">
                <h1 className="sf-detail__title">{title}</h1>
                <hr className="sf-detail__rule" />
              </header>
            ) : null}

            {imageUrl ? (
              <figure className="sf-detail__hero">
                <img src={imageUrl} alt={imageAlt || title || ''} loading="lazy" />
              </figure>
            ) : null}

            {intro ? <div className="sf-detail__intro">{intro}</div> : null}

            {video ? (
              <section className="sf-detail__video" aria-labelledby="sf-video-heading">
                <h2 id="sf-video-heading">Watch the video</h2>
                <VideoEmbed src={video.src} title={video.title} />
              </section>
            ) : null}

            {tabs ? <TabsBlock tabs={tabs} /> : null}

            {children ? <div className="sf-detail__content">{children}</div> : null}
          </div>

          <aside className="sf-detail__aside" aria-label="Services and location">
            <div className="sf-scard">
              <h2 className="sf-scard__title">Population Office Location</h2>
              <iframe
                className="sf-detail__map"
                title="Map showing the San Fabian Population Office location"
                src="https://www.google.com/maps?q=16.120723263859666,120.40280245009167&z=15&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {office && office.address ? (
                <p className="sf-detail__address">{office.address}</p>
              ) : null}
              <div className="sf-detail__actions">
                <Link className="btn-primary" to="/services/meif-template">
                  View MEIF Form
                </Link>
                <button type="button" className="btn-secondary" onClick={onOpenFeedback}>
                  View Client Feedback Form
                </button>
              </div>
            </div>

            <PartnerAgencyGrid />
          </aside>
        </div>
      </div>
    </section>
  );
}

