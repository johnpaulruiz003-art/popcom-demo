// Axios adapter that serves the whole REST surface from in-memory mock data.
//
// It is installed on `apiClient` (see src/api/client.js) when mocks are enabled
// so that no request ever leaves the browser and no backend / DATABASE_URL is
// required. Each handler mirrors the response shape of the real endpoint:
//   { data: { data: <payload>, meta?: {...} } }
//
// The store is cloned from mockApiData.js once, so create/update/delete actions
// persist for the duration of the page session.

import {
  mockAuthUsers,
  mockUsers,
  mockNews,
  mockFaqItems,
  mockCalendarEventsFull,
  mockAnnouncements,
  mockFeedback,
  mockClientSatisfactionFeedback,
  mockAppointments,
  mockFamilyPlanningBookings,
  mockCounselors,
  mockHierarchy,
  mockMainOffice,
  mockEducationWeb,
  mockEducationWebKeyConcepts,
  mockBooklets,
  mockFileTasks,
  mockPmoSchedules,
  mockPmoQuestionnaire,
  mockPmoAnswers,
  mockPmoAppointments,
  mockPmoSmsLogs,
  mockUsersAnalytics,
  mockFeedbackAnalytics,
  mockFamilyPlanningAnalytics,
  mockPmoAnalytics,
  mockSearchResults,
  mockServicesList
} from './mockApiData.js';

const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const sameId = (a, b) => String(a) === String(b);
const findById = (arr, id) => arr.find((x) => sameId(x.id, id));
const removeById = (arr, id) => {
  const i = arr.findIndex((x) => sameId(x.id, id));
  if (i >= 0) arr.splice(i, 1);
};

// In-memory, session-scoped copy of every dataset.
const store = {
  users: clone(mockUsers),
  news: clone(mockNews),
  faqs: clone(mockFaqItems),
  events: clone(mockCalendarEventsFull),
  announcements: clone(mockAnnouncements),
  feedback: clone(mockFeedback),
  clientFeedback: clone(mockClientSatisfactionFeedback),
  appointments: clone(mockAppointments),
  fpBookings: clone(mockFamilyPlanningBookings),
  counselors: clone(mockCounselors),
  hierarchy: clone(mockHierarchy),
  office: clone(mockMainOffice),
  educationWeb: clone(mockEducationWeb),
  keyConcepts: clone(mockEducationWebKeyConcepts),
  booklets: clone(mockBooklets),
  fileTasks: clone(mockFileTasks),
  pmoSchedules: clone(mockPmoSchedules),
  pmoQuestionnaire: clone(mockPmoQuestionnaire),
  pmoAnswers: clone(mockPmoAnswers),
  pmoAppointments: clone(mockPmoAppointments),
  pmoSmsLogs: clone(mockPmoSmsLogs),
  services: clone(mockServicesList)
};

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function response(config, payload, status) {
  return {
    data: payload,
    status,
    statusText: status === 201 ? 'Created' : 'OK',
    headers: { 'content-type': 'application/json' },
    config,
    request: {}
  };
}

const ok = (config, data, meta) =>
  Promise.resolve(response(config, meta !== undefined ? { data, meta } : { data }, 200));

const created = (config, data) => Promise.resolve(response(config, { data }, 201));

function fail(config, status, message) {
  const error = new Error(message);
  error.isAxiosError = true;
  error.config = config;
  error.status = status;
  error.response = response(config, { success: false, error: { message } }, status);
  return Promise.reject(error);
}

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------
function getPath(config) {
  const url = String(config.url || '').replace(/^https?:\/\/[^/]+/, '');
  const q = url.indexOf('?');
  return q >= 0 ? url.slice(0, q) : url;
}

function getQuery(config) {
  const params = { ...(config.params || {}) };
  const url = String(config.url || '');
  const q = url.indexOf('?');
  if (q >= 0) {
    new URLSearchParams(url.slice(q + 1)).forEach((v, k) => {
      if (params[k] === undefined) params[k] = v;
    });
  }
  return params;
}

function getBody(config) {
  const data = config.data;
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

function paginate(rows, query) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || rows.length || 1;
  const start = (page - 1) * limit;
  return {
    rows: rows.slice(start, start + limit),
    meta: { total: rows.length, page, limit }
  };
}

// ---------------------------------------------------------------------------
// Route table. First matching entry wins, so more specific patterns (static
// segments) must come before parameterised ones.
// ---------------------------------------------------------------------------
const ROUTES = [
  // --------------------------- auth -------------------------------------
  {
    m: 'post',
    p: /^\/auth\/login$/,
    fn: (c) => {
      const { username, password } = getBody(c);
      const user = mockAuthUsers.find(
        (u) => u.username === String(username || '').trim() && u.password === password
      );
      if (!user) return fail(c, 401, 'Invalid username or password');
      const { password: _pw, ...safe } = user;
      return ok(c, { accessToken: `mock-token-${user.id}`, user: safe });
    }
  },
  {
    m: 'get',
    p: /^\/auth\/me$/,
    fn: (c) => {
      const auth = String(c.headers?.Authorization || c.headers?.authorization || '');
      const id = Number((auth.match(/mock-token-(\d+)/) || [])[1]);
      const user = mockAuthUsers.find((u) => u.id === id) || mockAuthUsers[0];
      const { password: _pw, ...safe } = user;
      return ok(c, safe);
    }
  },
  {
    m: 'post',
    p: /^\/auth\/register$/,
    fn: (c) => {
      const body = getBody(c);
      const user = {
        id: store.users.length + 1,
        username: body.username,
        role: 'User',
        fullName: body.fullName || body.username,
        email: body.email || '',
        contactNumber: body.contactNumber || '',
        contact: body.contactNumber || '',
        barangay: '',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      store.users.push(user);
      return ok(c, user);
    }
  },
  { m: 'post', p: /^\/auth\/forgot\/(start|verify|reset)$/, fn: (c) => ok(c, { ok: true }) },

  // --------------------------- news -------------------------------------
  {
    m: 'get',
    p: /^\/news\/latest$/,
    fn: (c) => ok(c, store.news.filter((n) => n.isPublished !== false).slice(0, 5)),
  },
  {
    m: 'get',
    p: /^\/news\/admin$/,
    fn: (c) => {
      const query = getQuery(c);
      const rows = [...store.news].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const { rows: page, meta } = paginate(rows, query);
      return ok(c, page, meta);
    }
  },
  {
    // Public listing: published news only, newest first (Home page "News &
    // Announcements" section and the news pagination both read this).
    m: 'get',
    p: /^\/news$/,
    fn: (c) => {
      const rows = store.news
        .filter((n) => n.isPublished !== false)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const { rows: page, meta } = paginate(rows, getQuery(c));
      return ok(c, page, meta);
    }
  },
  {
    m: 'get',
    p: /^\/news\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.news, m[1]);
      return item ? ok(c, item) : fail(c, 404, 'News item not found');
    }
  },
  {
    m: 'post',
    p: /^\/news$/,
    fn: (c) => {
      const body = getBody(c);
      const item = { id: uid('mock-news'), isPublished: true, createdById: 1, createdAt: new Date().toISOString(), ...body };
      store.news.unshift(item);
      return created(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/news\/([^/]+)\/archive$/,
    fn: (c, m) => {
      const item = findById(store.news, m[1]);
      if (!item) return fail(c, 404, 'News item not found');
      item.isPublished = false;
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/news\/([^/]+)\/unarchive$/,
    fn: (c, m) => {
      const item = findById(store.news, m[1]);
      if (!item) return fail(c, 404, 'News item not found');
      item.isPublished = true;
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/news\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.news, m[1]);
      if (!item) return fail(c, 404, 'News item not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/news\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.news, m[1]);
      return ok(c, { success: true });
    }
  },

  // ----------------------- announcements --------------------------------
  {
    m: 'get',
    p: /^\/announcements$/,
    fn: (c) => {
      const { rows, meta } = paginate(store.announcements, getQuery(c));
      return ok(c, rows, meta);
    }
  },
  {
    m: 'post',
    p: /^\/announcements$/,
    fn: (c) => {
      const item = { id: uid('mock-ann'), status: 'Scheduled', ...getBody(c) };
      store.announcements.unshift(item);
      return created(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/announcements\/([^/]+)\/archive$/,
    fn: (c, m) => {
      const item = findById(store.announcements, m[1]);
      if (!item) return fail(c, 404, 'Announcement not found');
      item.status = 'ARCHIVED';
      return ok(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/announcements\/([^/]+)\/unarchive$/,
    fn: (c, m) => {
      const item = findById(store.announcements, m[1]);
      if (!item) return fail(c, 404, 'Announcement not found');
      item.status = 'Scheduled';
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/announcements\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.announcements, m[1]);
      if (!item) return fail(c, 404, 'Announcement not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/announcements\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.announcements, m[1]);
      return ok(c, { success: true });
    }
  },

  // --------------------------- services ---------------------------------
  { m: 'get', p: /^\/services$/, fn: (c) => ok(c, store.services) },
  {
    m: 'post',
    p: /^\/services$/,
    fn: (c) => {
      const item = { id: store.services.length + 1, isActive: true, ...getBody(c) };
      store.services.push(item);
      return created(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/services\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.services, m[1]);
      if (!item) return fail(c, 404, 'Service not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/services\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.services, m[1]);
      return ok(c, { success: true });
    }
  },

  // ----------------------------- faqs -----------------------------------
  {
    m: 'get',
    p: /^\/faqs\/topics$/,
    fn: (c) => ok(c, [...new Set(store.faqs.map((f) => f.topic).filter(Boolean))])
  },
  { m: 'get', p: /^\/faqs$/, fn: (c) => ok(c, store.faqs) },
  {
    m: 'post',
    p: /^\/faqs$/,
    fn: (c) => {
      const item = { id: store.faqs.length + 1, ...getBody(c) };
      store.faqs.push(item);
      return created(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/faqs\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.faqs, m[1]);
      if (!item) return fail(c, 404, 'FAQ not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/faqs\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.faqs, m[1]);
      return ok(c, { success: true });
    }
  },

  // --------------------------- counselors -------------------------------
  // Rows expose both the backend keys (counselorID / counselor_name) and the
  // camelCase aliases (id / name) that the calendar and PMO UIs read.
  {
    m: 'get',
    p: /^\/counselors\/active$/,
    fn: (c) => ok(c, store.counselors.filter((x) => x.isActive))
  },
  { m: 'get', p: /^\/counselors$/, fn: (c) => ok(c, store.counselors) },
  {
    m: 'post',
    p: /^\/counselors$/,
    fn: (c) => {
      const body = getBody(c);
      const nextId =
        store.counselors.reduce((max, x) => Math.max(max, Number(x.counselorID) || 0), 0) + 1;
      const name = body.counselor_name || '';
      const item = {
        counselorID: nextId,
        id: nextId,
        counselor_name: name,
        name,
        email: body.email || '',
        contact_number: body.contact_number || '',
        isActive: body.isActive !== false
      };
      store.counselors.push(item);
      return created(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/counselors\/([^/]+)$/,
    fn: (c, m) => {
      const item = store.counselors.find((x) => sameId(x.counselorID, m[1]));
      if (!item) return fail(c, 404, 'Counselor not found');
      const body = getBody(c);
      if (body.counselor_name != null) {
        item.counselor_name = body.counselor_name;
        item.name = body.counselor_name;
      }
      if (body.email != null) item.email = body.email;
      if (body.contact_number != null) item.contact_number = body.contact_number;
      if (body.isActive != null) item.isActive = body.isActive;
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/counselors\/([^/]+)$/,
    fn: (c, m) => {
      const idx = store.counselors.findIndex((x) => sameId(x.counselorID, m[1]));
      if (idx >= 0) store.counselors.splice(idx, 1);
      return ok(c, { success: true });
    }
  },

  // ------------------------- appointments -------------------------------
  {
    m: 'post',
    p: /^\/appointments\/pre-marriage$/,
    fn: (c) => {
      const item = { id: uid('mock-appt'), service_slug: 'pre-marriage-orientation', status: 'PENDING', created_at: new Date().toISOString(), ...getBody(c) };
      store.appointments.unshift(item);
      return created(c, item);
    }
  },
  {
    m: 'post',
    p: /^\/appointments\/usapan-series$/,
    fn: (c) => {
      const item = { id: uid('mock-appt'), service_slug: 'usapan-series', status: 'PENDING', created_at: new Date().toISOString(), ...getBody(c) };
      store.appointments.unshift(item);
      return created(c, item);
    }
  },
  {
    m: 'get',
    p: /^\/appointments\/usapan-series\/me$/,
    fn: (c) => ok(c, store.appointments.filter((a) => a.service_slug === 'usapan-series'))
  },
  {
    m: 'get',
    p: /^\/appointments\/pre-marriage\/me$/,
    fn: (c) => ok(c, store.appointments.filter((a) => a.service_slug === 'pre-marriage-orientation'))
  },
  { m: 'get', p: /^\/appointments$/, fn: (c) => ok(c, store.appointments) },
  {
    m: 'patch',
    p: /^\/appointments\/([^/]+)\/status$/,
    fn: (c, m) => {
      const item = findById(store.appointments, m[1]);
      if (!item) return fail(c, 404, 'Appointment not found');
      item.status = getBody(c).status || item.status;
      return ok(c, item);
    }
  },

  // ---------------------------- feedback --------------------------------
  {
    m: 'post',
    p: /^\/feedback\/client-satisfaction$/,
    fn: (c) => {
      const item = { id: uid('mock-cs'), created_at: new Date().toISOString(), ...getBody(c) };
      store.clientFeedback.unshift(item);
      return created(c, item);
    }
  },
  {
    m: 'get',
    p: /^\/feedback\/client-satisfaction\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.clientFeedback, m[1]);
      return item ? ok(c, item) : fail(c, 404, 'Feedback not found');
    }
  },
  {
    m: 'delete',
    p: /^\/feedback\/client-satisfaction\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.clientFeedback, m[1]);
      return ok(c, { success: true });
    }
  },
  {
    m: 'get',
    p: /^\/feedback\/client-satisfaction$/,
    fn: (c) => {
      const { rows, meta } = paginate(store.clientFeedback, getQuery(c));
      return ok(c, rows, meta);
    }
  },
  { m: 'get', p: /^\/feedback\/analytics$/, fn: (c) => ok(c, mockFeedbackAnalytics) },
  {
    m: 'post',
    p: /^\/feedback$/,
    fn: (c) => {
      const item = { id: uid('mock-feedback'), status: 'NEW', created_at: new Date().toISOString(), ...getBody(c) };
      store.feedback.unshift(item);
      return created(c, item);
    }
  },
  {
    m: 'get',
    p: /^\/feedback$/,
    fn: (c) => {
      const { rows, meta } = paginate(store.feedback, getQuery(c));
      return ok(c, rows, meta);
    }
  },
  {
    m: 'get',
    p: /^\/feedback\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.feedback, m[1]);
      return item ? ok(c, item) : fail(c, 404, 'Feedback not found');
    }
  },
  {
    m: 'patch',
    p: /^\/feedback\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.feedback, m[1]);
      if (!item) return fail(c, 404, 'Feedback not found');
      item.status = getBody(c).status || item.status;
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/feedback\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.feedback, m[1]);
      return ok(c, { success: true });
    }
  },

  // ----------------------- calendar / events ----------------------------
  { m: 'get', p: /^\/calendar\/events$/, fn: (c) => ok(c, store.events) },
  {
    m: 'post',
    p: /^\/calendar\/events$/,
    fn: (c) => {
      const item = applyEventBody(
        { id: uid('mock-event'), type: 'Event/Activity', status: 'Scheduled', counselor: null, counselorID: null, barangay: null, userID: null },
        getBody(c)
      );
      store.events.push(item);
      return created(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/calendar\/events\/([^/]+)\/cancel$/,
    fn: (c, m) => {
      const item = findById(store.events, m[1]);
      if (!item) return fail(c, 404, 'Event not found');
      item.status = 'Cancelled';
      return ok(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/calendar\/events\/([^/]+)\/archive$/,
    fn: (c, m) => {
      const item = findById(store.events, m[1]);
      if (!item) return fail(c, 404, 'Event not found');
      item.status = 'Deleted';
      return ok(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/calendar\/events\/([^/]+)\/unarchive$/,
    fn: (c, m) => {
      const item = findById(store.events, m[1]);
      if (!item) return fail(c, 404, 'Event not found');
      item.status = 'Scheduled';
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/calendar\/events\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.events, m[1]);
      if (!item) return fail(c, 404, 'Event not found');
      applyEventBody(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/calendar\/events\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.events, m[1]);
      return ok(c, { success: true });
    }
  },
  {
    m: 'get',
    p: /^\/calendar\/usapan\/admin\/schedules\/archived$/,
    fn: (c) => ok(c, store.events.filter((e) => String(e.status).toLowerCase() === 'deleted'))
  },

  // ----------------------- education materials --------------------------
  { m: 'get', p: /^\/education-materials$/, fn: (c) => ok(c, []) },
  { m: 'get', p: /^\/education-materials\/([^/]+)$/, fn: (c) => fail(c, 404, 'Material not found') },
  { m: 'post', p: /^\/education-materials$/, fn: (c) => created(c, { id: uid('mock-edu'), ...getBody(c) }) },
  { m: 'put', p: /^\/education-materials\/([^/]+)$/, fn: (c) => ok(c, { ...getBody(c) }) },
  { m: 'delete', p: /^\/education-materials\/([^/]+)$/, fn: (c) => ok(c, { success: true }) },

  // ------------------- education corner: web content --------------------
  { m: 'get', p: /^\/education-corner\/web$/, fn: (c) => ok(c, store.educationWeb) },
  {
    m: 'post',
    p: /^\/education-corner\/web$/,
    fn: (c) => {
      const item = { id: uid('mock-web'), isPublished: true, displayOrder: 99, createdAt: new Date().toISOString(), ...getBody(c) };
      store.educationWeb.push(item);
      return created(c, item);
    }
  },
  {
    m: 'get',
    p: /^\/education-corner\/web\/([^/]+)\/key-concepts$/,
    fn: (c, m) => ok(c, store.keyConcepts.filter((k) => sameId(k.webId, m[1])))
  },
  {
    m: 'put',
    p: /^\/education-corner\/web\/([^/]+)\/key-concepts$/,
    fn: (c, m) => {
      const { concepts } = getBody(c);
      store.keyConcepts = store.keyConcepts.filter((k) => !sameId(k.webId, m[1]));
      (concepts || []).forEach((concept) => {
        store.keyConcepts.push({ id: concept.id || uid('mock-kc'), webId: m[1], ...concept });
      });
      return ok(c, store.keyConcepts.filter((k) => sameId(k.webId, m[1])));
    }
  },
  {
    m: 'put',
    p: /^\/education-corner\/web\/([^/]+)\/archive$/,
    fn: (c, m) => {
      const item = findById(store.educationWeb, m[1]);
      if (!item) return fail(c, 404, 'Content not found');
      item.isPublished = false;
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/education-corner\/web\/([^/]+)\/unarchive$/,
    fn: (c, m) => {
      const item = findById(store.educationWeb, m[1]);
      if (!item) return fail(c, 404, 'Content not found');
      item.isPublished = true;
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/education-corner\/web\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.educationWeb, m[1]);
      if (!item) return fail(c, 404, 'Content not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },

  // ------------------ education corner: booklets ------------------------
  { m: 'get', p: /^\/education-corner\/booklets$/, fn: (c) => ok(c, store.booklets) },
  {
    m: 'post',
    p: /^\/education-corner\/booklets$/,
    fn: (c) => {
      const item = { id: uid('mock-booklet'), isPublished: true, pages: [], ...getBody(c) };
      store.booklets.push(item);
      return created(c, item);
    }
  },
  {
    m: 'get',
    p: /^\/education-corner\/booklets\/([^/]+)\/pages$/,
    fn: (c, m) => {
      const booklet = findById(store.booklets, m[1]);
      return ok(c, booklet?.pages || []);
    }
  },
  {
    m: 'post',
    p: /^\/education-corner\/booklets\/([^/]+)\/pages$/,
    fn: (c, m) => {
      const booklet = findById(store.booklets, m[1]);
      if (!booklet) return fail(c, 404, 'Booklet not found');
      booklet.pages = booklet.pages || [];
      const page = { id: uid('mock-page'), bookletId: m[1], ...getBody(c) };
      booklet.pages.push(page);
      return created(c, page);
    }
  },
  {
    m: 'put',
    p: /^\/education-corner\/booklets\/([^/]+)\/archive$/,
    fn: (c, m) => {
      const item = findById(store.booklets, m[1]);
      if (!item) return fail(c, 404, 'Booklet not found');
      item.isPublished = false;
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/education-corner\/booklets\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.booklets, m[1]);
      if (!item) return fail(c, 404, 'Booklet not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/education-corner\/booklet-pages\/([^/]+)$/,
    fn: (c, m) => {
      for (const b of store.booklets) {
        const page = (b.pages || []).find((p) => sameId(p.id, m[1]));
        if (page) {
          Object.assign(page, getBody(c));
          return ok(c, page);
        }
      }
      return fail(c, 404, 'Page not found');
    }
  },
  {
    m: 'delete',
    p: /^\/education-corner\/booklet-pages\/([^/]+)$/,
    fn: (c, m) => {
      for (const b of store.booklets) {
        if (!b.pages) continue;
        const idx = b.pages.findIndex((p) => sameId(p.id, m[1]));
        if (idx >= 0) {
          b.pages.splice(idx, 1);
          return ok(c, { success: true });
        }
      }
      return ok(c, { success: true });
    }
  },

  // ------------------------ family planning -----------------------------
  {
    m: 'post',
    p: /^\/family-planning\/bookings$/,
    fn: (c) => {
      const item = { id: uid('mock-fp'), status: 'PENDING', created_at: new Date().toISOString(), ...getBody(c) };
      store.fpBookings.unshift(item);
      return created(c, item);
    }
  },
  { m: 'get', p: /^\/family-planning\/bookings\/me$/, fn: (c) => ok(c, store.fpBookings) },
  {
    m: 'get',
    p: /^\/family-planning\/admin\/bookings$/,
    fn: (c) => {
      const { rows, meta } = paginate(store.fpBookings, getQuery(c));
      return ok(c, rows, meta);
    }
  },
  { m: 'get', p: /^\/family-planning\/admin\/analytics$/, fn: (c) => ok(c, mockFamilyPlanningAnalytics) },
  {
    m: 'post',
    p: /^\/family-planning\/admin\/bookings\/([^/]+)\/(approve|reject|cancel|archive|unarchive)$/,
    fn: (c, m) => {
      const item = findById(store.fpBookings, m[1]);
      if (!item) return fail(c, 404, 'Booking not found');
      const action = m[2];
      if (action === 'approve') item.status = 'APPROVED';
      else if (action === 'reject') item.status = 'REJECTED';
      else if (action === 'cancel') item.status = 'CANCELLED';
      else if (action === 'archive') item.status = 'ARCHIVED';
      else if (action === 'unarchive') item.status = 'PENDING';
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/family-planning\/admin\/bookings\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.fpBookings, m[1]);
      return ok(c, { success: true });
    }
  },

  // --------------------------- file tasks -------------------------------
  {
    m: 'get',
    p: /^\/file-tasks\/admin$/,
    fn: (c) => {
      const { rows, meta } = paginate(store.fileTasks, getQuery(c));
      return ok(c, rows, meta);
    }
  },
  {
    m: 'post',
    p: /^\/file-tasks\/admin$/,
    fn: (c) => {
      const item = { id: uid('mock-filetask'), status: 'PENDING', submittedAt: null, ...getBody(c) };
      store.fileTasks.unshift(item);
      return created(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/file-tasks\/admin\/([^/]+)\/archive$/,
    fn: (c, m) => {
      const item = findById(store.fileTasks, m[1]);
      if (!item) return fail(c, 404, 'Task not found');
      item.status = 'ARCHIVED';
      return ok(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/file-tasks\/admin\/([^/]+)\/unarchive$/,
    fn: (c, m) => {
      const item = findById(store.fileTasks, m[1]);
      if (!item) return fail(c, 404, 'Task not found');
      item.status = 'PENDING';
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/file-tasks\/admin\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.fileTasks, m[1]);
      if (!item) return fail(c, 404, 'Task not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/file-tasks\/admin\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.fileTasks, m[1]);
      return ok(c, { success: true });
    }
  },
  { m: 'get', p: /^\/file-tasks\/me$/, fn: (c) => ok(c, store.fileTasks, { total: store.fileTasks.length }) },
  {
    m: 'post',
    p: /^\/file-tasks\/me\/([^/]+)\/submit$/,
    fn: (c, m) => {
      const item = findById(store.fileTasks, m[1]);
      if (item) {
        item.status = 'SUBMITTED';
        item.submittedAt = new Date().toISOString();
        item.fileName = 'mock-upload.pdf';
        item.supabaseLink = 'https://example.com/mock/upload.pdf';
      }
      return ok(c, item || { success: true });
    }
  },
  {
    m: 'put',
    p: /^\/file-tasks\/me\/([^/]+)\/submit$/,
    fn: (c, m) => {
      const item = findById(store.fileTasks, m[1]);
      if (item) {
        item.status = 'SUBMITTED';
        item.submittedAt = new Date().toISOString();
        item.fileName = 'mock-replacement.pdf';
        item.supabaseLink = 'https://example.com/mock/replacement.pdf';
      }
      return ok(c, item || { success: true });
    }
  },
  {
    m: 'delete',
    p: /^\/file-tasks\/me\/([^/]+)\/submit$/,
    fn: (c, m) => {
      const item = findById(store.fileTasks, m[1]);
      if (item) {
        item.status = 'PENDING';
        item.submittedAt = null;
        item.fileName = null;
        item.supabaseLink = null;
      }
      return ok(c, item || { success: true });
    }
  },

  // --------------------------- hierarchy --------------------------------
  { m: 'get', p: /^\/hierarchy$/, fn: (c) => ok(c, store.hierarchy) },
  {
    m: 'post',
    p: /^\/hierarchy$/,
    fn: (c) => {
      const item = { id: store.hierarchy.length + 1, ...getBody(c) };
      store.hierarchy.push(item);
      return created(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/hierarchy\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.hierarchy, m[1]);
      if (!item) return fail(c, 404, 'Entry not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/hierarchy\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.hierarchy, m[1]);
      return ok(c, { success: true });
    }
  },

  // ---------------------------- offices ---------------------------------
  { m: 'get', p: /^\/offices\/main$/, fn: (c) => ok(c, store.office) },
  {
    m: 'put',
    p: /^\/offices\/main$/,
    fn: (c) => {
      Object.assign(store.office, getBody(c));
      return ok(c, store.office);
    }
  },

  // ---------------------- PMO (public endpoints) ------------------------
  {
    m: 'post',
    p: /^\/pmo\/bookings$/,
    fn: (c) => created(c, { appointmentID: uid('mock-pmo'), status: 'PENDING', ...getBody(c) })
  },
  {
    m: 'get',
    p: /^\/pmo\/schedules$/,
    fn: (c) => ok(c, store.pmoSchedules.filter((s) => String(s.status).toUpperCase() !== 'CANCELLED'))
  },
  { m: 'get', p: /^\/pmo\/questionnaire$/, fn: (c) => ok(c, store.pmoQuestionnaire.filter((q) => !q.is_invisible)) },
  { m: 'get', p: /^\/pmo\/appointments\/me$/, fn: (c) => ok(c, store.pmoAppointments) },

  // ---------------------- PMO (admin endpoints) -------------------------
  { m: 'get', p: /^\/pmo\/admin\/schedules$/, fn: (c) => ok(c, store.pmoSchedules) },
  {
    m: 'patch',
    p: /^\/pmo\/admin\/schedules\/([^/]+)\/archive$/,
    fn: (c, m) => {
      const item = findById(store.pmoSchedules, m[1]);
      if (!item) return fail(c, 404, 'Schedule not found');
      item.status = 'Cancelled';
      return ok(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/pmo\/admin\/schedules\/([^/]+)\/unarchive$/,
    fn: (c, m) => {
      const item = findById(store.pmoSchedules, m[1]);
      if (!item) return fail(c, 404, 'Schedule not found');
      item.status = 'Scheduled';
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/pmo\/admin\/schedules\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.pmoSchedules, m[1]);
      if (!item) return fail(c, 404, 'Schedule not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/pmo\/admin\/schedules\/([^/]+)$/,
    fn: (c, m) => {
      removeById(store.pmoSchedules, m[1]);
      return ok(c, { success: true });
    }
  },
  { m: 'get', p: /^\/pmo\/admin\/bookings$/, fn: (c) => ok(c, store.pmoAppointments) },
  { m: 'get', p: /^\/pmo\/admin\/answers$/, fn: (c) => ok(c, store.pmoAnswers) },
  { m: 'get', p: /^\/pmo\/admin\/analytics$/, fn: (c) => ok(c, mockPmoAnalytics) },
  { m: 'get', p: /^\/pmo\/admin\/questionnaire$/, fn: (c) => ok(c, store.pmoQuestionnaire) },
  {
    m: 'post',
    p: /^\/pmo\/admin\/questionnaire$/,
    fn: (c) => {
      const item = { questionID: store.pmoQuestionnaire.length + 1, ...getBody(c) };
      store.pmoQuestionnaire.push(item);
      return created(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/pmo\/admin\/questionnaire\/([^/]+)$/,
    fn: (c, m) => {
      const item = store.pmoQuestionnaire.find((q) => sameId(q.questionID, m[1]));
      if (!item) return fail(c, 404, 'Question not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  },
  {
    m: 'delete',
    p: /^\/pmo\/admin\/questionnaire\/([^/]+)$/,
    fn: (c, m) => {
      const idx = store.pmoQuestionnaire.findIndex((q) => sameId(q.questionID, m[1]));
      if (idx >= 0) store.pmoQuestionnaire.splice(idx, 1);
      return ok(c, { success: true });
    }
  },
  { m: 'get', p: /^\/pmo\/admin\/appointments$/, fn: (c) => ok(c, store.pmoAppointments) },
  {
    m: 'get',
    p: /^\/pmo\/admin\/appointments\/([^/]+)\/meif$/,
    fn: (c, m) => {
      const item = store.pmoAppointments.find((a) => sameId(a.appointmentID, m[1]) || sameId(a.id, m[1]));
      return item ? ok(c, item) : fail(c, 404, 'Appointment not found');
    }
  },
  {
    m: 'post',
    p: /^\/pmo\/admin\/appointments\/([^/]+)\/(accept|reject|cancel)$/,
    fn: (c, m) => {
      const item = store.pmoAppointments.find((a) => sameId(a.appointmentID, m[1]) || sameId(a.id, m[1]));
      if (!item) return fail(c, 404, 'Appointment not found');
      item.status = m[2] === 'accept' ? 'APPROVED' : m[2] === 'reject' ? 'REJECTED' : 'CANCELLED';
      return ok(c, item);
    }
  },
  {
    m: 'patch',
    p: /^\/pmo\/admin\/appointments\/([^/]+)\/(archive|unarchive)$/,
    fn: (c, m) => {
      const item = store.pmoAppointments.find((a) => sameId(a.appointmentID, m[1]) || sameId(a.id, m[1]));
      if (!item) return fail(c, 404, 'Appointment not found');
      item.status = m[2] === 'archive' ? 'ARCHIVED' : 'APPROVED';
      return ok(c, item);
    }
  },
  { m: 'get', p: /^\/pmo\/admin\/sms-logs\/failed-count$/, fn: (c) => ok(c, { count: store.pmoSmsLogs.filter((l) => l.status === 'FAILED').length }) },
  {
    m: 'post',
    p: /^\/pmo\/admin\/sms-logs\/([^/]+)\/resend$/,
    fn: (c, m) => {
      const item = findById(store.pmoSmsLogs, m[1]);
      if (item) item.status = 'SENT';
      return ok(c, item || { success: true });
    }
  },
  {
    m: 'get',
    p: /^\/pmo\/admin\/sms-logs$/,
    fn: (c) => {
      const { rows, meta } = paginate(store.pmoSmsLogs, getQuery(c));
      return ok(c, rows, meta);
    }
  },
  {
    m: 'get',
    p: /^\/pmo\/admin\/db\/export$/,
    fn: (c) =>
      Promise.resolve(
        response(c, new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' }), 200)
      )
  },
  { m: 'post', p: /^\/pmo\/admin\/db\/import$/, fn: (c) => ok(c, { success: true }) },
  { m: 'post', p: /^\/pmo\/admin\/db\/import-sql$/, fn: (c) => ok(c, { success: true }) },

  // ----------------------------- search ---------------------------------
  { m: 'get', p: /^\/search$/, fn: (c) => ok(c, mockSearchResults) },

  // ----------------------------- uploads --------------------------------
  {
    m: 'post',
    p: /^\/uploads\/image$/,
    fn: (c) => ok(c, { publicUrl: 'https://example.com/mock/uploaded-image.jpg' })
  },

  // ------------------------------ users ---------------------------------
  { m: 'get', p: /^\/users\/analytics$/, fn: (c) => ok(c, mockUsersAnalytics) },
  {
    m: 'get',
    p: /^\/users$/,
    fn: (c) => {
      const { rows, meta } = paginate(store.users, getQuery(c));
      return ok(c, rows, meta);
    }
  },
  {
    m: 'post',
    p: /^\/users$/,
    fn: (c) => {
      const body = getBody(c);
      const item = { id: store.users.length + 1, isActive: true, contact: body.contactNumber || '', createdAt: new Date().toISOString(), ...body };
      store.users.push(item);
      return created(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/users\/me$/,
    fn: (c) => ok(c, { ...getBody(c) })
  },
  { m: 'delete', p: /^\/users\/me$/, fn: (c) => ok(c, { success: true }) },
  {
    m: 'patch',
    p: /^\/users\/([^/]+)\/active$/,
    fn: (c, m) => {
      const item = findById(store.users, m[1]);
      if (!item) return fail(c, 404, 'User not found');
      item.isActive = getBody(c).isActive !== false;
      return ok(c, item);
    }
  },
  {
    m: 'put',
    p: /^\/users\/([^/]+)$/,
    fn: (c, m) => {
      const item = findById(store.users, m[1]);
      if (!item) return fail(c, 404, 'User not found');
      Object.assign(item, getBody(c));
      return ok(c, item);
    }
  }
];

// Merge a calendar/event request body onto a stored event, deriving the
// camelCase date fields the calendar UI reads and the snake_case mirrors the
// Usapan admin panels read.
function applyEventBody(item, body) {
  Object.assign(item, body);
  const date = body.date || (body.startDate ? String(body.startDate).slice(0, 10) : item.date);
  const startTime = body.startTime || body.start_time;
  const endTime = body.endTime || body.end_time;
  if (date) {
    item.date = String(date).slice(0, 10);
    if (startTime) item.startDate = `${item.date}T${String(startTime).slice(0, 5)}:00`;
    if (endTime) item.endDate = `${item.date}T${String(endTime).slice(0, 5)}:00`;
  }
  if (startTime) item.start_time = String(startTime).slice(0, 5);
  if (endTime) item.end_time = String(endTime).slice(0, 5);
  return item;
}

/**
 * Find the first route registered for a method + path. Returns `null` when no
 * route matches, which the adapter treats as "empty payload" and which
 * mockApiAdapter.test.js asserts against for every endpoint in src/api.
 */
export function findMockRoute(path, method) {
  const wanted = String(method || 'get').toLowerCase();
  for (const route of ROUTES) {
    if (route.m !== wanted) continue;
    const match = route.p.exec(path);
    if (match) return { route, match };
  }
  return null;
}

/**
 * Axios adapter that resolves every request from the in-memory mock store.
 * Installed on the shared `apiClient` when mocks are enabled, so no request
 * ever reaches the backend and no DATABASE_URL is required.
 */
export function mockAdapter(config) {
  const found = findMockRoute(getPath(config), config.method);
  if (found) {
    return Promise.resolve().then(() => found.route.fn(config, found.match));
  }

  // Unknown endpoint: return an empty payload so the UI renders its empty state
  // instead of making a real network call.
  return ok(config, []);
}

export default mockAdapter;
