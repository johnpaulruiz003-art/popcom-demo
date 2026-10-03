import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  AppShell, Group, Anchor, Button, Text, Avatar, 
  Burger, Drawer, Stack, Divider, ScrollArea, Menu, Accordion, Modal
} from '@mantine/core';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';

import { useAuth } from '../context/AuthContext.jsx';
import { LoginModal } from '../components/auth/LoginModal.jsx';
import { RegisterModal } from '../components/auth/RegisterModal.jsx';
import { ProfileModal } from '../components/profile/ProfileModal.jsx';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal.jsx';
import { reopenDataPrivacyNotice } from '../components/common/DataPrivacyModal.jsx';

import popcomLogo from '../content/POPCOM-Logo.jpg';
import popcomBanner from '../content/POPCOM-Banner.jpg';
// Top-strip marks: CPD wordmark (left) + Bagong Pilipinas (right).
import cpdWordmark from '../content/CPD-Wordmark.png';
import bagongPilipinasLogo from '../content/BagongPilipinas.png';
import Page1Image from '../content/User Manual Images/Page1Image.png';
import Page2Image from '../content/User Manual Images/Page2Image.png';
import Page3Image from '../content/User Manual Images/Page3Image.png';
import Page4Image from '../content/User Manual Images/Page4Image.png';
import Page5Image from '../content/User Manual Images/Page5Image.png';
import Page6Image from '../content/User Manual Images/Page6Image.png';

// Landing-page design system. Imported here (not only in HomePageBootstrap)
// so the shared navbar and footer are styled on every route.
import '../styles/home.css';

export function AppShellLayout({ children }) {
  const auth = useAuth() || {};
  const { user, isAdmin, isOfficer, logout, loading } = auth;

  const location = useLocation();
  const navigate = useNavigate();

  const [loginModalOpened, setLoginModalOpened] = useState(false);
  const [registerModalOpened, setRegisterModalOpened] = useState(false);
  const [profileModalOpened, setProfileModalOpened] = useState(false);
  const [sessionExpiredModalOpened, setSessionExpiredModalOpened] = useState(false);
  const [helpModalOpened, setHelpModalOpened] = useState(false);
  const [helpSlide, setHelpSlide] = useState(0);

  const [mobileNavOpened, setMobileNavOpened] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const hasShownLandingLoginRef = useRef(false);

  // Mobile view kicks in at 1200px and below - must stay in sync with the
  // `.sf-navbar__links` / `.sf-burger` breakpoint in styles/home.css.
  const isCompactNav = useMediaQuery('(max-width: 1200px)');

  const headerHeight = 64;
  const footerHeight = 52;

  // Synced with your ServicesPage OFFICIAL_SERVICES slugs
  const serviceItems = [
    { to: '/services', label: 'View All Services' },
    { to: '/services/pre-marriage-orientation', label: 'Pre-Marriage Orientation (PMOC)' },
    { to: '/services/usapan-series', label: 'Usapan Sessions' },
    { to: '/services/rpfp', label: 'Responsible Parenthood (RPFP)' },
    { to: '/services/ahdp', label: 'Adolescent Health (AHDP)' },
    { to: '/services/iec', label: 'Population Awareness (IEC)' },
    { to: '/services/population-profiling', label: 'Demographic Profiling' },
    { to: '/services/community-events', label: 'Community Events' },
    { to: '/services/other-assistance', label: 'Other Assistance' },
  ];

  const links = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services', hasDropdown: true },
    { to: '/calendar', label: 'Schedule of Activities' },
    { to: '/education', label: 'Education Corner' },
    { to: '/faqs', label: 'FAQ' },
    { to: '/contact', label: 'About Us' }
  ];

  const utilityLinks = useMemo(() => {
    const items = [];
    if (isAdmin) items.push({ to: '/admin', label: 'Admin Dashboard' });
    return items;
  }, [isAdmin]);

  const isCalendarPage = location.pathname === '/calendar';
  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isServicesPage = location.pathname.startsWith('/services');

  // Footer "Privacy settings": clears the stored acknowledgment and reopens
  // the Data Privacy notice modal.
  const openDataPrivacySettings = () => {
    setMobileNavOpened(false);
    reopenDataPrivacyNotice();
  };

  const activeNavStyle = { fontWeight: 600, color: '#0d6efd' };

  const manualPages = [
    {
      title: 'Overview',
      content: (
        <>
          <img
            src={Page1Image}
            alt="POPCOM system overview"
            className="img-fluid mb-3"
            style={{ maxHeight: 220, width: '100%', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
          />

          <Text size="sm" mb="sm">
            This system helps the San Fabian Population Office manage services such as news, education materials,
            PMO bookings, Usapan sessions, and analytics.
          </Text>
          <Text size="sm" fw={600} mb={4}>Who can use this system?</Text>
          <ul className="small mb-2">
            <li>Citizens can view public information and submit service requests.</li>
            <li>Barangay Officers can access additional tools relevant to their area.</li>
            <li>Admins can manage all content, schedules, and analytics.</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Public website navigation',
      content: (
        <>
          <img
            src={Page2Image}
            alt="Public website navigation"
            className="img-fluid mb-3"
            style={{ maxHeight: 220, width: '100%', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
          />

          <Text size="sm" fw={600} mb={4}>Top navigation bar</Text>
          <ul className="small mb-2">
            <li><b>Home</b> &ndash; overview, announcements, and shortcuts to services.</li>
            <li><b>Services</b> &ndash; list of all population services with details and online forms.</li>
            <li><b>Schedule of Activities</b> &ndash; calendar of upcoming activities.</li>
            <li><b>Education Corner</b> &ndash; articles and educational resources.</li>
            <li><b>FAQ</b> &ndash; common questions and answers.</li>
            <li><b>About Us</b> &ndash; office profile and contact information.</li>
          </ul>
          <Text size="sm" fw={600} mb={4}>Logging in</Text>
          <ul className="small mb-2">
            <li>Use the <b>Login</b> button in the header to sign in.</li>
            <li>Once logged in, you can access your profile and, if authorized, the Admin Dashboard.</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Admin role guide',
      content: (
        <>
          <img
            src={Page3Image}
            alt="Admin role guide"
            className="img-fluid mb-3"
            style={{ maxHeight: 220, width: '100%', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
          />

          <Text size="sm" fw={600} mb={4}>What Admins can do</Text>
          <ul className="small mb-2">
            <li>Access the full <b>Admin Dashboard</b> after logging in as Admin.</li>
            <li>Manage news, announcements, feedback, file tasks, and family planning bookings.</li>
            <li>Configure and monitor <b>PMO</b> schedules, appointments, MEIF forms, questionnaire, counselors, and SMS logs.</li>
            <li>Oversee <b>Usapan</b> schedules and requests.</li>
            <li>View and export summary statistics in the <b>Analytics</b> section.</li>
          </ul>
          <Text size="sm" fw={600} mb={4}>Key responsibilities</Text>
          <ul className="small mb-2">
            <li>Ensure schedules and services are up-to-date.</li>
            <li>Review and approve or reject bookings in a timely manner.</li>
            <li>Monitor SMS and email notifications and address failed sends.</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Barangay Officer guide',
      content: (
        <>
          <img
            src={Page4Image}
            alt="Barangay Officer guide"
            className="img-fluid mb-3"
            style={{ maxHeight: 220, width: '100%', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
          />

          <Text size="sm" fw={600} mb={4}>What Barangay Officers can do</Text>
          <ul className="small mb-2">
            <li>Log in using the account assigned to your barangay.</li>
            <li>Open your <b>Profile</b> from the header to see <b>Usapan-Series Requests</b> assigned to your barangay.</li>
            <li>Upload required files/documents in your profile when the Admin gives you a specific task.</li>
            <li>Help residents with PMO bookings and Usapan requests if they do not have internet access.</li>
            <li>Coordinate schedules and confirm attendance for sessions held in your barangay.</li>
          </ul>
          <Text size="sm" fw={600} mb={4}>Good practices</Text>
          <ul className="small mb-2">
            <li>Regularly check pending requests from your barangay.</li>
            <li>Verify residents&rsquo; contact numbers before submitting bookings or requests.</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Users / Citizens guide',
      content: (
        <>
          <img
            src={Page5Image}
            alt="Users and Citizens guide"
            className="img-fluid mb-3"
            style={{ maxHeight: 220, width: '100%', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
          />

          <Text size="sm" fw={600} mb={4}>For Users and Citizens</Text>
          <ul className="small mb-2">
            <li>Use the public pages (Home, Services, Calendar, Education Corner, FAQ, About Us) to learn about programs.</li>
            <li>From <b>Services</b>, open the specific booking services (e.g., Pre-Marriage Orientation or Family Planning Counseling) to submit online forms.</li>
            <li>Wait for SMS or call confirmation from the Population Office for booking status and schedules.</li>
          </ul>
          <Text size="sm" fw={600} mb={4}>Keeping your information accurate</Text>
          <ul className="small mb-2">
            <li>Provide a correct mobile number and check messages regularly.</li>
            <li>Inform the office if you need to reschedule or cancel a booking.</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Getting more help',
      content: (
        <>
          <img
            src={Page6Image}
            alt="Help and support"
            className="img-fluid mb-3"
            style={{ maxHeight: 220, width: '100%', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
          />

          <Text size="sm" mb="sm">
            If you encounter issues (errors, missing data, or questions about how to record a case), please reach out
            to the Population Office.
          </Text>
          <ul className="small mb-2">
            <li>Use the contact information in the footer or the <b>About Us</b> page.</li>
            <li>When reporting a problem, include the date, page URL, and a short description of what happened.</li>
            <li>You can also send message to us via the <b>Feedback form</b> located in the sidebar of the About Us page.</li>
          </ul>
        </>
      ),
    },
  ];

  useEffect(() => {
    setMobileNavOpened(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => {
      if (user) {
        // Close any open popups and clear their local input state by unmounting them
        setLoginModalOpened(false);
        setRegisterModalOpened(false);
        setProfileModalOpened(false);

        // Then show the global Session Expired dialog
        setSessionExpiredModalOpened(true);
      }
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, [user]);

  // Listen for brochure viewer open/close events so we can hide the help button
  useEffect(() => {
    const handler = (e) => {
      const opened = !!(e && e.detail && e.detail.opened);
      setBrochureViewerOpen(opened);
    };
    window.addEventListener('brochure-viewer-toggle', handler);
    return () => window.removeEventListener('brochure-viewer-toggle', handler);
  }, []);

  const [brochureViewerOpen, setBrochureViewerOpen] = useState(false);

  // Services dropdown is now plain React state instead of Bootstrap's JS plugin.
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef(null);

  useEffect(() => {
    if (!servicesOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setServicesOpen(false);
    };
    const onClick = (e) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [servicesOpen]);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isServicesActive = location.pathname.startsWith('/services');

  // Previously auto-opened the login modal on the home page for guests;
  // this behavior has been removed so the login modal opens only on explicit user action.

  return (
    <>
      <a className="sf-skip-link" href="#main-content">
        Skip to main content
      </a>

      <AppShell padding="0">
        <AppShell.Header px="0" style={{ position: 'static' }}>
          {/* Top strip: CPD wordmark (left) and Bagong Pilipinas (right) on white.
              Hidden on /admin so the admin shell starts at the navy navbar and the
              sticky sidebar has a predictable offset. */}
          {!isAdminPage && (
          <div className="sf-topbar">
            <div className="sf-topbar__inner">
              <img
                className="sf-topbar__wordmark"
                src={cpdWordmark}
                alt="Republic of the Philippines, Commission on Population and Development"
              />
              <img
                className="sf-topbar__bp"
                src={bagongPilipinasLogo}
                alt="Bagong Pilipinas"
              />
            </div>
          </div>
          )}

          <nav className="sf-navbar" aria-label="Main navigation">
            <div className="sf-navbar__inner">
              <Link className="sf-navbar__brand" to="/">
                <img className="sf-navbar__brand-logo" src={popcomLogo} alt="" width="36" height="36" />
                <span className="sf-navbar__brand-text">
                  San Fabian Population Office
                  <span className="sf-navbar__brand-sub">Municipal Office of Population</span>
                </span>
              </Link>

              <button
                type="button"
                className="sf-burger"
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpened}
                aria-controls="sf-mobile-nav"
                onClick={() => setMobileNavOpened((o) => !o)}
              >
                <span className="sf-burger__bars" />
              </button>

            {/* Desktop navigation */}
            <ul className="sf-navbar__links">
              <li>
                <Link
                  to="/"
                  className={`sf-navbar__link${location.pathname === '/' ? ' is-active' : ''}`}
                  aria-current={location.pathname === '/' ? 'page' : undefined}
                >
                  Home
                </Link>
              </li>

              <li className="sf-dropdown" ref={servicesRef}>
                <button
                  type="button"
                  className={`sf-navbar__link${isServicesActive ? ' is-active' : ''}`}
                  aria-expanded={servicesOpen}
                  aria-haspopup="true"
                  onClick={() => setServicesOpen((o) => !o)}
                  onMouseEnter={() => setServicesOpen(true)}
                  onFocus={() => setServicesOpen(true)}
                >
                  Services
                  <span className="sf-dropdown__caret" aria-hidden="true">&#9662;</span>
                </button>
                <ul
                  className="sf-dropdown__menu"
                  hidden={!servicesOpen}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <li>
                    <Link className="sf-dropdown__link" to="/services" onClick={() => setServicesOpen(false)}>
                      View All Services
                    </Link>
                  </li>
                  <li><hr className="sf-dropdown__sep" /></li>
                  {serviceItems.slice(1).map((s) => (
                    <li key={s.to}>
                      <Link className="sf-dropdown__link" to={s.to} onClick={() => setServicesOpen(false)}>
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {links
                .filter((l) => l.to !== '/' && !l.hasDropdown)
                .map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className={`sf-navbar__link${isActive(l.to) ? ' is-active' : ''}`}
                      aria-current={isActive(l.to) ? 'page' : undefined}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}

              {isAdmin && (
                <li>
                  <Link to="/admin" className="sf-navbar__link" style={{ marginLeft: '0.5rem' }}>
                    Admin Dashboard
                  </Link>
                </li>
              )}
            </ul>

            <div className="sf-navbar__actions">
              {user && !isAdmin && (
                <button
                  type="button"
                  className="btn-secondary sf-btn--sm"
                  onClick={() => setProfileModalOpened(true)}
                >
                  {isOfficer ? 'Officer Profile' : 'Profile'}
                </button>
              )}
              {!user && (
                <button
                  type="button"
                  className="btn-primary sf-btn--sm"
                  onClick={() => setLoginModalOpened(true)}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Full-width mobile panel */}
        <div className="sf-mobilenav" id="sf-mobile-nav" hidden={!mobileNavOpened}>
          <div className="sf-mobilenav__inner">
            <ul className="sf-mobilenav__list">
              <li>
                <Link
                  to="/"
                  className={`sf-mobilenav__link${location.pathname === '/' ? ' is-active' : ''}`}
                  onClick={() => setMobileNavOpened(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="sf-mobilenav__link"
                  aria-expanded={mobileServicesOpen}
                  onClick={() => setMobileServicesOpen((o) => !o)}
                >
                  Services
                </button>
                {mobileServicesOpen && (
                  <ul className="sf-mobilenav__sublist">
                    {serviceItems.map((s) => (
                      <li key={s.to}>
                        <Link
                          to={s.to}
                          className="sf-mobilenav__link"
                          onClick={() => {
                            setMobileNavOpened(false);
                            setMobileServicesOpen(false);
                          }}
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              {links
                .filter((l) => l.to !== '/' && !l.hasDropdown)
                .map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className={`sf-mobilenav__link${isActive(l.to) ? ' is-active' : ''}`}
                      onClick={() => setMobileNavOpened(false)}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              {isAdmin && (
                <li>
                  <Link
                    to="/admin"
                    className="sf-mobilenav__link"
                    onClick={() => setMobileNavOpened(false)}
                  >
                    Admin Dashboard
                  </Link>
                </li>
              )}
            </ul>

            <div className="sf-mobilenav__actions">
              {user && !isAdmin && (
                <button
                  type="button"
                  className="btn-secondary sf-btn--block"
                  onClick={() => {
                    setMobileNavOpened(false);
                    setProfileModalOpened(true);
                  }}
                >
                  {isOfficer ? 'Officer Profile' : 'Profile'}
                </button>
              )}
              {!user && (
                <button
                  type="button"
                  className="btn-primary sf-btn--block"
                  onClick={() => {
                    setMobileNavOpened(false);
                    setLoginModalOpened(true);
                  }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </AppShell.Header>

      {/* FLEX WRAPPER: This ensures the footer stays at the bottom */}
      <div
        className="sf-shell-wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          '--sf-shell-main-min-height': `calc(100dvh - ${headerHeight + footerHeight}px)`,
          '--sf-shell-main-min-height-fallback': `calc(100vh - ${headerHeight + footerHeight}px)`,
        }}
      >
        <AppShell.Main className="sf-shell-main">
          <div
            className="sf-shell-content"
            style={{ minHeight: '100%', paddingBottom: isHomePage ? 0 : 16 }}
          >
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          </div>
        </AppShell.Main>

        <footer className="sf-footer mt-auto">
          <div className="sf-footer__inner">
            <div>
              <img className="sf-footer__logo" src={popcomLogo} alt="Commission on Population and Development logo" width="44" height="44" />
              <h2 className="sf-footer__title">Municipal Office of Population</h2>
              <p className="sf-footer__text">San Fabian Population Office</p>
              <p className="sf-footer__text">91 Municipal Hall, Kadiwa Building, San Fabian, Pangasinan</p>
              <p className="sf-footer__text">Contact Number: 0915-811-2320</p>
              <p className="sf-footer__text">Email: sanfabian.munpopcom@gmail.com</p>
              <div className="sf-footer__banner">
                <img
                  className="sf-footer__banner-img"
                  src={popcomBanner}
                  alt="Commission on Population and Development banner"
                />
              </div>
            </div>

            <div className="sf-footer__col--aux">
              <h2 className="sf-footer__title">Quick Links</h2>
              <ul className="sf-footer__list">
                <li><Link className="sf-footer__link" to="/services">Services</Link></li>
                <li><Link className="sf-footer__link" to="/calendar">Schedule of Activities</Link></li>
                <li><Link className="sf-footer__link" to="/education">Education Corner</Link></li>
                <li><Link className="sf-footer__link" to="/faqs">FAQ</Link></li>
                <li><Link className="sf-footer__link" to="/contact">About Us</Link></li>
                <li>
                  <button type="button" className="sf-footer__link" onClick={() => setLoginModalOpened(true)}>
                    Login
                  </button>
                </li>
                <li>
                  <Link className="sf-footer__link" to="/data-privacy">Data Privacy</Link>
                </li>
                <li>
                  <button type="button" className="sf-footer__link" onClick={openDataPrivacySettings}>
                    Privacy settings
                  </button>
                </li>
              </ul>
            </div>

            <div className="sf-footer__col--aux">
              <h2 className="sf-footer__title">Connect With Us</h2>
              <p className="sf-footer__text">
                <a className="sf-footer__link" href="https://www.facebook.com/profile.php?id=100087014496500" rel="noopener noreferrer" target="_blank">
                  Facebook
                </a>
              </p>
            </div>
          </div>

          <div className="sf-footer__bottom">
            <span>&copy; {new Date().getFullYear()} San Fabian Municipal Office of Population. All rights reserved.</span>
            <span>Republic of the Philippines &middot; Commission on Population and Development</span>
          </div>
        </footer>
      </div>

      {/* Floating help button (hidden while brochure viewer or profile modal is open) */}
      {!brochureViewerOpen && !profileModalOpened && (
        <button
          type="button"
          onClick={() => { setHelpSlide(0); setHelpModalOpened(true); }}
          className="sf-fab sf-fab--help"
          aria-label="Open system manual"
        >
          ?
        </button>
      )}

      {/* Floating "Go to Top" button (always visible) */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="sf-fab sf-fab--top"
        aria-label="Back to top"
      >
        &#8593;
      </button>

      {/* MODALS */}
      <LoginModal
        opened={loginModalOpened}
        onClose={() => setLoginModalOpened(false)}
        onOpenRegister={() => setRegisterModalOpened(true)}
      />
      <RegisterModal
        opened={registerModalOpened}
        onClose={() => setRegisterModalOpened(false)}
        onOpenLogin={() => setLoginModalOpened(true)}
      />
      <ProfileModal
        opened={profileModalOpened}
        onClose={() => setProfileModalOpened(false)}
      />
      <Modal
        opened={helpModalOpened}
        onClose={() => setHelpModalOpened(false)}
        title={manualPages[helpSlide]?.title || 'System Manual'}
        size={isCompactNav ? '100%' : 'lg'}
        fullScreen={isCompactNav}
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <div className="mb-2 small text-muted">
          Page {helpSlide + 1} of {manualPages.length}
        </div>
        <div
          className="mb-3"
          style={{ textAlign: 'justify' }}
        >
          {manualPages[helpSlide]?.content}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <Button
            size="xs"
            variant="subtle"
            disabled={helpSlide === 0}
            onClick={() => setHelpSlide((s) => Math.max(0, s - 1))}
          >
            Previous
          </Button>
          <div className="d-flex align-items-center gap-1">
            {manualPages.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: idx === helpSlide ? '#0d6efd' : '#ced4da',
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
          <Button
            size="xs"
            disabled={helpSlide === manualPages.length - 1}
            onClick={() => setHelpSlide((s) => Math.min(manualPages.length - 1, s + 1))}
          >
            Next
          </Button>
        </div>
      </Modal>

      <DeleteConfirmModal
        opened={sessionExpiredModalOpened}
        onCancel={() => {
          setSessionExpiredModalOpened(false);
          navigate('/', { replace: true });
        }}
        onConfirm={() => {
          setSessionExpiredModalOpened(false);
          logout();
          setLoginModalOpened(true);
        }}
        title="Session expired"
        message="Your session has expired. Please log in again to continue."
        confirmLabel="Log in"
        cancelLabel="Go to Home"
        closeOnEscape={false}
        closeOnClickOutside={false}
      />
    </AppShell>
    </>
  );
}
