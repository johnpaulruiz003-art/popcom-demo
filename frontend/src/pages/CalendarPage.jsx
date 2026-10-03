import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Title,
  Stack,
  Modal,
  Text,
  Loader,
  Center,
  Badge,
  Group,
  Box,
  Button,
  ActionIcon,
  Divider,
  useMantineTheme,
  Select,
  TextInput,
  Textarea,
  ThemeIcon,
  Pagination
} from '@mantine/core';
import { IconCalendar, IconClock, IconMapPin, IconUser, IconInfoCircle, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { DatePickerInput, DatePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';

import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, cancelCalendarEvent, deleteCalendarEvent } from '../api/calendar.js';
import { createAnnouncement } from '../api/announcements.js';
import { getActiveCounselors } from '../api/counselors.js';
import { useAuth } from '../context/AuthContext.jsx';
import { HOURS_12, MINUTES_COMMON, MERIDIEMS, to24hTime, compareTimes24 } from '../utils/time.js';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal.jsx';
import {
  getEventKey,
  getEventTypeToken,
  getDayTokenForEvents,
  getDistinctEventTypesForEvents,
  getSwatchFill,
  getStatusToken,
  getScheduleStateToken,
  getTypeInitials,
  EVENT_TYPE_LEGEND,
  CALENDAR_TYPE_LEGEND,
  STATUS_LEGEND,
} from '../utils/eventColors.js';
import '../styles/calendarPage.css';

const SAN_FABIAN_BARANGAYS = [
  'Alacan','Ambalangan-Dalin','Angio','Anonang','Aramal','Bigbiga','Binday','Bolaoen','Bolasi','Cabaruan','Cayanga','Colisao','Gomot','Inmalog','Inmalog Norte','Lekep-Butao','Lipit-Tomeeng','Longos','Longos Proper','Longos-Amangonan-Parac-Parac (Fabrica)','Mabilao','Nibaliw Central','Nibaliw East','Nibaliw Magliba','Nibaliw Narvarte (Nibaliw West Compound)','Nibaliw Vidal (Nibaliw West Proper)','Palapad','Poblacion','Rabon','Sagud-Bahley','Sobol','Tempra-Guilig','Tiblong','Tocok'
];

function to12hParts(dateObj) {
  const d = dayjs(dateObj);
  const h24 = d.hour();
  const minute = String(d.minute()).padStart(2, '0');
  const meridiem = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { hour: String(h12).padStart(2, '0'), minute, meridiem };
}

function toDayKey(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function normalizeDay(date) {
  return dayjs(date).startOf('day');
}

function isSameOrBefore(a, b, unit = 'day') {
  return a.isSame(b, unit) || a.isBefore(b, unit);
}

function isSameOrAfter(a, b, unit = 'day') {
  return a.isSame(b, unit) || a.isAfter(b, unit);
}

export function getEventStatus(event, now = new Date()) {
  if (String(event?.status || '').toLowerCase() === 'cancelled') return 'CANCELLED';
  const n = dayjs(now);
  const start = dayjs(event.startDate);
  const rawEnd = event.endDate ? dayjs(event.endDate) : null;
  const end = !rawEnd || rawEnd.isSame(start) ? start.add(1, 'hour') : rawEnd;

  if (n.isBefore(start)) return 'UPCOMING';
  if (n.isSame(start) || (n.isAfter(start) && n.isBefore(end)) || n.isSame(end)) return 'ONGOING';
  return 'FINISHED';
}

// Event type and status colours are the shared tokens from
// utils/eventColors.js - the hex values live in styles/eventColors.css and are
// never hardcoded in this file. The aliases below keep the existing call
// sites (getEventColor / getDayColor) working unchanged.
const getEventColor = getEventTypeToken;
const getDayColor = ({ events }) => getDayTokenForEvents(events);

function sortEventsUpcomingFirst(items, now = new Date()) {
  const today = normalizeDay(now);
  return [...items].sort((a, b) => {
    const sa = normalizeDay(a.startDate);
    const ea = a.endDate ? normalizeDay(a.endDate) : sa;
    const sb = normalizeDay(b.startDate);
    const eb = b.endDate ? normalizeDay(b.endDate) : sb;

    const aOngoing = isSameOrBefore(sa, today, 'day') && isSameOrAfter(ea, today, 'day');
    const bOngoing = isSameOrBefore(sb, today, 'day') && isSameOrAfter(eb, today, 'day');

    if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;

    const aPast = ea.isBefore(today, 'day');
    const bPast = eb.isBefore(today, 'day');

    if (aPast !== bPast) return aPast ? 1 : -1;

    const ta = sa.valueOf();
    const tb = sb.valueOf();
    if (ta !== tb) return ta - tb;

    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

function getCalendarGridDays(targetMonth) {
  const monthStart = dayjs(targetMonth).startOf('month');
  // Ensure the grid always starts on Sunday to match the Sunâ€“Sat headers,
  // regardless of locale start-of-week settings.
  const weekday = monthStart.day(); // 0 = Sunday, 1 = Monday, ...
  const gridStart = monthStart.subtract(weekday, 'day');

  const days = [];
  // Only emit the weeks the month actually spans. A fixed 42-cell grid always
  // rendered a phantom trailing week (an empty 6th row) for five-week months.
  const totalCells = Math.ceil((weekday + monthStart.daysInMonth()) / 7) * 7;
  for (let i = 0; i < totalCells; i += 1) {
    days.push(gridStart.add(i, 'day').toDate());
  }
  return days;
}

function expandEventsByDate(events, rangeStart, rangeEnd) {
  const start = normalizeDay(rangeStart);
  const end = normalizeDay(rangeEnd);
  const grouped = {};

  events.forEach((ev) => {
    const evStart = normalizeDay(ev.startDate);
    const evEnd = ev.endDate ? normalizeDay(ev.endDate) : evStart;

    const cursorStart = evStart.isAfter(start, 'day') ? evStart : start;
    const cursorEnd = evEnd.isBefore(end, 'day') ? evEnd : end;

    if (cursorEnd.isBefore(cursorStart, 'day')) return;

    let cursor = cursorStart;
    while (isSameOrBefore(cursor, cursorEnd, 'day')) {
      const key = cursor.format('YYYY-MM-DD');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ev);
      cursor = cursor.add(1, 'day');
    }
  });

  return grouped;
}

export function CalendarPage() {
  const auth = useAuth() || {};
  const { isAdmin } = auth;
  const theme = useMantineTheme();
  const [month, setMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [addModalOpened, setAddModalOpened] = useState(false);
  // Scrolling body of the Add Schedule modal. Used to bring the first invalid
  // field into view on a failed submit.
  const addBodyRef = useRef(null);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [activeCounselors, setActiveCounselors] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [deleteEventId, setDeleteEventId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelEventId, setCancelEventId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [sidebarMonth, setSidebarMonth] = useState(month); // month shown in popup calendar only
  const [sidebarDate, setSidebarDate] = useState(null); // still used to filter main list
  const [sidebarPickerOpened, setSidebarPickerOpened] = useState(false);
  const [sidebarPopupDate, setSidebarPopupDate] = useState(null); // selection inside popup calendar
  const [sidebarHoverEventId, setSidebarHoverEventId] = useState(null); // hover state for popup event cards

  const addForm = useForm({
    initialValues: {
      title: '',
      type: 'Pre-Marriage Orientation',
      date: null,
      startHour: '09',
      startMinute: '00',
      startMeridiem: 'AM',
      endHour: '10',
      endMinute: '00',
      endMeridiem: 'AM',
      counselorID: null,
      barangay: '',
      location: '',
      description: '',
      lead: '',
      status: 'Scheduled',
      details: ''
    },
    validate: {
      title: (v, values) => (values.type === 'Event/Activity' && !String(v || '').trim() ? 'Title is required' : null),
      date: (v) => (v ? null : 'Date is required'),
      startHour: (v) => (String(v || '').trim() ? null : 'Start hour is required'),
      startMinute: (v) => (String(v || '').trim() ? null : 'Start minute is required'),
      startMeridiem: (v) => (String(v || '').trim() ? null : 'Start AM/PM is required'),
      endHour: (v, values) => (values.type === 'Usapan-Series' ? null : (String(v || '').trim() ? null : 'End hour is required')),
      endMinute: (v, values) => (values.type === 'Usapan-Series' ? null : (String(v || '').trim() ? null : 'End minute is required')),
      endMeridiem: (v, values) => (values.type === 'Usapan-Series' ? null : (String(v || '').trim() ? null : 'End AM/PM is required')),
      counselorID: (v, values) =>
        values.type === 'Pre-Marriage Orientation' ? (v ? null : 'Counselor is required for this type') : null,
      lead: () => null,
      barangay: (v, values) => (values.type === 'Usapan-Series' ? (String(v || '').trim() ? null : 'Barangay is required') : null)
    }
  });

  const editForm = useForm({
    initialValues: {
      title: '',
      type: 'Pre-Marriage Orientation',
      date: null,
      startHour: '09',
      startMinute: '00',
      startMeridiem: 'AM',
      endHour: '10',
      endMinute: '00',
      endMeridiem: 'AM',
      counselorID: null,
      barangay: '',
      location: '',
      description: '',
      lead: '',
      status: 'Scheduled'
    },
    validate: {
      title: () => null,
      date: (v) => (v ? null : 'Date is required'),
      startHour: (v) => (String(v || '').trim() ? null : 'Start hour is required'),
      startMinute: (v) => (String(v || '').trim() ? null : 'Start minute is required'),
      startMeridiem: (v) => (String(v || '').trim() ? null : 'Start AM/PM is required'),
      endHour: (v, values) => (values.type === 'Usapan-Series' ? null : (String(v || '').trim() ? null : 'End hour is required')),
      endMinute: (v, values) => (values.type === 'Usapan-Series' ? null : (String(v || '').trim() ? null : 'End minute is required')),
      endMeridiem: (v, values) => (values.type === 'Usapan-Series' ? null : (String(v || '').trim() ? null : 'End AM/PM is required')),
      counselorID: (v, values) =>
        values.type === 'Pre-Marriage Orientation' ? (v ? null : 'Counselor is required for this type') : null,
      lead: () => null,
      barangay: (v, values) => (values.type === 'Usapan-Series' ? (String(v || '').trim() ? null : 'Barangay is required') : null)
    }
  });

  useEffect(() => {
    if (addForm.values.type === 'Pre-Marriage Orientation') {
      if (addForm.values.title) addForm.setFieldValue('title', '');
    }
    // Reset counselor when switching types
    if (addForm.values.type !== 'Pre-Marriage Orientation') {
      if (addForm.values.counselorID) addForm.setFieldValue('counselorID', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addForm.values.type]);

  useEffect(() => {
    if (editForm.values.type === 'Pre-Marriage Orientation') {
      if (editForm.values.title) editForm.setFieldValue('title', '');
    }
    if (editForm.values.type !== 'Pre-Marriage Orientation') {
      if (editForm.values.counselorID) editForm.setFieldValue('counselorID', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editForm.values.type]);

  /**
   * Bring the first field that currently shows an error into view and focus
   * it. This only reacts to errors the form already produces - it does not add,
   * remove or reorder any validation rule.
   */
  const focusFirstAddError = () => {
    const body = addBodyRef.current;
    if (!body) return;
    const firstError = body.querySelector('.mantine-InputWrapper-error');
    if (!firstError) return;
    const wrapper = firstError.closest('.mantine-InputWrapper');
    if (wrapper) wrapper.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const control = wrapper && wrapper.querySelector('input, textarea, button');
    if (control && typeof control.focus === 'function') {
      control.focus({ preventScroll: true });
    }
  };

  // Signature of the visible errors, so this runs when they change rather than
  // on every keystroke. Covers both rule-based errors and the ones the submit
  // handler sets imperatively (past date, end-time ordering).
  const addErrorSignature = Object.entries(addForm.errors)
    .filter(([, message]) => message)
    .map(([field, message]) => `${field}:${message}`)
    .join('|');

  useEffect(() => {
    if (!addModalOpened) return;
    if (!addErrorSignature) return;
    focusFirstAddError();
  }, [addErrorSignature, addModalOpened]);

  useEffect(() => {
    if (!isAdmin) return;
    getActiveCounselors()
      .then((res) => setActiveCounselors(res.data.data || []))
      .catch((err) => {
        console.error(err);
        setActiveCounselors([]);
      });
  }, [isAdmin]);

  const fetchEvents = async (targetMonth) => {
    setLoading(true);
    try {
      // Load a full year window so popup calendar can browse across months
      const start = dayjs(targetMonth).startOf('year').toISOString();
      const end = dayjs(targetMonth).endOf('year').toISOString();
      const res = await getCalendarEvents({ start, end });
      const all = res.data.data || [];
      // Filter out deleted announcement-backed events to avoid showing removed Event/Activity
      const filtered = all.filter((ev) => !(ev && ev.type === 'Event/Activity' && String(ev.status).toLowerCase() === 'deleted'));
      setEvents(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(month).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const monthRange = useMemo(() => {
    // Expand eventsByDate over the same yearly window used in fetchEvents
    const start = dayjs(month).startOf('year').toDate();
    const end = dayjs(month).endOf('year').toDate();
    return { start, end };
  }, [month]);

  const visibleEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return list.filter((ev) => {
      if (!ev) return false;
      const type = String(ev.type || '').toUpperCase();
      const rawStatus = String(ev.status || '').toUpperCase();
      if (type === 'USAPAN-SERIES' && rawStatus === 'PENDING') {
        return false;
      }
      return true;
    });
  }, [events]);

  const gridDays = useMemo(() => getCalendarGridDays(sidebarMonth), [sidebarMonth]);

  useEffect(() => {
    // keep popup calendar initially in sync with main month,
    // but allow independent navigation inside the popup
    setSidebarMonth(month);
  }, [month]);

  const eventsByDate = useMemo(() => {
    return expandEventsByDate(visibleEvents, monthRange.start, monthRange.end);
  }, [visibleEvents, monthRange.start, monthRange.end]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate[toDayKey(selectedDate)] || [];
  }, [eventsByDate, selectedDate]);

  const sortedEventsForList = useMemo(() => {
    const now = new Date();
    const startOfMonth = dayjs(month).startOf('month');
    const endOfMonth = dayjs(month).endOf('month');
    const list = (visibleEvents || []).filter((ev) => {
      const s = dayjs(ev.startDate).startOf('day');
      const e = ev.endDate ? dayjs(ev.endDate).startOf('day') : s;
      return !(e.isBefore(startOfMonth, 'day') || s.isAfter(endOfMonth, 'day'));
    });

    list.sort((a, b) => {
      const statusA = getEventStatus(a, now);
      const statusB = getEventStatus(b, now);

      const isDoneA = statusA === 'FINISHED' || statusA === 'CANCELLED';
      const isDoneB = statusB === 'FINISHED' || statusB === 'CANCELLED';

      if (isDoneA !== isDoneB) {
        // Non-finished/non-cancelled events first, finished/cancelled events last
        return isDoneA ? 1 : -1;
      }

      const startA = dayjs(a.startDate);
      const startB = dayjs(b.startDate);

      if (startA.isBefore(startB)) return -1;
      if (startA.isAfter(startB)) return 1;
      return 0;
    });

    return list;
  }, [visibleEvents, month]);

  const typeOptions = useMemo(
    () => ([
      { value: 'Event/Activity', label: 'Event/Activity' },
      { value: 'Pre-Marriage Orientation', label: 'Pre-Marriage Orientation' },
      { value: 'Usapan-Series', label: 'Usapan-Series' },
    ]),
    []
  );

  const statusOptions = useMemo(
    () => ([
      { value: 'UPCOMING', label: 'Upcoming' },
      { value: 'ONGOING', label: 'Ongoing' },
      { value: 'FINISHED', label: 'Finished' },
      { value: 'CANCELLED', label: 'Cancelled' }
    ]),
    []
  );

  const locationOptions = useMemo(() => {
    const set = new Set();
    (visibleEvents || []).forEach((ev) => {
      const loc = ev?.location || ev?.barangay;
      const value = String(loc || '').trim();
      if (value) set.add(value);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ value: v, label: v }));
  }, [visibleEvents]);

  const filteredEvents = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const lq = locationQuery.trim().toLowerCase();
    const selectedDay = sidebarDate ? normalizeDay(sidebarDate) : null;

    return sortedEventsForList.filter((ev) => {
      const matchesType = typeFilter ? String(ev.type) === String(typeFilter) : true;

      const status = getEventStatus(ev, new Date());
      const matchesStatus = statusFilter ? status === statusFilter : true;

      const title = String(ev.title || ev.type || '').toLowerCase();
      const loc = String(ev.location || ev.barangay || '').toLowerCase();
      const counselorName = String(ev.counselor || '').toLowerCase();
      const lead = String(ev.lead || '').toLowerCase();
      const desc = String(ev.description || '').toLowerCase();
      const barangay = String(ev.barangay || '').toLowerCase();

      const haystack = [
        title,
        loc,
        counselorName,
        lead,
        desc,
        barangay,
        String(ev.type || '').toLowerCase(),
        String(ev.status || '').toLowerCase()
      ].join(' ');

      const matchesKeyword = q ? haystack.includes(q) : true;
      const matchesLocation = lq ? loc.includes(lq) : true;

      let matchesDate = true;
      if (selectedDay) {
        const s = normalizeDay(ev.startDate);
        const e = ev.endDate ? normalizeDay(ev.endDate) : s;
        matchesDate = !(selectedDay.isBefore(s, 'day') || selectedDay.isAfter(e, 'day'));
      }

      return matchesType && matchesStatus && matchesKeyword && matchesLocation && matchesDate;
    });
  }, [sortedEventsForList, keyword, locationQuery, typeFilter, statusFilter, sidebarDate]);

  useEffect(() => {
    setPage(1);
  }, [keyword, locationQuery, typeFilter, statusFilter, sidebarDate]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((filteredEvents.length || 0) / pageSize);
    return n > 0 ? n : 1;
  }, [filteredEvents.length]);

  const pagedEvents = useMemo(() => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, page, totalPages]);

  // Events that occur within the visible month (overlap by date range)
  const monthEvents = useMemo(() => {
    const start = dayjs(month).startOf('month');
    const end = dayjs(month).endOf('month');
    return (visibleEvents || []).filter((ev) => {
      const s = dayjs(ev.startDate).startOf('day');
      const e = ev.endDate ? dayjs(ev.endDate).startOf('day') : s;
      return !(e.isBefore(start, 'day') || s.isAfter(end, 'day'));
    });
  }, [visibleEvents, month]);

  // Selection is tracked by the type-qualified event key, not the raw id.
  // The API returns each source table's own primary key as `id`, so a PMO
  // schedule and an announcement can share the same id; comparing bare ids
  // resolved to the wrong event and left the details modal empty.
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return selectedEvents.find((ev) => getEventKey(ev) === selectedEventId) || null;
  }, [selectedEventId, selectedEvents]);

  const selectedEventForList = useMemo(() => {
    if (!selectedEventId) return null;
    return sortedEventsForList.find((ev) => getEventKey(ev) === selectedEventId) || null;
  }, [selectedEventId, sortedEventsForList]);

  const sidebarEvents = useMemo(() => {
    if (!sidebarPopupDate) return [];
    return eventsByDate[toDayKey(sidebarPopupDate)] || [];
  }, [eventsByDate, sidebarPopupDate]);

  const calendarWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < gridDays.length; i += 7) {
      weeks.push(gridDays.slice(i, i + 7));
    }
    return weeks;
  }, [gridDays]);

  const handleDayClick = (date) => {
    const dayEvents = eventsByDate[toDayKey(date)] || [];
    if (dayEvents.length === 0) {
      return;
    }
    setSelectedDate(date);
    setSelectedEventId(dayEvents.length === 1 ? getEventKey(dayEvents[0]) : null);
    setModalOpened(true);
  };

  const handleEventClick = (ev) => {
    setSelectedDate(null);
    setSelectedEventId(getEventKey(ev));
    setModalOpened(true);
  };

  const openEditForEvent = (ev) => {
    if (!ev) return;
    const startParts = to12hParts(ev.startDate);
    const endParts = to12hParts(ev.endDate || ev.startDate);
    editForm.setValues({
      title: ev.title || '',
      type: ev.type,
      date: ev.startDate ? new Date(ev.startDate) : null,
      startHour: startParts.hour,
      startMinute: startParts.minute,
      startMeridiem: startParts.meridiem,
      endHour: endParts.hour,
      endMinute: endParts.minute,
      endMeridiem: endParts.meridiem,
      counselorID: ev.counselorID || null,
      barangay: ev.type === 'Usapan-Series' ? (ev.location || '') : '',
      location: ev.type === 'Pre-Marriage Orientation' ? (ev.location || '') : '',
      status: ev.status || 'Scheduled',
      description: ev.description || '',
      details: ev.details || ''
    });
    editForm.resetDirty();
    setEditModalOpened(true);
  };

  return (
    <div className="sf-page sf-cal">
      <div className="sf-cal__container">
        <div className="sf-cal__grid">
          <div className="sf-cal__main">
            <header className="sf-cal__head">
              <div className="sf-cal__headrow">
                <h1 className="sf-cal__title">Schedule of Activities</h1>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn-primary sf-btn--sm sf-cal__add"
                    onClick={() => setAddModalOpened(true)}
                  >
                    Add Schedule
                  </button>
                )}
              </div>
              <hr className="sf-cal__rule" />
              <p className="sf-cal__lede">
                Upcoming programs, orientations and community activities of the Municipal Office of Population.
              </p>
            </header>

            <div className="sf-cal__controls">
              <div className="sf-cal__monthbar">
                <button
                  type="button"
                  className="btn-secondary sf-btn--sm"
                  onClick={() => setMonth(new Date())}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="sf-cal__nav"
                  aria-label="Previous month"
                  onClick={() => setMonth(dayjs(month).subtract(1, 'month').toDate())}
                >
                  <IconChevronLeft width={18} height={18} aria-hidden="true" />
                </button>
                <span className="sf-cal__month">{dayjs(month).format('MMMM YYYY')}</span>
                <button
                  type="button"
                  className="sf-cal__nav"
                  aria-label="Next month"
                  onClick={() => setMonth(dayjs(month).add(1, 'month').toDate())}
                >
                  <IconChevronRight width={18} height={18} aria-hidden="true" />
                </button>
              </div>

              <div className="sf-cal__filters">
                <Select
                  className="sf-cal__select"
                  placeholder="Location"
                  data={locationOptions}
                  value={locationQuery || null}
                  onChange={(v) => setLocationQuery(v || '')}
                  searchable
                  clearable
                  nothingFoundMessage="No locations"
                />
                <Select
                  className="sf-cal__select"
                  placeholder="Select Event Type"
                  data={typeOptions}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  searchable
                  clearable
                />
                <Select
                  className="sf-cal__select"
                  placeholder="Status"
                  data={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  clearable
                />
              </div>
            </div>

            <p className="sf-cal__total">Total Events: {filteredEvents.length}</p>
            {loading ? (
              <Center>
                <Loader size="sm" />
              </Center>
            ) : filteredEvents.length === 0 ? (
              <div className="sf-cal__empty">No activities found for the selected filters.</div>
            ) : (
              <div className="sf-cal__list">
                {pagedEvents.map((ev) => {
                  const statusToken = getStatusToken(getEventStatus(ev, new Date()));
                  const typeToken = getEventTypeToken(ev);
                  const start = dayjs(ev.startDate);
                  const end = ev.endDate ? dayjs(ev.endDate) : null;
                  const dateLabel = !end || end.isSame(start, 'day')
                    ? start.format('MMM D, YYYY')
                    : `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
                  const type = ev.type || 'Event/Activity';
                  const isUsapanSeries = String(type).toUpperCase() === 'USAPAN-SERIES';
                  const timeLabel = isUsapanSeries
                    ? start.format('h:mm A')
                    : (!end
                        ? start.format('h:mm A')
                        : `${start.format('h:mm A')} - ${end.format('h:mm A')}`);

                  return (
                    <button
                      key={getEventKey(ev)}
                      type="button"
                      className="sf-cal-event"
                      onClick={() => handleEventClick(ev)}
                    >
                      <span
                        className="sf-cal-event__avatar"
                        style={{ background: typeToken.bg, color: typeToken.fg }}
                      >
                        {getTypeInitials(type)}
                      </span>
                      <span className="sf-cal-event__body">
                        <span className="sf-cal-event__title">{ev.title || type}</span>
                        <span className="sf-cal-event__meta">
                          <span className="sf-cal-event__meta-item">
                            <IconMapPin width={16} height={16} aria-hidden="true" />
                            {ev.location || ev.barangay || '—'}
                          </span>
                          <span className="sf-cal-event__meta-item">
                            <IconCalendar width={16} height={16} aria-hidden="true" />
                            {dateLabel}
                          </span>
                          <span className="sf-cal-event__meta-item">
                            <IconClock width={16} height={16} aria-hidden="true" />
                            {timeLabel}
                          </span>
                        </span>
                      </span>
                      <span
                        className="sf-cal-status"
                        style={{ background: statusToken.bg, color: statusToken.fg }}
                      >
                        <span
                          className="sf-cal-status__dot"
                          style={{ background: statusToken.dot }}
                        />
                        {statusToken.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && filteredEvents.length > pageSize ? (
              <Group justify="center" mt="lg">
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={(value) => {
                    setPage(value);
                    // Smoothly scroll back to top of the page after changing page
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </Group>
            ) : null}
          </div>

          <aside className="sf-cal__aside" aria-label="Schedule filters and legends">
            <div className="sf-cal-card">
              <h2 className="sf-cal-card__title">Calendar View</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  // Re-opening starts from a clean slate unless a day is already
                  // pinned, so the button label always matches what is applied.
                  if (sidebarDate) setSidebarPopupDate(sidebarDate);
                  setSidebarPickerOpened(true);
                }}
              >
                <IconCalendar width={16} height={16} aria-hidden="true" />
                {sidebarDate ? dayjs(sidebarDate).format('MMMM D, YYYY') : 'Open calendar'}
              </button>
              {sidebarDate && (
                <button
                  type="button"
                  className="sf-cal__cleardate"
                  onClick={() => {
                    setSidebarDate(null);
                    setSidebarPopupDate(null);
                  }}
                >
                  Clear selected date
                </button>
              )}
            </div>

            <div className="sf-cal-card">
              <h2 className="sf-cal-card__title">Event Type Legends</h2>
              <ul className="sf-cal-typelist">
                {EVENT_TYPE_LEGEND.map((token) => (
                  <li key={token.key}>
                    <span
                      className="sf-cal-typelist__dot"
                      style={{
                        background: getSwatchFill(token),
                        borderColor: token.fg,
                      }}
                    />
                    <span className="sf-cal-typelist__label">{token.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sf-cal-card">
              <h2 className="sf-cal-card__title">Status Legends</h2>
              <ul className="sf-cal-statuslist">
                {STATUS_LEGEND.map((token) => (
                  <li key={token.key}>
                    <span className="sf-cal-status" style={{ background: token.bg, color: token.fg }}>
                      <span className="sf-cal-status__dot" style={{ background: token.dot }} />
                      {token.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sf-cal-card">
              <h2 className="sf-cal-card__title">Population Office Location</h2>
              <iframe
                className="sf-cal__map"
                title="Map showing the San Fabian Population Office location"
                src="https://www.google.com/maps?q=16.120723263859666,120.40280245009167&z=15&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </aside>
        </div>
      </div>
      
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedEventId(null);
          setSelectedDate(null);
        }}
        title={
          <Text fw={700} size="lg">
            {selectedDate ? `Events for ${dayjs(selectedDate).format('MMMM D, YYYY')}` : 'Event Details'}
          </Text>
        }
        centered
        size="md"
        radius="md"
        classNames={{ content: 'sf-cal-modal' }}
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <Stack gap="md">
          {selectedDate && !selectedEvent && selectedEvents.length > 1 ? (
            <Stack gap="sm">
              <Text size="sm" c="dimmed">Multiple activities scheduled for this day:</Text>
              {selectedEvents.map((ev) => (
                <button
                  key={getEventKey(ev)}
                  type="button"
                  className="sf-cal-card"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderLeft: `3px solid ${getEventTypeToken(ev).dot}`,
                  }}
                  onClick={() => setSelectedEventId(getEventKey(ev))}
                >
                  <IconInfoCircle width={16} height={16} aria-hidden="true" />
                  {ev.title || ev.type}
                </button>
              ))}
            </Stack>
          ) : (
            (() => {
              const ev = selectedEvent || (selectedEvents.length === 1 ? selectedEvents[0] : selectedEventForList);
              if (!ev) return <Text size="sm" c="dimmed" ta="center">No details found.</Text>;

              const status = getEventStatus(ev);
              const statusToken = getStatusToken(status);
              const typeToken = getEventTypeToken(ev);
              const start = dayjs(ev.startDate);
              const rawEnd = ev.endDate ? dayjs(ev.endDate) : null;
              const end = !rawEnd || rawEnd.isSame(start) ? start.add(1, 'hour') : rawEnd;
              const typeUpper = String(ev.type || '').toUpperCase();
              const isUsapanSeries = typeUpper === 'USAPAN-SERIES';
              const isPmo = typeUpper === 'PRE-MARRIAGE ORIENTATION';
              const canBookPmo = isPmo && status !== 'FINISHED';

              return (
                <Stack gap="lg">
                  <Box>
                    {selectedEvents.length > 1 && (
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        leftSection={<IconChevronLeft size={14} />}
                        onClick={() => setSelectedEventId(null)}
                        mb="xs"
                      >
                        Back to list
                      </Button>
                    )}
                    <Group justify="space-between" align="flex-start">
                      <Title order={3} style={{ lineHeight: 1.2, color: typeToken.fg }}>
                        {ev.type}
                      </Title>
                      <span
                        className="sf-cal-status"
                        style={{ background: statusToken.bg, color: statusToken.fg }}
                      >
                        <span
                          className="sf-cal-status__dot"
                          style={{ background: statusToken.dot }}
                        />
                        {statusToken.label}
                      </span>
                    </Group>
                  </Box>

                  <Divider />

                  <Stack gap="sm">
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <ThemeIcon variant="light" color="gray" size="md" radius="md">
                        <IconCalendar size={18} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed" fw={500}>DATE</Text>
                        <Text size="sm" fw={600}>
                          {start.format('MMMM D, YYYY')}
                          {end && !end.isSame(start, 'day') ? ` â€” ${end.format('MMMM D, YYYY')}` : ''}
                        </Text>
                      </Box>
                    </Group>

                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <ThemeIcon variant="light" color="gray" size="md" radius="md">
                        <IconClock size={18} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed" fw={500}>TIME</Text>
                        <Text size="sm" fw={600}>
                          {isUsapanSeries
                            ? start.format('h:mm A')
                            : start.format('h:mm A')}
                        </Text>
                      </Box>
                    </Group>

                    {ev.location && (
                      <Group wrap="nowrap" align="flex-start" gap="sm">
                        <ThemeIcon variant="light" color="red" size="md" radius="md">
                          <IconMapPin size={18} />
                        </ThemeIcon>
                        <Box>
                          <Text size="xs" c="dimmed" fw={500}>LOCATION</Text>
                          <Text size="sm" fw={600}>{ev.location}</Text>
                        </Box>
                      </Group>
                    )}

                    {ev.counselor && (
                      <Group wrap="nowrap" align="flex-start" gap="sm">
                        <ThemeIcon variant="light" color="blue" size="md" radius="md">
                          <IconUser size={18} />
                        </ThemeIcon>
                        <Box>
                          <Text size="xs" c="dimmed" fw={500}>ASSIGNED COUNSELOR</Text>
                          <Text size="sm" fw={600}>{ev.counselor}</Text>
                        </Box>
                      </Group>
                    )}
                  </Stack>

                  <Box p="sm" style={{ backgroundColor: theme.colors.gray[0], borderRadius: theme.radius.md }}>
                    <Text size="xs" fw={700} c="dimmed" mb={4}>DESCRIPTION</Text>
                    {ev.description && (
                      <Text size="sm" mb={ev.details ? 4 : 0}>{ev.description}</Text>
                    )}
                    {ev.details && (
                      <Text size="sm">{ev.details}</Text>
                    )}
                    {!ev.description && !ev.details && (
                      <Text size="sm" align="justify">
                        {(() => {
                          const t = typeUpper;
                          if (t === 'USAPAN-SERIES') {
                            return 'A family planning demand-generation program developed by the Commission on Population and Development in the Philippines. It uses conversational, participatory methods (like group discussions and one-on-one counseling) to link reproductive health information with actual service delivery, including access to contraception and referrals.';
                          }
                          if (t === 'PRE-MARRIAGE ORIENTATION') {
                            return 'Pre-Marriage Orientation (PMO) is a mandatory half-day to full-day program for couples applying for a marriage license in the Philippines. It is designed to provide a realistic overview of marriage by covering essential topics such as the concept of marriage, husband-wife relationships, parent-child dynamics, family and home management, fertility awareness, and responsible parenthood.';
                          }
                          return '-';
                        })()}
                      </Text>
                    )}
                  </Box>

                  {isPmo && (
                    <Group justify="flex-end" mt="sm">
                      <Button
                        className="sf-btn-navy"
                        component="a"
                        href={canBookPmo ? '/services?book=pmo' : undefined}
                        target="_self"
                        disabled={!canBookPmo}
                      >
                        Book An Appointment
                      </Button>
                    </Group>
                  )}

                  {/* Admin Controls removed for public calendar view */}
                </Stack>
              );
            })()
          )}
        </Stack>
      </Modal>

      <Modal
        opened={sidebarPickerOpened}
        onClose={() => setSidebarPickerOpened(false)}
        withCloseButton={false}
        centered
        size="lg"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <Stack gap="sm">
          <div className="sf-cal-mini__bar">
            <button
              type="button"
              className="sf-cal__nav"
              aria-label="Previous month"
              onClick={() => setSidebarMonth(dayjs(sidebarMonth).subtract(1, 'month').toDate())}
            >
              <IconChevronLeft width={18} height={18} aria-hidden="true" />
            </button>
            <span className="sf-cal-mini__month" aria-live="polite">
              {dayjs(sidebarMonth).format('MMMM YYYY')}
            </span>
            <button
              type="button"
              className="sf-cal__nav"
              aria-label="Next month"
              onClick={() => setSidebarMonth(dayjs(sidebarMonth).add(1, 'month').toDate())}
            >
              <IconChevronRight width={18} height={18} aria-hidden="true" />
            </button>

            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label="Close popup calendar"
              onClick={() => setSidebarPickerOpened(false)}
            >
              <IconX size={16} />
            </ActionIcon>
          </div>

          <div className="sf-cal-mini__dows" aria-hidden="true">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="sf-cal-mini__grid" role="grid">
            {gridDays.map((date) => {
              const d = dayjs(date);
              const isCurrentMonth = d.isSame(dayjs(sidebarMonth), 'month');
              const isSelected = !!sidebarPopupDate && d.isSame(dayjs(sidebarPopupDate), 'day');
              const isToday = d.isSame(dayjs(), 'day');
              const key = toDayKey(date);
              const dayEvents = eventsByDate[key] || [];
              const hasEvents = dayEvents.length > 0;

              // One swatch drives the whole tile, straight from the shared
              // tokens: a single type paints its soft background, a mix of
              // types paints the shared gradient, and an empty day stays plain.
              const dayToken = getDayColor({ events: dayEvents });
              const typeTokens = getDistinctEventTypesForEvents(dayEvents);

              const classNames = [
                'sf-cal-mini__day',
                !isCurrentMonth && 'sf-cal-mini__day--outside',
                hasEvents && 'sf-cal-mini__day--has-events',
                isToday && 'sf-cal-mini__day--today',
                isSelected && 'sf-cal-mini__day--selected',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  className={classNames}
                  aria-label={`${d.format('MMMM D, YYYY')}${hasEvents ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ', no events'}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSidebarPopupDate(date);
                    // Selecting a day is what the "Calendar View" button
                    // reports and what filters the list below it.
                    setSidebarDate(date);
                  }}
                  style={{
                    background: getSwatchFill(dayToken) || 'transparent',
                    color: dayToken ? dayToken.fg : 'var(--sf-slate)',
                    // Same hairline as the legend swatch, so a tinted day and
                    // its legend entry read as the same colour chip.
                    borderColor: dayToken ? dayToken.fg : 'transparent',
                  }}
                >
                  <span className="sf-cal-mini__daynum">{d.date()}</span>
                  {typeTokens.length > 0 && (
                    <span className="sf-cal-mini__dots">
                      {typeTokens.map((token) => (
                        <span
                          key={token.key}
                          className="sf-cal-mini__dot"
                          style={{ background: token.dot }}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Divider my="xs" />

          {/* Always-on legend: the tile colours above are only meaningful if
              the swatches that produced them are visible, so this is shown for
              every month rather than only when a mixed-type day is selected. */}
          <ul className="sf-cal-mini__legend">
            {CALENDAR_TYPE_LEGEND.map((token) => (
              <li key={token.key}>
                <span
                  className="sf-cal-typelist__dot"
                  style={{
                    background: getSwatchFill(token),
                    borderColor: token.fg,
                  }}
                />
                <span>{token.label}</span>
              </li>
            ))}
          </ul>

          <Divider my="xs" />

          <Box style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
            {sidebarPopupDate && sidebarEvents.length > 0 ? (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Showing all {sidebarEvents.length} event
                  {sidebarEvents.length > 1 ? 's' : ''} for{' '}
                  {dayjs(sidebarPopupDate).format('MMMM D, YYYY')}
                </Text>
                {sidebarEvents.map((ev) => {
                  const typeColor = getEventColor(ev);
                  const start = dayjs(ev.startDate);
                  const end = ev.endDate ? dayjs(ev.endDate) : null;
                  const isUsapanSeries = String(ev.type || '').toUpperCase() === 'USAPAN-SERIES';
                  const timeLabel = isUsapanSeries
                    ? start.format('h:mm A')
                    : (!end
                        ? start.format('h:mm A')
                        : `${start.format('h:mm A')} - ${end.format('h:mm A')}`);
                  const location = ev.location || ev.barangay || 'â€”';

                  const isHovered = sidebarHoverEventId === getEventKey(ev);

                  return (
                    <button
                      key={getEventKey(ev)}
                      type="button"
                      className="border-0 bg-transparent w-100 text-start p-0"
                      onClick={() => {
                        setSidebarPickerOpened(false);
                        handleEventClick(ev);
                      }}
                      onMouseEnter={() => setSidebarHoverEventId(getEventKey(ev))}
                      onMouseLeave={() => setSidebarHoverEventId(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Box
                        style={{
                          borderRadius: 10,
                          padding: 10,
                          border: `1px solid ${theme.colors.gray[3]}`,
                          backgroundColor: isHovered ? theme.colors.gray[0] : theme.white,
                          boxShadow: isHovered ? '0 3px 10px rgba(0,0,0,0.12)' : 'none',
                          transition: 'background-color 120ms ease, box-shadow 120ms ease',
                        }}
                      >
                        <Text fw={600} size="sm" mb={4}>
                          {ev.title || ev.type}
                        </Text>
                        <Group justify="space-between" gap="xs" align="center">
                          <Group gap={6} align="center">
                            <span
                              className="sf-cal-status__dot"
                              style={{ background: typeColor.dot }}
                            />
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {location}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {timeLabel}
                          </Text>
                        </Group>
                      </Box>
                    </button>
                  );
                })}
              </Stack>
            ) : (
              <Center py="md">
                <Text size="sm" c="dimmed">
                  {sidebarPopupDate
                    ? 'No events scheduled for this date.'
                    : 'Pick a date to see its events.'}
                </Text>
              </Center>
            )}
          </Box>
        </Stack>
      </Modal>

      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        withCloseButton={false}
        centered
        size="xl"
        radius="md"
        classNames={{ content: 'sf-cal-modal' }}
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form
          onSubmit={editForm.onSubmit(async (values) => {
            if (!selectedEventId) return;
            if (!values.date) return;
            // selectedEventId is the type-qualified key, but the API routes by
            // the source table's own primary key, so send the raw id.
            const targetId = selectedEvent?.id;
            if (targetId == null) return;

            const today = dayjs();
            const dateStr = dayjs(values.date).format('YYYY-MM-DD');
            const startTime = to24hTime(values.startHour, values.startMinute, values.startMeridiem);
            const endTime = values.type === 'Usapan-Series'
              ? null
              : to24hTime(values.endHour, values.endMinute, values.endMeridiem);

            const startDateTime = dayjs(`${dateStr}T${startTime}`);
            if (startDateTime.isBefore(today)) {
              editForm.setFieldError('date', 'Past dates and times cannot be selected.');
              showNotification({ title: 'Invalid schedule', message: 'Past dates and times cannot be selected.', color: 'red' });
              return;
            }

            if (values.type !== 'Usapan-Series' && compareTimes24(startTime, endTime) <= 0) {
              editForm.setFieldError('endHour', 'End time must be after start time');
              return;
            }

            const payload = {
              type: values.type,
              date: dayjs(values.date).format('YYYY-MM-DD'),
              startTime,
              endTime,
              counselorID: values.type === 'Pre-Marriage Orientation' ? values.counselorID : null,
              lead: null,
              barangay: values.type === 'Usapan-Series' ? values.barangay : null,
              location: values.type === 'Pre-Marriage Orientation' ? (values.location || null) : null,
              status: values.status
            };

            try {
              await updateCalendarEvent(targetId, payload);
              showNotification({ title: 'Saved', message: 'Event updated successfully', color: 'green' });
              setEditModalOpened(false);
              await fetchEvents(month);
            } catch (err) {
              console.error(err);
              const msg = err?.response?.data?.error?.message || 'Failed to update event';
              showNotification({ title: 'Error', message: msg, color: 'red' });
            }
          })}
        >
          <div className="sf-cal-form">
            <div className="sf-cal-form__aside">
              <p className="sf-cal-form__eyebrow">Schedule Preview</p>
              <Stack gap="sm">
                <div className="sf-cal-form__preview-date">
                  {editForm.values.date ? dayjs(editForm.values.date).format('MMMM D, YYYY') : ''}
                </div>

                <dl className="sf-cal-form__preview-row">
                  <dt>Type</dt>
                  <dd>{editForm.values.type}</dd>
                </dl>

                <dl className="sf-cal-form__preview-row">
                  <dt>Time</dt>
                  <dd>
                    {editForm.values.startHour}:{editForm.values.startMinute}{' '}
                    {editForm.values.startMeridiem}
                    {editForm.values.type !== 'Usapan-Series' && editForm.values.endHour && editForm.values.endMinute
                      ? ` – ${editForm.values.endHour}:${editForm.values.endMinute} ${editForm.values.endMeridiem}`
                      : ''}
                  </dd>
                </dl>

                {editForm.values.type === 'Usapan-Series' && editForm.values.barangay ? (
                  <dl className="sf-cal-form__preview-row">
                    <dt>Barangay</dt>
                    <dd>{editForm.values.barangay}</dd>
                  </dl>
                ) : null}

                {editForm.values.type === 'Pre-Marriage Orientation' && editForm.values.location ? (
                  <dl className="sf-cal-form__preview-row">
                    <dt>Location</dt>
                    <dd>{editForm.values.location}</dd>
                  </dl>
                ) : null}

                <div>
                  <Badge
                    className="sf-cal-status"
                    style={{
                      background: getScheduleStateToken(editForm.values.status).bg,
                      color: getScheduleStateToken(editForm.values.status).fg,
                    }}
                  >
                    <span
                      className="sf-cal-status__dot"
                      style={{ background: getScheduleStateToken(editForm.values.status).dot }}
                    />
                    {editForm.values.status}
                  </Badge>
                </div>
              </Stack>
            </div>

            <div className="sf-cal-form__main">
              <div className="sf-cal-form__head">
                <div>
                  <p className="sf-cal-form__eyebrow">Calendar Schedule</p>
                  <h2 className="sf-cal-form__title">Edit Schedule</h2>
                </div>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  aria-label="Close edit schedule dialog"
                  onClick={() => setEditModalOpened(false)}
                >
                  <IconX size={18} />
                </ActionIcon>
              </div>

              <Stack>
                {editForm.values.type === 'Usapan-Series' ? (
                  <Select
                    label="Barangay"
                    placeholder="Select barangay"
                    data={SAN_FABIAN_BARANGAYS.map((b) => ({ value: b, label: b }))}
                    value={editForm.values.barangay || null}
                    onChange={(v) => editForm.setFieldValue('barangay', v || '')}
                    searchable
                    nothingFoundMessage="No barangays"
                    error={editForm.errors.barangay}
                  />
                ) : (
                  <TextInput
                    label="Title"
                    placeholder={editForm.values.type === 'Pre-Marriage Orientation' ? 'Automatically set to empty' : ''}
                    disabled={editForm.values.type === 'Pre-Marriage Orientation'}
                    {...editForm.getInputProps('title')}
                  />
                )}
                <Select
                  label="Type"
                  data={[
                    { value: 'Pre-Marriage Orientation', label: 'Pre-Marriage Orientation' },
                    { value: 'Usapan-Series', label: 'Usapan-Series' },
                  ]}
                  value={editForm.values.type}
                  disabled
                />
                <DatePickerInput
                  label="Date"
                  required
                  value={editForm.values.date}
                  onChange={(value) => editForm.setFieldValue('date', value)}
                  firstDayOfWeek={0}
                />

                <Stack gap={10}>
                  <Stack gap={6}>
                    <Text className="sf-cal-form__label">Start time</Text>
                    <div className="sf-cal-form__time">
                      <Select aria-label="Start hour" data={HOURS_12} value={editForm.values.startHour} onChange={(v) => editForm.setFieldValue('startHour', v)} />
                      <span className="sf-cal-form__time-sep" aria-hidden="true">:</span>
                      <Select aria-label="Start minute" data={MINUTES_COMMON} value={editForm.values.startMinute} onChange={(v) => editForm.setFieldValue('startMinute', v)} />
                      <Select aria-label="Start AM/PM" data={MERIDIEMS} value={editForm.values.startMeridiem} onChange={(v) => editForm.setFieldValue('startMeridiem', v)} />
                    </div>
                  </Stack>

                  {editForm.values.type !== 'Usapan-Series' ? (
                    <Stack gap={6}>
                      <Text className="sf-cal-form__label">End time</Text>
                      <div className="sf-cal-form__time">
                        <Select aria-label="End hour" data={HOURS_12} value={editForm.values.endHour} onChange={(v) => editForm.setFieldValue('endHour', v)} />
                        <span className="sf-cal-form__time-sep" aria-hidden="true">:</span>
                        <Select aria-label="End minute" data={MINUTES_COMMON} value={editForm.values.endMinute} onChange={(v) => editForm.setFieldValue('endMinute', v)} />
                        <Select aria-label="End AM/PM" data={MERIDIEMS} value={editForm.values.endMeridiem} onChange={(v) => editForm.setFieldValue('endMeridiem', v)} />
                      </div>
                      {editForm.errors.endHour && <p className="sf-cal-form__error">{editForm.errors.endHour}</p>}
                    </Stack>
                  ) : null}
                </Stack>

                {editForm.values.type === 'Pre-Marriage Orientation' ? (
                  <Select
                    label="Counselor"
                    required
                    data={(activeCounselors || []).map((c) => ({ value: String(c.id), label: c.name }))}
                    value={editForm.values.counselorID ? String(editForm.values.counselorID) : null}
                    onChange={(v) => editForm.setFieldValue('counselorID', v ? Number(v) : null)}
                    searchable
                    nothingFoundMessage="No counselors"
                  />
                ) : null}
                {editForm.values.type === 'Pre-Marriage Orientation' ? (
                  <TextInput
                    label="Location"
                    placeholder="Enter specific venue or room"
                    {...editForm.getInputProps('location')}
                  />
                ) : null}

                <Select
                  label="Status"
                  data={[
                    { value: 'Scheduled', label: 'Scheduled' },
                    { value: 'Ongoing', label: 'Ongoing' },
                    { value: 'Finished', label: 'Finished' },
                    { value: 'Cancelled', label: 'Cancelled' }
                  ]}
                  value={editForm.values.status}
                  disabled
                />

                <div className="sf-cal-form__actions">
                  <Button variant="default" type="button" onClick={() => setEditModalOpened(false)}>
                    Cancel
                  </Button>
                  <Button className="sf-btn-navy" type="submit">Save Changes</Button>
                </div>
              </Stack>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        withCloseButton={false}
        centered
        size="xl"
        padding={0}
        zIndex={1000}
        classNames={{ content: 'sf-calsched' }}
        overlayProps={{ backgroundOpacity: 0.5, blur: 0, transitionProps: { duration: 150 } }}
        transitionProps={{ transition: 'fade', duration: 150 }}
        /* Esc to close, focus trap and focus return are Mantine defaults
           (closeOnEscape / trapFocus / returnFocus all true), left as-is. */
      >
        <form
          onSubmit={addForm.onSubmit(async (values) => {
            if (!values.date) return;

            const normalizedStatus = values.status === 'Upcoming' ? 'Scheduled' : values.status;
            const today = dayjs();
            const dateStr = dayjs(values.date).format('YYYY-MM-DD');
            const startTime = to24hTime(values.startHour, values.startMinute, values.startMeridiem);
            const endTime = values.type === 'Usapan-Series'
              ? null
              : to24hTime(values.endHour, values.endMinute, values.endMeridiem);

            const startDateTime = dayjs(`${dateStr}T${startTime}`);
            if (startDateTime.isBefore(today)) {
              addForm.setFieldError('date', 'Past dates and times cannot be selected.');
              showNotification({ title: 'Invalid schedule', message: 'Past dates and times cannot be selected.', color: 'red' });
              return;
            }

            // For Usapan-Series, end time is required (backend will reject if missing)
            if (values.type === 'Usapan-Series' && !endTime) {
              addForm.setFieldError('endHour', 'End time is required for Usapan-Series.');
              showNotification({ title: 'Invalid schedule', message: 'End time is required for Usapan-Series.', color: 'red' });
              return;
            }

            if (values.type !== 'Usapan-Series' && compareTimes24(startTime, endTime) <= 0) {
              addForm.setFieldError('endHour', 'End time must be after start time');
              return;
            }

            try {
              if (values.type === 'Event/Activity') {
                // Create via Announcements endpoint using announcements schema
                let annPayload = {
                  title: values.title,
                  description: values.description,
                  date: dayjs(values.date).format('YYYY-MM-DD'),
                  location: values.location,
                  status: normalizedStatus,
                  lead: values.lead,
                  startTime: startTime,
                  endTime: endTime,
                };
                annPayload = Object.fromEntries(
                  Object.entries(annPayload).filter(([, v]) => v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === ''))
                );
                await createAnnouncement(annPayload);
                showNotification({ title: 'Saved', message: 'Event/Activity created in Announcements', color: 'green' });
              } else {
                // Build payload for calendar endpoint
                let payload = {
                  type: values.type,
                  date: dayjs(values.date).format('YYYY-MM-DD'),
                  startTime,
                  endTime,
                  status: normalizedStatus,
                  description: values.description || null
                };
                if (values.type === 'Pre-Marriage Orientation') {
                  payload.counselorID = values.counselorID;
                  if (values.location) payload.location = values.location;
                } else if (values.type === 'Usapan-Series') {
                  if (values.barangay) payload.barangay = values.barangay;
                }
                payload = Object.fromEntries(
                  Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === ''))
                );
                await createCalendarEvent(payload);
                showNotification({ title: 'Saved', message: 'Schedule created successfully', color: 'green' });
              }
              setAddModalOpened(false);
              addForm.reset();
              await fetchEvents(month);
            } catch (err) {
              const raw = err?.response?.data;
              let serverMsg = raw?.message ?? raw?.error ?? err?.message ?? 'Failed to create schedule';
              if (typeof serverMsg !== 'string') {
                try {
                  serverMsg = JSON.stringify(serverMsg);
                } catch (_) {
                  serverMsg = String(serverMsg);
                }
              }
              console.error('Create schedule failed:', serverMsg, raw);
              showNotification({ title: 'Error', message: serverMsg, color: 'red' });
            }
          })}
        >
          <div className="sf-calsched__shell">
            <div className="sf-calsched__preview">
              <p className="sf-calsched__preview-eyebrow">Schedule Preview</p>
              <p
                className={[
                  'sf-calsched__preview-date',
                  !addForm.values.date && 'sf-calsched__preview-date--empty',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {addForm.values.date
                  ? dayjs(addForm.values.date).format('MMMM D, YYYY')
                  : 'No date selected'}
              </p>

              <dl className="sf-calsched__preview-list">
                <dt>Type</dt>
                <dd>{addForm.values.type}</dd>
                <dt>Time</dt>
                <dd>
                  {addForm.values.startHour}:{addForm.values.startMinute}{' '}
                  {addForm.values.startMeridiem}
                  {addForm.values.endHour && addForm.values.endMinute
                    ? ` – ${addForm.values.endHour}:${addForm.values.endMinute} ${addForm.values.endMeridiem}`
                    : ''}
                </dd>
              </dl>

              <span
                className="sf-cal-status"
                style={{
                  background: getScheduleStateToken(addForm.values.status).bg,
                  color: getScheduleStateToken(addForm.values.status).fg,
                }}
              >
                <span
                  className="sf-cal-status__dot"
                  style={{ background: getScheduleStateToken(addForm.values.status).dot }}
                />
                {addForm.values.status}
              </span>
            </div>

            <div className="sf-calsched__form">
              <div className="sf-calsched__header">
                <div>
                  <p className="sf-calsched__eyebrow">Calendar Schedule</p>
                  <h2 className="sf-calsched__title">Add Schedule</h2>
                </div>
                <button
                  type="button"
                  className="sf-calsched__close"
                  aria-label="Close"
                  onClick={() => setAddModalOpened(false)}
                >
                  <IconX size={20} />
                </button>
              </div>

              <div className="sf-calsched__body" ref={addBodyRef}>
                <div className="sf-calsched__grid">
                  <Select
                    className="sf-calsched__span-2"
                    label="Type"
                    data={[
                      { value: 'Pre-Marriage Orientation', label: 'Pre-Marriage Orientation' },
                      { value: 'Usapan-Series', label: 'Usapan-Series' },
                      { value: 'Event/Activity', label: 'Event/Activity' },
                    ]}
                    value={addForm.values.type}
                    onChange={(v) => addForm.setFieldValue('type', v)}
                    withinPortal
                    comboboxProps={{ withinPortal: true, zIndex: 1200 }}
                  />
                {addForm.values.type === 'Usapan-Series' && (
                  <Select
                    className="sf-calsched__span-2"
                    label="Barangay"
                    placeholder="Select barangay"
                    data={SAN_FABIAN_BARANGAYS.map((b) => ({ value: b, label: b }))}
                    value={addForm.values.barangay || null}
                    onChange={(v) => addForm.setFieldValue('barangay', v || '')}
                    searchable
                    nothingFoundMessage="No barangays"
                    error={addForm.errors.barangay}
                    withinPortal
                    comboboxProps={{ withinPortal: true, zIndex: 1200 }}
                  />
                )}
                {addForm.values.type === 'Pre-Marriage Orientation' && (
                  <>
                    <TextInput
                      className="sf-calsched__span-2"
                      label="Title"
                      placeholder="Automatically set to empty"
                      disabled
                      {...addForm.getInputProps('title')}
                    />
                    <TextInput
                      className="sf-calsched__span-2"
                      label="Location"
                      placeholder="Enter specific venue or room"
                      {...addForm.getInputProps('location')}
                    />
                  </>
                )}
                {addForm.values.type === 'Event/Activity' && (
                  <>
                    <TextInput
                      className="sf-calsched__span-2"
                      label="Title"
                      placeholder="Enter title"
                      required
                      {...addForm.getInputProps('title')}
                      error={addForm.errors.title}
                    />
                    <Textarea
                      className="sf-calsched__span-2"
                      label="Description"
                      placeholder="Enter description"
                      autosize
                      minRows={3}
                      maxRows={6}
                      {...addForm.getInputProps('description')}
                    />
                    <TextInput
                      label="Location"
                      placeholder="Enter location"
                      {...addForm.getInputProps('location')}
                    />
                    <TextInput
                      label="Lead"
                      placeholder="Enter lead person/office"
                      {...addForm.getInputProps('lead')}
                    />
                  </>
                )}
                <DatePickerInput
                  className="sf-calsched__span-2"
                  label="Date"
                  placeholder="Select date"
                  value={addForm.values.date}
                  onChange={(value) => addForm.setFieldValue('date', value)}
                  firstDayOfWeek={0}
                  error={addForm.errors.date}
                  minDate={new Date()}
                  popoverProps={{ withinPortal: true, zIndex: 1200 }}
                />

                <Stack className="sf-calsched__times" gap={10}>
                  <Stack className="sf-calsched__time-group" gap={6}>
                    <Text className="sf-calsched__label">Start time</Text>
                    <div className="sf-calsched__time">
                      <Select className="sf-calsched__time-part" aria-label="Start hour" data={HOURS_12} value={addForm.values.startHour} onChange={(v)=>addForm.setFieldValue('startHour', v)} withinPortal comboboxProps={{ withinPortal: true, zIndex: 1200 }} />
                      <span className="sf-calsched__time-sep" aria-hidden="true">:</span>
                      <Select className="sf-calsched__time-part" aria-label="Start minute" data={MINUTES_COMMON} value={addForm.values.startMinute} onChange={(v)=>addForm.setFieldValue('startMinute', v)} withinPortal comboboxProps={{ withinPortal: true, zIndex: 1200 }} />
                      <Select className="sf-calsched__time-part" aria-label="Start AM/PM" data={MERIDIEMS} value={addForm.values.startMeridiem} onChange={(v)=>addForm.setFieldValue('startMeridiem', v)} withinPortal comboboxProps={{ withinPortal: true, zIndex: 1200 }} />
                    </div>
                  </Stack>
                  <Stack className="sf-calsched__time-group" gap={6}>
                    <Text className="sf-calsched__label">End time</Text>
                    <div className="sf-calsched__time">
                      <Select className="sf-calsched__time-part" aria-label="End hour" data={HOURS_12} value={addForm.values.endHour} onChange={(v)=>addForm.setFieldValue('endHour', v)} withinPortal comboboxProps={{ withinPortal: true, zIndex: 1200 }} />
                      <span className="sf-calsched__time-sep" aria-hidden="true">:</span>
                      <Select className="sf-calsched__time-part" aria-label="End minute" data={MINUTES_COMMON} value={addForm.values.endMinute} onChange={(v)=>addForm.setFieldValue('endMinute', v)} withinPortal comboboxProps={{ withinPortal: true, zIndex: 1200 }} />
                      <Select className="sf-calsched__time-part" aria-label="End AM/PM" data={MERIDIEMS} value={addForm.values.endMeridiem} onChange={(v)=>addForm.setFieldValue('endMeridiem', v)} withinPortal comboboxProps={{ withinPortal: true, zIndex: 1200 }} />
                    </div>
                    {addForm.errors.endHour && <p className="sf-calsched__error">{addForm.errors.endHour}</p>}
                  </Stack>
                </Stack>

                {addForm.values.type === 'Pre-Marriage Orientation' ? (
                  <Select
                    className="sf-calsched__span-2"
                    label="Counselor"
                    placeholder="Select counselor"
                    required
                    data={(activeCounselors || []).map((c) => ({ value: String(c.id), label: c.name }))}
                    value={addForm.values.counselorID ? String(addForm.values.counselorID) : null}
                    onChange={(v) => addForm.setFieldValue('counselorID', v ? Number(v) : null)}
                    error={addForm.errors.counselorID}
                    withinPortal
                    comboboxProps={{ withinPortal: true, zIndex: 1200 }}
                  />
                ) : null}
                <Select
                  className="sf-calsched__span-2"
                  label="Status"
                  data={['Scheduled', 'Ongoing', 'Finished', 'Cancelled']}
                  value={addForm.values.status}
                  disabled
                  withinPortal
                  comboboxProps={{ withinPortal: true, zIndex: 1200 }}
                />
                </div>
              </div>

              <div className="sf-calsched__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAddModalOpened(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Schedule
                </button>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        opened={deleteEventId != null}
        onCancel={() => { if (!deleteLoading) setDeleteEventId(null); }}
        onConfirm={async () => {
          if (!deleteEventId) return;
          setDeleteLoading(true);
          try {
            await deleteCalendarEvent(deleteEventId);
            showNotification({ title: 'Deleted', message: 'Event deleted', color: 'green' });
            setDeleteEventId(null);
            setModalOpened(false);
            await fetchEvents(month);
          } catch (err) {
            const msg = err?.response?.data?.error?.message || 'Failed to delete event';
            showNotification({ title: 'Error', message: msg, color: 'red' });
          } finally {
            setDeleteLoading(false);
          }
        }}
        confirmLabel="Delete event"
        message="This action cannot be undone. The selected event will be removed from the calendar."
        loading={deleteLoading}
      />

      <DeleteConfirmModal
        opened={cancelEventId != null}
        onCancel={() => { if (!cancelLoading) setCancelEventId(null); }}
        onConfirm={async () => {
          if (!cancelEventId) return;
          setCancelLoading(true);
          try {
            await cancelCalendarEvent(cancelEventId);
            await fetchEvents(month);
            setCancelEventId(null);
            showNotification({ title: 'Cancelled', message: 'Event marked as cancelled.', color: 'yellow' });
          } catch (err) {
            const msg = err?.response?.data?.error?.message || 'Failed to cancel event';
            showNotification({ title: 'Error', message: msg, color: 'red' });
          } finally {
            setCancelLoading(false);
          }
        }}
        confirmLabel="Cancel event"
        message="Are you sure you want to cancel this schedule? Existing bookings may be affected."
        loading={cancelLoading}
      />
      </div>
  );
}
