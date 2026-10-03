import { describe, it, expect } from 'vitest';

import { mockAdapter, findMockRoute } from './mockApiAdapter.js';
import { isMocksEnabled } from './mockData.js';
import { apiClient } from '../api/client.js';

// Helper: invoke the mock adapter with a minimal Axios config.
const call = (config) => mockAdapter({ headers: {}, ...config });

// Every endpoint declared by src/api/*.js, as [method, concrete path].
// If one of these stops matching a route, the adapter silently falls back to an
// empty payload and the corresponding page renders blank - exactly the failure
// this list exists to prevent.
const API_ENDPOINTS = [
  // auth
  ['post', '/auth/login'],
  ['get', '/auth/me'],
  ['post', '/auth/register'],
  ['post', '/auth/forgot/start'],
  ['post', '/auth/forgot/verify'],
  ['post', '/auth/forgot/reset'],
  // news
  ['get', '/news/latest'],
  ['get', '/news'],
  ['get', '/news/admin'],
  ['get', '/news/mock-news-1'],
  ['post', '/news'],
  ['put', '/news/mock-news-1'],
  ['put', '/news/mock-news-1/archive'],
  ['put', '/news/mock-news-1/unarchive'],
  ['delete', '/news/mock-news-1'],
  // announcements
  ['get', '/announcements'],
  ['post', '/announcements'],
  ['put', '/announcements/mock-ann-1'],
  ['patch', '/announcements/mock-ann-1/archive'],
  ['patch', '/announcements/mock-ann-1/unarchive'],
  ['delete', '/announcements/mock-ann-1'],
  // services
  ['get', '/services'],
  ['post', '/services'],
  ['put', '/services/1'],
  ['delete', '/services/1'],
  // faqs
  ['get', '/faqs'],
  ['get', '/faqs/topics'],
  ['post', '/faqs'],
  ['put', '/faqs/1'],
  ['delete', '/faqs/1'],
  // counselors
  ['get', '/counselors/active'],
  ['get', '/counselors'],
  ['post', '/counselors'],
  ['put', '/counselors/1'],
  ['delete', '/counselors/1'],
  // appointments
  ['post', '/appointments/pre-marriage'],
  ['post', '/appointments/usapan-series'],
  ['get', '/appointments/usapan-series/me'],
  ['get', '/appointments/pre-marriage/me'],
  ['get', '/appointments'],
  ['patch', '/appointments/mock-appointment-1/status'],
  // feedback
  ['post', '/feedback'],
  ['post', '/feedback/client-satisfaction'],
  ['get', '/feedback'],
  ['get', '/feedback/client-satisfaction'],
  ['get', '/feedback/client-satisfaction/mock-cs-1'],
  ['delete', '/feedback/client-satisfaction/mock-cs-1'],
  ['get', '/feedback/analytics'],
  ['get', '/feedback/mock-feedback-1'],
  ['patch', '/feedback/mock-feedback-1'],
  ['delete', '/feedback/mock-feedback-1'],
  // calendar / events
  ['get', '/calendar/events'],
  ['post', '/calendar/events'],
  ['put', '/calendar/events/mock-event-1'],
  ['patch', '/calendar/events/mock-event-1/cancel'],
  ['patch', '/calendar/events/mock-event-1/archive'],
  ['patch', '/calendar/events/mock-event-1/unarchive'],
  ['delete', '/calendar/events/mock-event-1'],
  ['get', '/calendar/usapan/admin/schedules/archived'],
  // education
  ['get', '/education-materials'],
  ['get', '/education-materials/some-slug'],
  ['post', '/education-materials'],
  ['put', '/education-materials/1'],
  ['delete', '/education-materials/1'],
  // education corner - web content
  ['get', '/education-corner/web'],
  ['post', '/education-corner/web'],
  ['put', '/education-corner/web/mock-web-1'],
  ['put', '/education-corner/web/mock-web-1/archive'],
  ['put', '/education-corner/web/mock-web-1/unarchive'],
  ['get', '/education-corner/web/mock-web-1/key-concepts'],
  ['put', '/education-corner/web/mock-web-1/key-concepts'],
  // education corner - booklets
  ['get', '/education-corner/booklets'],
  ['post', '/education-corner/booklets'],
  ['put', '/education-corner/booklets/mock-booklet-1'],
  ['put', '/education-corner/booklets/mock-booklet-1/archive'],
  ['get', '/education-corner/booklets/mock-booklet-1/pages'],
  ['post', '/education-corner/booklets/mock-booklet-1/pages'],
  ['put', '/education-corner/booklet-pages/mock-page-1'],
  ['delete', '/education-corner/booklet-pages/mock-page-1'],
  // family planning
  ['post', '/family-planning/bookings'],
  ['get', '/family-planning/bookings/me'],
  ['get', '/family-planning/admin/bookings'],
  ['get', '/family-planning/admin/analytics'],
  ['delete', '/family-planning/admin/bookings/mock-fp-1'],
  ['post', '/family-planning/admin/bookings/mock-fp-1/approve'],
  ['post', '/family-planning/admin/bookings/mock-fp-1/reject'],
  ['post', '/family-planning/admin/bookings/mock-fp-1/cancel'],
  ['post', '/family-planning/admin/bookings/mock-fp-1/archive'],
  ['post', '/family-planning/admin/bookings/mock-fp-1/unarchive'],
  // file tasks
  ['get', '/file-tasks/admin'],
  ['post', '/file-tasks/admin'],
  ['put', '/file-tasks/admin/mock-filetask-1'],
  ['delete', '/file-tasks/admin/mock-filetask-1'],
  ['patch', '/file-tasks/admin/mock-filetask-1/archive'],
  ['patch', '/file-tasks/admin/mock-filetask-1/unarchive'],
  ['get', '/file-tasks/me'],
  ['post', '/file-tasks/me/mock-filetask-1/submit'],
  ['put', '/file-tasks/me/mock-filetask-1/submit'],
  ['delete', '/file-tasks/me/mock-filetask-1/submit'],
  // hierarchy & office
  ['get', '/hierarchy'],
  ['post', '/hierarchy'],
  ['put', '/hierarchy/1'],
  ['delete', '/hierarchy/1'],
  ['get', '/offices/main'],
  ['put', '/offices/main'],
  // pmo (public)
  ['post', '/pmo/bookings'],
  ['get', '/pmo/schedules'],
  ['get', '/pmo/questionnaire'],
  ['get', '/pmo/appointments/me'],
  // pmo (admin)
  ['get', '/pmo/admin/schedules'],
  ['put', '/pmo/admin/schedules/1'],
  ['delete', '/pmo/admin/schedules/1'],
  ['patch', '/pmo/admin/schedules/1/archive'],
  ['patch', '/pmo/admin/schedules/1/unarchive'],
  ['get', '/pmo/admin/bookings'],
  ['get', '/pmo/admin/answers'],
  ['get', '/pmo/admin/analytics'],
  ['get', '/pmo/admin/questionnaire'],
  ['post', '/pmo/admin/questionnaire'],
  ['put', '/pmo/admin/questionnaire/1'],
  ['delete', '/pmo/admin/questionnaire/1'],
  ['get', '/pmo/admin/appointments'],
  ['post', '/pmo/admin/appointments/1/accept'],
  ['post', '/pmo/admin/appointments/1/reject'],
  ['post', '/pmo/admin/appointments/1/cancel'],
  ['patch', '/pmo/admin/appointments/1/archive'],
  ['patch', '/pmo/admin/appointments/1/unarchive'],
  ['get', '/pmo/admin/sms-logs'],
  ['get', '/pmo/admin/sms-logs/failed-count'],
  ['post', '/pmo/admin/sms-logs/mock-sms-1/resend'],
  ['get', '/pmo/admin/appointments/1/meif'],
  ['get', '/pmo/admin/db/export'],
  ['post', '/pmo/admin/db/import'],
  ['post', '/pmo/admin/db/import-sql'],
  // search, uploads, users
  ['get', '/search'],
  ['post', '/uploads/image'],
  ['get', '/users'],
  ['get', '/users/analytics'],
  ['post', '/users'],
  ['put', '/users/2'],
  ['patch', '/users/2/active'],
  ['put', '/users/me'],
  ['delete', '/users/me']
];

describe('mockApiAdapter', () => {
  it('is installed on the shared apiClient when mocks are enabled', () => {
    if (isMocksEnabled()) {
      expect(apiClient.defaults.adapter).toBe(mockAdapter);
    }
  });

  it('has a route for every endpoint used in src/api', () => {
    const missing = API_ENDPOINTS.filter(([method, path]) => !findMockRoute(path, method)).map(
      ([method, path]) => `${method.toUpperCase()} ${path}`
    );
    expect(missing).toEqual([]);
  });

  it('serves the published news list used by the home page section', async () => {
    const res = await call({ method: 'get', url: '/news', params: { page: 1, limit: 5 } });

    // The page is capped by `limit`, while meta.total counts every published item.
    expect(res.data.data.length).toBe(5);
    expect(res.data.meta.total).toBeGreaterThan(5);
    expect(res.data.meta.page).toBe(1);
    expect(res.data.meta.limit).toBe(5);

    // Newest first, and every row carries what the News & Announcements list renders.
    const dates = res.data.data.map((n) => new Date(n.createdAt).getTime());
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
    res.data.data.forEach((n) => {
      expect(typeof n.id).toBe('string');
      expect(typeof n.title).toBe('string');
      expect(typeof n.content).toBe('string');
    });
  });

  it('keeps archived news out of the public list but visible to admins', async () => {
    const publicRes = await call({ method: 'get', url: '/news', params: { page: 1, limit: 100 } });
    const adminRes = await call({ method: 'get', url: '/news/admin', params: { page: 1, limit: 100 } });

    const publicIds = publicRes.data.data.map((n) => n.id);
    const adminIds = adminRes.data.data.map((n) => n.id);

    // mock-news-12 is the archived fixture.
    expect(publicIds).not.toContain('mock-news-12');
    expect(adminIds).toContain('mock-news-12');
    expect(adminIds.length).toBeGreaterThan(publicIds.length);
  });

  it('serves counselors with the ids and names the calendar/PMO UIs read', async () => {
    const all = await call({ method: 'get', url: '/counselors' });
    expect(all.data.data.length).toBeGreaterThan(0);

    const active = await call({ method: 'get', url: '/counselors/active' });
    expect(active.data.data.length).toBeGreaterThan(0);
    expect(active.data.data.length).toBeLessThan(all.data.data.length);
    active.data.data.forEach((c) => {
      expect(c.id).toBeDefined();
      expect(c.name).toBeTruthy();
      expect(c.counselor_name).toBeTruthy();
    });
  });

  it('serves the news list with pagination meta', async () => {
    const res = await call({ method: 'get', url: '/news/admin', params: { page: 1, limit: 2 } });
    expect(Array.isArray(res.data.data)).toBe(true);
    expect(res.data.data.length).toBeLessThanOrEqual(2);
    expect(res.data.meta.total).toBeGreaterThan(0);
  });

  it('authenticates a demo admin and rejects bad credentials', async () => {
    const ok = await call({
      method: 'post',
      url: '/auth/login',
      data: { username: 'admin', password: 'admin123' }
    });
    expect(ok.data.data.user.role).toBe('Admin');
    expect(typeof ok.data.data.accessToken).toBe('string');

    await expect(
      call({ method: 'post', url: '/auth/login', data: { username: 'admin', password: 'wrong' } })
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('exposes calendar events, FAQs and PMO schedules', async () => {
    const events = await call({ method: 'get', url: '/calendar/events' });
    expect(events.data.data.some((e) => e.type === 'Usapan-Series')).toBe(true);

    const faqs = await call({ method: 'get', url: '/faqs' });
    expect(faqs.data.data.length).toBeGreaterThan(0);

    const schedules = await call({ method: 'get', url: '/pmo/schedules' });
    expect(schedules.data.data.length).toBeGreaterThan(0);
  });

  it('persists create and delete for FAQs', async () => {
    const createdRes = await call({
      method: 'post',
      url: '/faqs',
      data: { topic: 'Test Topic', question: 'Test question?', answer: 'Test answer.' }
    });
    const id = createdRes.data.data.id;

    const afterCreate = await call({ method: 'get', url: '/faqs' });
    expect(afterCreate.data.data.some((f) => String(f.id) === String(id))).toBe(true);

    await call({ method: 'delete', url: `/faqs/${id}` });
    const afterDelete = await call({ method: 'get', url: '/faqs' });
    expect(afterDelete.data.data.some((f) => String(f.id) === String(id))).toBe(false);
  });

  it('returns an empty payload for unknown endpoints instead of failing', async () => {
    const res = await call({ method: 'get', url: '/does-not-exist' });
    expect(res.status).toBe(200);
    expect(res.data.data).toEqual([]);
  });

  // --- Education Corner images ------------------------------------------------
  // Regression guard: every Web Content item and every booklet must carry its own
  // image, otherwise the grid renders the same picture more than once.

  it('gives every Web Content item a distinct image', async () => {
    const res = await call({ method: 'get', url: '/education-corner/web' });
    const items = res.data.data;

    expect(items.length).toBeGreaterThan(1);

    // Every item has a thumbnail the card and the detail page can render.
    items.forEach((it) => {
      expect(typeof it.imageThumbnailUrl).toBe('string');
      expect(it.imageThumbnailUrl.length).toBeGreaterThan(0);
    });

    // No two items share a thumbnail or a visual.
    const thumbs = items.map((it) => it.imageThumbnailUrl);
    expect(new Set(thumbs).size).toBe(thumbs.length);

    const visuals = items.map((it) => it.visualImageUrl).filter(Boolean);
    if (visuals.length > 1) {
      expect(new Set(visuals).size).toBe(visuals.length);
    }
  });

  it('gives every booklet a cover and distinct pages', async () => {
    const res = await call({ method: 'get', url: '/education-corner/booklets' });
    const booklets = res.data.data;

    expect(booklets.length).toBeGreaterThan(1);

    const covers = [];
    for (const b of booklets) {
      expect(b.imageThumbnailUrl).toBeTruthy();
      covers.push(b.imageThumbnailUrl);

      const pagesRes = await call({
        method: 'get',
        url: `/education-corner/booklets/${b.id}/pages`
      });
      const pages = pagesRes.data.data;
      expect(pages.length).toBeGreaterThan(0);
      pages.forEach((p) => expect(p.imageUrl).toBeTruthy());

      // Pages within one booklet are all different images.
      const pageUrls = pages.map((p) => p.imageUrl);
      expect(new Set(pageUrls).size).toBe(pageUrls.length);
    }

    // Covers are unique across booklets.
    expect(new Set(covers).size).toBe(covers.length);
  });
});
