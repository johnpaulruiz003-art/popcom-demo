import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import dayjs from 'dayjs';
import { IconNews, IconCalendarEvent, IconMessageDots, IconHeartHandshake, IconUsers, IconHeart, IconClipboardList, IconListDetails, IconUserCheck, IconMail, IconChartBar, IconMenu2 } from '@tabler/icons-react';
import { Drawer, ScrollArea } from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { ProfileModal } from '../components/profile/ProfileModal.jsx';
import { getFamilyPlanningBookings } from '../api/familyPlanning.js';
import { getPmoAdminAppointments, getPmoSmsFailedCount } from '../api/pmoAdmin.js';
import { getCalendarEvents } from '../api/calendar.js';
import { socket } from '../socket.js';
import './adminScrollbar.css';
import '../styles/admin.css';

function AdminDashboardLayout() {
  const { user, isAdmin } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [fpPending, setFpPending] = useState(0);
  const [apptPending, setApptPending] = useState(0);
  const [reqPending, setReqPending] = useState(0);
  const [smsFailed, setSmsFailed] = useState(0);
  const pendingRefreshTimeoutRef = useRef(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const analyticsPath = '/admin/analytics';

  const sections = [
    {
      key: 'general',
      label: 'General',
      base: '/admin/general',
      items: [
        { to: '/admin/general/news', label: 'News', icon: IconNews },
        { to: '/admin/general/announcements', label: 'Events / Activity', icon: IconCalendarEvent },
        { to: '/admin/general/feedback', label: 'Feedback', icon: IconMessageDots },
        { to: '/admin/general/family-planning', label: 'Family Planning', icon: IconHeartHandshake },
        { to: '/admin/general/education-web', label: 'Education Web', icon: IconHeart },
        { to: '/admin/general/education-booklets', label: 'Education Booklets', icon: IconClipboardList },
        { to: '/admin/general/accounts', label: 'Accounts', icon: IconUsers },
        { to: '/admin/general/file-tasks', label: 'Document Reports', icon: IconClipboardList },
        { to: '/admin/pmo/sms-logs', label: 'SMS Logs', icon: IconMail },
        { to: '/admin/pmo/db-tools', label: 'DB Tools', icon: IconListDetails }
      ]
    },
    ...(isAdmin
      ? [
          {
            key: 'pmo',
            label: 'Pre-Marriage Orientation',
            base: '/admin/pmo',
            items: [
              { to: '/admin/pmo/schedules', label: 'Schedules', icon: IconCalendarEvent },
              { to: '/admin/pmo/appointments', label: 'Appointments', icon: IconClipboardList },
              { to: '/admin/pmo/questionnaire', label: 'Questionnaire', icon: IconListDetails },
              { to: '/admin/pmo/answers', label: 'Answers', icon: IconListDetails },
              { to: '/admin/pmo/counselors', label: 'Counselors', icon: IconUserCheck }
            ]
          }
        ]
      : []),
    {
      key: 'usapan',
      label: 'Usapan-Series',
      base: '/admin/usapan',
      items: [
        { to: '/admin/usapan/schedules', label: 'Schedules', icon: IconCalendarEvent },
        { to: '/admin/usapan/requests', label: 'Requests', icon: IconHeart }
      ]
    }
  ];

  // Pending count loaders (extracted so socket handlers can reuse them)
  const loadFpPending = async () => {
    try {
      const res = await getFamilyPlanningBookings({ page: 1, limit: 200 });
      const data = res.data?.data || [];
      const pendingCount = data.filter((b) => String(b.status || '').trim().toUpperCase() === 'PENDING').length;
      setFpPending(pendingCount);
    } catch {
      // ignore if unauthorized or fails; page-level logic will still update later
    }
  };

  const loadApptPending = async () => {
    try {
      const res = await getPmoAdminAppointments();
      const data = res.data?.data || [];
      const pendingCount = data.filter((r) => String(r.status || '').toUpperCase() === 'PENDING').length;
      setApptPending(pendingCount);
    } catch {
      // ignore
    }
  };

  const loadReqPending = async () => {
    try {
      const start = dayjs().startOf('year').toISOString();
      const end = dayjs().endOf('year').toISOString();
      const res = await getCalendarEvents({ start, end });
      const all = res.data?.data || [];
      const pendingUsapan = all.filter((e) => {
        if (!e || e.type !== 'Usapan-Series') return false;
        const s = String(e.status || '').toUpperCase();
        return s === 'PENDING';
      });
      setReqPending(pendingUsapan.length);
    } catch {
      // ignore
    }
  };

  const loadSmsFailed = async () => {
    try {
      const res = await getPmoSmsFailedCount();
      const count = res.data?.data?.count ?? 0;
      setSmsFailed(count);
    } catch {
      // ignore
    }
  };

  // Initial pending counts on dashboard load
  useEffect(() => {
    loadFpPending().catch(() => {});
    loadApptPending().catch(() => {});
    loadReqPending().catch(() => {});
    loadSmsFailed().catch(() => {});
  }, []);

  // Live-refresh pending counters via WebSocket
  useEffect(() => {
    const schedulePendingRefresh = () => {
      if (pendingRefreshTimeoutRef.current) return;
      pendingRefreshTimeoutRef.current = setTimeout(() => {
        pendingRefreshTimeoutRef.current = null;
        // Re-load all counters together
        loadFpPending().catch(() => {});
        loadApptPending().catch(() => {});
        loadReqPending().catch(() => {});
        loadSmsFailed().catch(() => {});
      }, 500);
    };

    const onFp = () => schedulePendingRefresh();
    const onPmo = () => schedulePendingRefresh();
    const onUsapan = () => schedulePendingRefresh();
    socket.on('fp:updated', onFp);
    socket.on('pmo:updated', onPmo);
    socket.on('usapan:updated', onUsapan);
    return () => {
      socket.off('fp:updated', onFp);
      socket.off('pmo:updated', onPmo);
      socket.off('usapan:updated', onUsapan);
      if (pendingRefreshTimeoutRef.current) {
        clearTimeout(pendingRefreshTimeoutRef.current);
        pendingRefreshTimeoutRef.current = null;
      }
    };
  }, []);

  // Fallback auto-refresh every 30 seconds in case WebSocket events are missed
  useEffect(() => {
    const interval = setInterval(() => {
      loadFpPending().catch(() => {});
      loadApptPending().catch(() => {});
      loadReqPending().catch(() => {});
      loadSmsFailed().catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);
  const initials = (user?.fullName || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // The four sidebar badges are all action-needed counts, so they use the navy
  // treatment whenever nonzero and a neutral gray at zero.
  const renderCountBadge = (count) => (
    <span
      className={`adm-badge-count${count > 0 ? '' : ' adm-badge-count--zero'}`}
      aria-label={count > 0 ? `${count.toLocaleString('en-PH')} needing action` : 'None needing action'}
    >
      {count.toLocaleString('en-PH')}
    </span>
  );

  const pendingCountFor = (to) => {
    if (to === '/admin/general/family-planning') return fpPending;
    if (to === '/admin/pmo/appointments') return apptPending;
    if (to === '/admin/usapan/requests') return reqPending;
    if (to === '/admin/pmo/sms-logs') return smsFailed;
    return null;
  };

  // Rendered once and reused by both the desktop sidebar and the mobile
  // Drawer so the two copies can never drift apart.
  const sidebarContent = (
    <div className="adm-side__inner">
      <div className="adm-side__head">
        <h2 className="adm-side__title">Admin Dashboard</h2>
        <button
          type="button"
          className="adm-profile"
          onClick={() => {
            setProfileModalOpen(true);
            setMobileSidebarOpen(false);
          }}
        >
          <span className="adm-profile__avatar" aria-hidden="true">{initials}</span>
          <span className="adm-profile__text">
            <span className="adm-profile__name">{user?.fullName || 'Admin'}</span>
            <span className="adm-profile__role">Admin profile</span>
          </span>
        </button>
      </div>

      {/* Data Analytics - a nav row like the rest, not a highlighted pill. */}
      <div className="adm-side__block">
        <NavLink to={analyticsPath} className="adm-navlink">
          <IconChartBar className="adm-navlink__icon" size={18} stroke={1.8} aria-hidden="true" />
          <span className="adm-navlink__label">Data Analytics</span>
        </NavLink>
      </div>

      <nav aria-label="Admin sections">
        {sections.map((section) => (
          <div key={section.key} className="adm-side__group">
            <h3 className="adm-side__section">{section.label}</h3>
            <ul className="adm-side__list">
              {section.items.map((item) => {
                const pendingCount = pendingCountFor(item.to);
                return (
                  <li key={item.to}>
                    <NavLink to={item.to} className="adm-navlink">
                      {item.icon ? (
                        <item.icon className="adm-navlink__icon" size={18} stroke={1.8} aria-hidden="true" />
                      ) : null}
                      <span className="adm-navlink__label">{item.label}</span>
                      {pendingCount !== null ? renderCountBadge(pendingCount) : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="adm-shell admin-root">
      <aside className="adm-side d-none d-lg-block">{sidebarContent}</aside>

      <Drawer
        opened={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        position="left"
        size={300}
        padding="md"
        title="Admin menu"
        hiddenFrom="lg"
        zIndex={300}
      >
        <ScrollArea.Autosize mah="calc(100dvh - 96px)" type="never">
          {sidebarContent}
        </ScrollArea.Autosize>
      </Drawer>

      <div className="adm-content">
        <div className="d-lg-none mb-3">
          <button
            type="button"
            className="adm-drawer-trigger"
            onClick={() => setMobileSidebarOpen(true)}
            aria-expanded={mobileSidebarOpen}
          >
            <IconMenu2 size={18} stroke={1.8} aria-hidden="true" />
            Admin menu
          </button>
        </div>

        <Outlet context={{ setFpPending, setApptPending, setReqPending, setSmsFailed }} />
      </div>

      <ProfileModal opened={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
}

export { AdminDashboardLayout };
export default AdminDashboardLayout;
