import React, { useEffect, useState } from 'react';
import { Modal, Text, TextInput, Textarea, FileInput, Button as MantineButton, Stack, Progress, Pagination } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getNewsList, createNews } from '../api/news.js';
import { uploadImage } from '../api/uploads.js';
import { searchSite } from '../api/search.js';
import { getCalendarEvents } from '../api/calendar.js';

import MissionVision from '../components/home/MissionVision.jsx';
import HeroCarousel from '../components/home/HeroCarousel.jsx';
import heroSlides from '../content/heroSlides.js';
import '../styles/home.css';


// Human labels for the calendar's three schedule types
const ACTIVITY_TYPE_LABELS = {
  'Event/Activity': 'Event/Activity',
  'Pre-Marriage Orientation': 'Pre-Marriage Orientation',
  'Usapan-Series': 'Usapan Series',
};

// Short key per calendar type, used for the per-type top border colour
const ACTIVITY_TYPE_KEYS = {
  'Event/Activity': 'event',
  'Pre-Marriage Orientation': 'pmo',
  'Usapan-Series': 'usapan',
};

// Start time for an activity, e.g. "11:00 PM"
const activityTime = (a) => {
  if (!a || !a._date) return '';
  return a._date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
};

// Description for the third column; may be empty
const activityDescription = (a) => {
  if (!a) return '';
  return String(a.description || '').replace(/\s+/g, ' ').trim();
};

// Activities per page. Desktop shows three rows of three cards; phones show a
// shorter page so the section stays a reasonable scroll length on one column.
const ACTIVITIES_PER_PAGE_WIDE = 9;
const ACTIVITIES_PER_PAGE_NARROW = 3;
const ACTIVITIES_WIDE_QUERY = '(min-width: 768px)';

// Numbered pagination shared by the News and Activities sections. `targetId`
// is the section heading, scrolled into view after a page change so the reader
// lands on the top of the results they just asked for.
function SectionPagination({ page, totalPages, onChange, label, targetId }) {
  if (totalPages <= 1) return null;

  // Build a windowed page list: always keep the first and last page plus the
  // neighbours of the current one, and collapse the gaps into an ellipsis.
  const windowed = [];
  for (let i = 1; i <= totalPages; i += 1) {
    const near = Math.abs(i - page) <= 1;
    if (i === 1 || i === totalPages || near) {
      windowed.push(i);
    } else if (windowed[windowed.length - 1] !== 'gap') {
      windowed.push('gap');
    }
  }

  const goTo = (next) => {
    const target = Math.min(totalPages, Math.max(1, next));
    if (target === page) return;
    onChange(target);
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="sf-pagination" aria-label={label}>
      <button
        type="button"
        className="btn-secondary sf-btn--sm"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>

      {windowed.map((entry, i) =>
        entry === 'gap' ? (
          <span className="sf-pagination__gap" key={`gap-${i}`} aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            type="button"
            className="sf-pagination__page"
            key={entry}
            onClick={() => goTo(entry)}
            aria-current={entry === page ? 'page' : undefined}
            aria-label={`Page ${entry}`}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        className="btn-secondary sf-btn--sm"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>

      <span className="sf-pagination__status" aria-live="polite">
        Page {page} of {totalPages}
      </span>
    </nav>
  );
}

export function HomePage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newsModalOpened, setNewsModalOpened] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [siteSearch, setSiteSearch] = useState('');
  const [siteSearchOpen, setSiteSearchOpen] = useState(false);
  const [siteSearchLoading, setSiteSearchLoading] = useState(false);
  const [siteSearchRemote, setSiteSearchRemote] = useState([]);
  const [activities, setActivities] = useState([]);
  // Activities are paginated client-side from the single calendar fetch, so the
  // per-page size follows the viewport: 9 on desktop, 3 on phones.
  const [activitiesWide, setActivitiesWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(ACTIVITIES_WIDE_QUERY).matches,
  );
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = activitiesWide ? ACTIVITIES_PER_PAGE_WIDE : ACTIVITIES_PER_PAGE_NARROW;
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const { user, isAdmin, isOfficer } = auth;


  const newsForm = useForm({
    initialValues: { title: '', description: '', imageFile: null },
    validate: {
      title: (v) => (String(v).trim().length > 0 ? null : 'Title is required'),
      description: (v) => (String(v).trim().length > 0 ? null : 'Description is required'),
    },
  });

  // Maintain a preview of the selected image (scaled down)
  useEffect(() => {
    const file = newsForm.values.imageFile;
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [newsForm.values.imageFile]);


  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const limit = 5;
    getNewsList({ page, limit })
      .then((res) => {
        if (!active) return;
        const rows = res.data.data || [];
        setNews(rows);
        const meta = res.data.meta || {};
        const total = Number(meta.total ?? 0);
        const lim = Number(meta.limit ?? limit);
        let pages = 1;
        if (total > 0 && lim > 0) {
          pages = Math.max(1, Math.ceil(total / lim));
        } else if (rows.length >= lim) {
          // Fallback: if backend omits meta or ignores limit but returns at least a full page, assume more pages exist
          pages = Math.max(2, page + 1);
        }
        setTotalPages(pages);
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setError('Failed to load latest news');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const getCurrentUserId = () => {
    if (!user) return null;
    return user.id ?? user.userId ?? null;
  };

  const mappedNews = (news || []).map((n) => ({
    id: n.id,
    title: n.title,
    imageUrl: n.imageUrl,
    // Prefer content; fall back to any legacy description/shortDescription/snippet
    description: n.content || n.description || n.shortDescription || n.snippet || '',
    href: `/news/${n.id}`,
    ownerId:
      n.createdById ??
      n.createdByUserId ??
      n.userId ??
      n.authorId ??
      n.createdBy ??
      null,
  }));

  const staticSearchItems = [
    { title: 'Services', description: 'Explore all municipal population services', href: '/services', type: 'Page' },
    { title: 'Calendar', description: 'View schedules, activities, and events', href: '/calendar', type: 'Page' },
    { title: 'Education', description: 'Read learning materials and educational content', href: '/education', type: 'Page' },
    { title: 'FAQs', description: 'Frequently asked questions', href: '/faqs', type: 'Page' },
    { title: 'Contact', description: 'Contact the Municipal Population Office', href: '/contact', type: 'Page' },
    {
      title: 'Pre-Marriage Orientation & Counseling (PMOC)',
      description: 'Pre-marriage orientation schedules and booking',
      href: '/services/pre-marriage-orientation',
      type: 'Service'
    },
    {
      title: 'Usapan Sessions (Usapan Series)',
      description: 'Barangay sessions on responsible parenthood and teen health',
      href: '/services/usapan-series',
      type: 'Service'
    },
    {
      title: 'Responsible Parenthood & Family Development (RPFP)',
      description: 'Family planning, BIBA, Parent-Teen Talk, U4U Teen Trail',
      href: '/services/rpfp',
      type: 'Service'
    },
    {
      title: 'Adolescent Health and Development Program (AHDP)',
      description: 'Youth-centered programs for teen pregnancy prevention',
      href: '/services/ahdp',
      type: 'Service'
    },
    {
      title: 'Population Awareness & IEC Activities',
      description: 'Information, education and communication activities',
      href: '/services/iec',
      type: 'Service'
    },
    {
      title: 'Demographic Data Collection & Population Profiling',
      description: 'Population data collection and profiling support',
      href: '/services/population-profiling',
      type: 'Service'
    },
    {
      title: 'Support During Community Events',
      description: 'LGU caravans and mobile population education support',
      href: '/services/community-events',
      type: 'Service'
    },
    {
      title: 'Other Assistance Service',
      description: 'Referral-based assistance depending on municipal arrangements',
      href: '/services/other-assistance',
      type: 'Service'
    },
  ];

  const localSiteSearchResults = React.useMemo(() => {
    const q = String(siteSearch || '').trim().toLowerCase();
    if (!q) return [];

    const items = [];
    staticSearchItems.forEach((it) => {
      const hay = `${it.title} ${it.description || ''}`.toLowerCase();
      if (hay.includes(q)) items.push({ ...it });
    });

    return items.slice(0, 12);
  }, [siteSearch]);

  const siteSearchResults = React.useMemo(() => {
    const q = String(siteSearch || '').trim();
    if (!q) return [];

    const merged = [];
    localSiteSearchResults.forEach((x) => merged.push(x));
    (siteSearchRemote || []).forEach((x) => merged.push(x));
    return merged.slice(0, 12);
  }, [siteSearch, localSiteSearchResults, siteSearchRemote]);

  useEffect(() => {
    let active = true;
    const q = String(siteSearch || '').trim();
    if (!q) {
      setSiteSearchRemote([]);
      setSiteSearchLoading(false);
      return () => {
        active = false;
      };
    }

    setSiteSearchLoading(true);
    const t = setTimeout(() => {
      searchSite({ q, page: 1, limit: 8 })
        .then((res) => {
          if (!active) return;
          const rows = res?.data?.data || [];
          const mapped = rows.map((r) => ({
            title: r.title,
            description: r.snippet || (r.type === 'Announcement' ? 'Announcement' : ''),
            href: r.href,
            type: r.type
          }));
          setSiteSearchRemote(mapped);
        })
        .catch(() => {
          if (!active) return;
          setSiteSearchRemote([]);
        })
        .finally(() => {
          if (!active) return;
          setSiteSearchLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [siteSearch]);

  // Note: using server-side pagination (limit=5) with totalPages from API

  const handleNewsSubmit = async (values) => {
    try {
      let imageUrl = null;
      if (values.imageFile instanceof File) {
        setUploadProgress(1);
        const up = await uploadImage(values.imageFile, {
          onProgress: (pct) => setUploadProgress(pct),
        });
        imageUrl = up?.data?.data?.publicUrl || null;
      }

      const payload = {
        title: values.title,
        content: values.description,
        imageUrl,
        isPublished: true,
      };
      await createNews(payload);
      showNotification({ title: 'News Created', message: 'SUCCESSFULLY!', color: 'green' });
      setNewsModalOpened(false);
      newsForm.reset();
      setUploadProgress(0);
      // Refresh homepage news immediately
      const limit = 5;
      const res = await getNewsList({ page: 1, limit });
      const rows = res?.data?.data || [];
      setNews(rows);
      const meta = res?.data?.meta || {};
      const total = Number(meta.total ?? 0);
      const lim = Number(meta.limit ?? limit);
      let pages = 1;
      if (total > 0 && lim > 0) {
        pages = Math.max(1, Math.ceil(total / lim));
      } else if (rows.length >= lim) {
        pages = Math.max(2, 2);
      }
      setTotalPages(pages);
      setPage(1);
    } catch (err) {
      console.error(err);
      setUploadProgress(0);
      const msg = err?.response?.data?.error?.message || 'Failed to create news';
      showNotification({ title: 'Error', message: msg, color: 'red' });
    }
  };

  // ---- Upcoming activities: merges Event/Activity, Pre-Marriage Orientation
  // and Usapan-Series schedules into one date-ordered list.
  // The API returns `startDate` (ISO), NOT `date_str`/`start_time`; using the
  // wrong field silently filtered out every row and left the section empty.
  useEffect(() => {
    let active = true;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() + 120);
    getCalendarEvents({ start: start.toISOString(), end: end.toISOString() })
      .then((res) => {
        if (!active) return;
        const rows = res?.data?.data || [];
        const blocked = ['cancelled', 'archived', 'finished', 'completed'];
        const upcoming = rows
          .map((e) => {
            const d = e.startDate ? new Date(e.startDate) : null;
            return d && !Number.isNaN(d.getTime()) ? { ...e, _date: d } : null;
          })
          .filter(Boolean)
          .filter((e) => e._date >= start)
          .filter((e) => !blocked.includes(String(e.status || '').toLowerCase()))
          .sort((a, b) => a._date - b._date);
        setActivities(upcoming);
      })
      .catch(() => {
        if (active) setActivities([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Track the desktop/phone breakpoint so the activities page size follows it.
  useEffect(() => {
    const mq = window.matchMedia(ACTIVITIES_WIDE_QUERY);
    const onChange = (e) => setActivitiesWide(e.matches);
    setActivitiesWide(mq.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  // Page slice for the current viewport. Resetting to page 1 when the page size
  // changes keeps the reader from landing on a page that no longer exists.
  React.useEffect(() => {
    setActivityPage(1);
  }, [activitiesPerPage]);

  const activityTotalPages = Math.max(1, Math.ceil(activities.length / activitiesPerPage));
  const safeActivityPage = Math.min(activityPage, activityTotalPages);
  const pagedActivities = activities.slice(
    (safeActivityPage - 1) * activitiesPerPage,
    safeActivityPage * activitiesPerPage,
  );
  const combinedFeed = React.useMemo(() => {
    return (news || [])
      .map((n) => ({
        id: `news-${n.id}`,
        title: n.title,
        excerpt: (n.content || n.shortDescription || '').toString().trim(),
        imageUrl: n.imageUrl,
        date: n.publishedAt || n.createdAt,
        href: `/news/${n.id}`,
      }))
      .sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const dbb = b.date ? new Date(b.date).getTime() : 0;
        return dbb - da;
      });
  }, [news]);

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Plain-text preview for the News & Announcements list. The stored body may
  // contain HTML tags or hard line breaks, so both are flattened into a single
  // readable paragraph. Nothing is cut here: the visible clamp is done in CSS
  // (.sf-newsitem__excerpt, two lines on wide screens / three on phones), which
  // is what keeps every row to the same number of lines. EXCERPT_MAX is only a
  // safety net so a huge article body never lands in the DOM.
  const EXCERPT_MAX = 400;
  const excerptOf = (text) => {
    const plain = String(text || '')
      .replace(/<\/?[a-z][^>]*>/gi, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain.length > EXCERPT_MAX ? plain.slice(0, EXCERPT_MAX).trim() : plain;
  };

  const services = [
    {
      to: '/services/pre-marriage-orientation',
      title: 'Pre-Marriage Orientation (PMOC)',
      text: 'Pre-marriage counselling and orientation sessions for couples preparing to marry.',
    },
    {
      to: '/services/usapan-series',
      title: 'Usapan Series',
      text: 'Barangay sessions on responsible parenthood, health and family well-being.',
    },
    {
      to: '/services/rpfp',
      title: 'Responsible Parenthood (RPFP)',
      text: 'Family planning, birth spacing and parent-teen health education.',
    },
    {
      to: '/services/ahdp',
      title: 'Adolescent Health (AHDP)',
      text: 'Youth-centred programs addressing adolescent health and teen pregnancy.',
    },
    {
      to: '/services/iec',
      title: 'Population Awareness (IEC)',
      text: 'Information, education and communication activities for the community.',
    },
    {
      to: '/services/population-profiling',
      title: 'Demographic Profiling',
      text: 'Population data collection and profiling to guide local planning.',
    },
    {
      to: '/services/community-events',
      title: 'Community Events',
      text: 'LGU caravans and mobile population services during community activities.',
    },
    {
      to: '/services/other-assistance',
      title: 'Other Assistance',
      text: 'Referral-based assistance in line with municipal arrangements.',
    },
  ];

  return (
    <div className="sf-page">
      {/* ---------------- HERO ---------------- */}
      <section className="sf-hero" aria-labelledby="sf-hero-title">
        <div className="sf-hero__inner">
          <div>
            <p className="sf-hero__eyebrow">San Fabian, Pangasinan</p>
            <h1 className="sf-hero__title" id="sf-hero-title">
              Municipal Office of Population
            </h1>
            <p className="sf-hero__text">
              Serving the people of San Fabian with accurate population data, responsible parenthood
              programs, and community development initiatives.
            </p>
            <div className="sf-hero__actions">
              <button type="button" className="btn-primary" onClick={() => navigate('/services')}>
                Explore Services
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/contact')}>
                Contact Us
              </button>
            </div>
          </div>

          <HeroCarousel slides={heroSlides} />
        </div>
      </section>

      {/* ---------------- QUICK INFO BAR ---------------- */}
      <section className="sf-quickinfo" aria-label="Office information">
        <div className="sf-quickinfo__inner">
          <div className="sf-quickinfo__item">
            <svg className="sf-quickinfo__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <div>
              <span className="sf-quickinfo__label">Office Hours</span>
              {/* TODO: replace with the official office hours - not stored in the codebase. */}
              <p className="sf-quickinfo__value">
                <span className="sf-quickinfo__todo">TODO: add official office hours</span>
              </p>
            </div>
          </div>

          <div className="sf-quickinfo__item">
            <svg className="sf-quickinfo__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <div>
              <span className="sf-quickinfo__label">Office Location</span>
              <p className="sf-quickinfo__value">
                91 Municipal Hall, Kadiwa Building, San Fabian, Pangasinan
              </p>
            </div>
          </div>

          <div className="sf-quickinfo__item">
            <svg className="sf-quickinfo__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
            </svg>
            <div>
              <span className="sf-quickinfo__label">Contact</span>
              <p className="sf-quickinfo__value">
                <a href="tel:+639158112320">0915-811-2320</a>
                <br />
                <a href="mailto:sanfabian.munpopcom@gmail.com">sanfabian.munpopcom@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SERVICES ---------------- */}
      <section className="sf-section" aria-labelledby="sf-services-title">
        <div className="sf-section__inner">
          <div className="sf-section__head">
            <div>
              <h2 className="sf-section__title" id="sf-services-title">
                Our Services
              </h2>
              <hr className="sf-section__rule" />
              <p className="sf-section__sub">
                Programs and services offered by the Municipal Office of Population for residents of
                San Fabian.
              </p>
            </div>
            <button type="button" className="btn-secondary sf-btn--sm" onClick={() => navigate('/services')}>
              View all services
            </button>
          </div>

          <div className="sf-cards">
            {services.map((s) => (
              <article className="sf-card" key={s.to}>
                <h3 className="sf-card__title">{s.title}</h3>
                <p className="sf-card__text">{s.text}</p>
                <button type="button" className="sf-card__link" onClick={() => navigate(s.to)}>
                  Learn more
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- NEWS & ANNOUNCEMENTS ---------------- */}
      <section className="sf-section sf-section--tint" aria-labelledby="sf-news-title">
        <div className="sf-section__inner">
          <div className="sf-section__head">
            <div>
              <h2 className="sf-section__title" id="sf-news-title">
                News &amp; Announcements
              </h2>
              <hr className="sf-section__rule" />
              <p className="sf-section__sub">
                Recent news and updates from the Municipal Office of Population.
              </p>
            </div>
          </div>

          {error && (
            <p className="sf-alert sf-alert--error" role="alert">
              We could not load the latest updates just now. Please refresh the page or try again later.
            </p>
          )}

          {loading ? (
            <p className="sf-empty" role="status">
              Loading the latest updates&hellip;
            </p>
          ) : combinedFeed.length === 0 ? (
            <p className="sf-empty">No news to display right now.</p>
          ) : (
            <ul className="sf-newslist">
              {combinedFeed.slice(0, 6).map((item) => (
                <li className="sf-newsitem" key={item.id}>
                  {item.imageUrl ? (
                    <img
                      className="sf-newsitem__thumb"
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : null}
                  <div className="sf-newsitem__body">
                    <p className="sf-newsitem__meta">
                      {item.date && <span>{formatDate(item.date)}</span>}
                    </p>
                    <h3 className="sf-newsitem__title">
                      <a className="sf-newsitem__link" href={item.href}>
                        {item.title}
                      </a>
                    </h3>
                    {item.excerpt && <p className="sf-newsitem__excerpt">{excerptOf(item.excerpt)}</p>}
                    <a className="sf-btn--link" href={item.href}>
                      Read more
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <SectionPagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            label="News pagination"
            targetId="sf-news-title"
          />
        </div>
      </section>

      {/* ---------------- UPCOMING ACTIVITIES ---------------- */}
      <section className="sf-section" aria-labelledby="sf-activities-title">
        <div className="sf-section__inner">
          <div className="sf-section__head">
            <div>
              <h2 className="sf-section__title" id="sf-activities-title">
                Upcoming Activities
              </h2>
              <hr className="sf-section__rule" />
              <p className="sf-section__sub">
                Events, Pre-Marriage Orientation and Usapan Series schedules from the Office of Population.
              </p>
            </div>
            <button type="button" className="btn-secondary sf-btn--sm" onClick={() => navigate('/calendar')}>
              Full schedule
            </button>
          </div>

          {activities.length === 0 ? (
            <p className="sf-empty">
              No upcoming activities are listed at the moment.{' '}
              <button type="button" className="sf-btn--link" onClick={() => navigate('/calendar')}>
                View the full schedule of activities
              </button>
              .
            </p>
          ) : (
            <ul className="sf-activities">
              {pagedActivities.map((a) => {
                const d = a._date;
                const typeLabel = ACTIVITY_TYPE_LABELS[a.type] || a.type || 'Activity';
                return (
                  <li
                    className={`sf-activity sf-activity--${ACTIVITY_TYPE_KEYS[a.type] || 'event'}`}
                    key={`${a.type}-${a.id}`}
                  >
                    <div className="sf-activity__head">
                      <div className="sf-activity__date">
                        <span className="sf-activity__month">
                          {d.toLocaleDateString('en-PH', { month: 'short' })}
                        </span>
                        <span className="sf-activity__day">{d.getDate()}</span>
                      </div>
                      <p className="sf-activity__type">{typeLabel}</p>
                    </div>
                    <h3 className="sf-activity__title">
                      <button type="button" className="sf-btn--link" onClick={() => navigate('/calendar')}>
                        {a.title || typeLabel}
                      </button>
                    </h3>
                    {activityTime(a) && (
                      <p className="sf-activity__time">
                        <svg
                          className="sf-activity__clock"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        {activityTime(a)}
                      </p>
                    )}
                    {activityDescription(a) && (
                      <p className="sf-activity__desc">{activityDescription(a)}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <SectionPagination
            page={safeActivityPage}
            totalPages={activityTotalPages}
            onChange={setActivityPage}
            label="Activities pagination"
            targetId="sf-activities-title"
          />
        </div>
      </section>

      <MissionVision />

      {/* Admin: open the "Add News" modal */}
      {user && (isAdmin || isOfficer) && (
        <div className="sf-section__inner" style={{ paddingBottom: '2rem' }}>
          <button type="button" className="btn-primary" onClick={() => setNewsModalOpened(true)}>
            Add News
          </button>
        </div>
      )}

      {/* Add News and Announcement Modal (styled similar to Calendar Add Schedule modal) */}
      <Modal
        opened={newsModalOpened}
        onClose={() => {
          setNewsModalOpened(false);
          setUploadProgress(0);
        }}
        withCloseButton={false}
        centered
        size="xl"
        padding={0}
        styles={{
          content: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
          body: {
            padding: 0,
          },
        }}
      >
        <div className="card border-0 shadow-lg" style={{ borderRadius: '0.75rem' }}>
          <form
            onSubmit={newsForm.onSubmit((values) => {
              handleNewsSubmit(values).catch(() => {});
            })}
          >
            <div className="row g-0 align-items-stretch">
              {/* Left: preview panel */}
              <div
                className="col-md-4 d-none d-md-block bg-light"
                style={{ borderRight: '1px solid #e5e7eb' }}
              >
                <div className="h-100 w-100 p-4 d-flex flex-column justify-content-center" align="left">
                  <div className="mb-2 small text-muted">News & Announcement preview</div>
                  <Stack gap="xs">
                    <Text fw={600}>
                      {newsForm.values.title || 'Untitled news'}
                    </Text>
                    <Text size="sm" c="dimmed" lineClamp={4}>
                      {newsForm.values.description || 'News description will appear here once provided.'}
                    </Text>
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Selected preview"
                        className="img-fluid rounded border mt-2"
                        style={{ maxHeight: 160, objectFit: 'contain' }}
                      />
                    )}
                  </Stack>
                </div>
              </div>

              {/* Right: form fields */}
              <div className="col-12 col-md-8 p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="text-uppercase small text-muted mb-1">News & Announcement</div>
                    <h2 className="h5 mb-0">Add News</h2>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => {
                      setNewsModalOpened(false);
                      setUploadProgress(0);
                    }}
                  />
                </div>

                <Stack gap="sm">
                  <FileInput
                    label="News Image (optional)"
                    accept="image/*"
                    {...newsForm.getInputProps('imageFile')}
                  />
                  {previewUrl && (
                    <div className="mt-2 d-flex flex-column align-items-start gap-2">
                      <img
                        src={previewUrl}
                        alt="Selected preview"
                        className="img-fluid rounded border"
                        style={{ maxHeight: 220, objectFit: 'contain' }}
                      />
                      <MantineButton
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => {
                          newsForm.setFieldValue('imageFile', null);
                          setPreviewUrl(null);
                          setUploadProgress(0);
                        }}
                      >
                        Remove image
                      </MantineButton>
                    </div>
                  )}
                  <TextInput label="News Title" required {...newsForm.getInputProps('title')} />
                  <Textarea
                    label="News Description"
                    required
                    autosize
                    minRows={4}
                    maxRows={12}
                    {...newsForm.getInputProps('description')}
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && <Progress value={uploadProgress} />}
                </Stack>

                <div className="d-flex justify-content-end gap-2 pt-3 mt-3 border-top">
                  <MantineButton
                    type="button"
                    variant="default"
                    onClick={() => {
                      setNewsModalOpened(false);
                      setUploadProgress(0);
                    }}
                  >
                    Cancel
                  </MantineButton>
                  <MantineButton type="submit">Submit</MantineButton>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
