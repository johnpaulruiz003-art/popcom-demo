import '../styles/eventColors.css';

/**
 * Event type + status colour tokens.
 *
 * The hex values live exactly once, in styles/eventColors.css, as CSS custom
 * properties. This module only maps a type / status to those variable names,
 * so the palette is never duplicated in JavaScript.
 */

export const OTHER_TYPE = {
  key: 'other',
  label: 'Other',
  bg: 'var(--cal-type-other-bg)',
  fg: 'var(--cal-type-other-fg)',
  dot: 'var(--cal-type-other-dot)',
};

/**
 * A day that mixes several event types is painted with a soft gradient built
 * from the same three type backgrounds, so a mixed day sits at the same
 * lightness as the single-type days next to it. Exported as a token so the
 * calendar tile and the legend swatch can never drift apart.
 */
export const MULTI_TYPE = {
  key: 'multi',
  label: 'Multiple types',
  gradient:
    'linear-gradient(135deg, var(--cal-type-pmo-bg) 0%, var(--cal-type-act-bg) 50%, var(--cal-type-usapan-bg) 100%)',
  dot: 'var(--cal-type-pmo-dot)',
};

export const EVENT_TYPE_TOKENS = {
  'PRE-MARRIAGE ORIENTATION': {
    key: 'pmo',
    label: 'Pre-Marriage Orientation',
    bg: 'var(--cal-type-pmo-bg)',
    fg: 'var(--cal-type-pmo-fg)',
    dot: 'var(--cal-type-pmo-dot)',
  },
  'USAPAN-SERIES': {
    key: 'usapan',
    label: 'Usapan-Series',
    bg: 'var(--cal-type-usapan-bg)',
    fg: 'var(--cal-type-usapan-fg)',
    dot: 'var(--cal-type-usapan-dot)',
  },
  'EVENT/ACTIVITY': {
    key: 'act',
    label: 'Event/Activity',
    bg: 'var(--cal-type-act-bg)',
    fg: 'var(--cal-type-act-fg)',
    dot: 'var(--cal-type-act-dot)',
  },
};

/**
 * The three real event types, in display order. This is what the public
 * "Event Type Legends" card shows - the calendar API only ever returns these
 * three, so there is nothing else for a visitor to look up.
 */
export const EVENT_TYPE_LEGEND = [
  EVENT_TYPE_TOKENS['PRE-MARRIAGE ORIENTATION'],
  EVENT_TYPE_TOKENS['USAPAN-SERIES'],
  EVENT_TYPE_TOKENS['EVENT/ACTIVITY'],
];

/**
 * The same three types plus the mixed-type gradient. Only meaningful inside the
 * calendar modal, which is the one place a single day tile can blend several
 * types; the sidebar card has no such tile to explain.
 */
export const CALENDAR_TYPE_LEGEND = [...EVENT_TYPE_LEGEND, MULTI_TYPE];

export const STATUS_TOKENS = {
  UPCOMING: {
    key: 'upcoming',
    label: 'Upcoming',
    bg: 'var(--cal-status-upcoming-bg)',
    fg: 'var(--cal-status-upcoming-fg)',
    dot: 'var(--cal-status-upcoming-dot)',
  },
  ONGOING: {
    key: 'ongoing',
    label: 'Ongoing',
    bg: 'var(--cal-status-ongoing-bg)',
    fg: 'var(--cal-status-ongoing-fg)',
    dot: 'var(--cal-status-ongoing-dot)',
  },
  FINISHED: {
    key: 'finished',
    label: 'Finished',
    bg: 'var(--cal-status-finished-bg)',
    fg: 'var(--cal-status-finished-fg)',
    dot: 'var(--cal-status-finished-dot)',
  },
  CANCELLED: {
    key: 'cancelled',
    label: 'Cancelled',
    bg: 'var(--cal-status-cancelled-bg)',
    fg: 'var(--cal-status-cancelled-fg)',
    dot: 'var(--cal-status-cancelled-dot)',
  },
};

export const STATUS_LEGEND = ['UPCOMING', 'ONGOING', 'FINISHED', 'CANCELLED'].map(
  (key) => STATUS_TOKENS[key]
);

export const NEUTRAL_TOKEN = {
  key: 'neutral',
  label: 'Scheduled',
  bg: 'var(--cal-neutral-bg)',
  fg: 'var(--cal-neutral-fg)',
  dot: 'var(--cal-neutral-dot)',
};

export function normalizeEventType(ev) {
  const t = ev?.type || ev?.category || ev?.kind || '';
  return String(t).toUpperCase();
}

export function getEventTypeToken(ev) {
  return EVENT_TYPE_TOKENS[normalizeEventType(ev)] || OTHER_TYPE;
}

/**
 * Stable identity for an event.
 *
 * The calendar API unions three tables (announcements, PmoSchedules,
 * UsapanSchedules) and returns each row's own primary key as `id`, so plain
 * `id` values collide across types (an announcement 3 and a PMO 3 both exist).
 * React keys and "which event is selected" comparisons must therefore use the
 * type-qualified key instead of the bare id.
 */
export function getEventKey(ev) {
  return `${normalizeEventType(ev) || 'UNKNOWN'}:${ev?.id ?? ''}`;
}

/**
 * Highest-priority type present among a day's events. Drives the calendar
 * tile tint: PMO wins over Usapan-Series, which wins over Event/Activity.
 */
export function getEventTypeTokenForEvents(events = []) {
  const types = (events || []).map(normalizeEventType);
  if (types.includes('PRE-MARRIAGE ORIENTATION')) {
    return EVENT_TYPE_TOKENS['PRE-MARRIAGE ORIENTATION'];
  }
  if (types.includes('USAPAN-SERIES')) return EVENT_TYPE_TOKENS['USAPAN-SERIES'];
  if (types.includes('EVENT/ACTIVITY')) return EVENT_TYPE_TOKENS['EVENT/ACTIVITY'];
  return OTHER_TYPE;
}

const CANONICAL_TYPE_ORDER = ['PRE-MARRIAGE ORIENTATION', 'USAPAN-SERIES', 'EVENT/ACTIVITY'];

/**
 * The distinct type tokens present on a day, in the canonical legend order.
 * Used to draw the small dot row under a calendar tile so a day that mixes
 * types shows every colour involved rather than only the dominant one.
 */
export function getDistinctEventTypesForEvents(events = []) {
  const present = new Set((events || []).map(normalizeEventType));
  const tokens = CANONICAL_TYPE_ORDER.filter((type) => present.has(type)).map(
    (type) => EVENT_TYPE_TOKENS[type]
  );
  // Anything that is not one of the three known types falls back to "Other".
  const hasOther = Array.from(present).some((type) => !CANONICAL_TYPE_ORDER.includes(type));
  if (hasOther) tokens.push(OTHER_TYPE);
  return tokens;
}

/**
 * The fill a swatch should be painted with, for BOTH the calendar day tile and
 * the legend swatch.
 *
 * These two were previously painted independently (tiles used the soft `bg`
 * tint, the legend used the saturated `dot`), so the same event type looked
 * like two different colours. Routing both through this one function is what
 * keeps the legend and the grid in sync.
 */
export function getSwatchFill(token) {
  if (!token) return null;
  return token.key === MULTI_TYPE.key ? token.gradient : token.bg;
}

/**
 * The swatch a calendar tile should use for a day: a single type gets that
 * type's soft background, a mix of types gets the shared gradient, and a day
 * with no events gets `null` so the caller can render a plain neutral tile.
 */
export function getDayTokenForEvents(events = []) {
  const tokens = getDistinctEventTypesForEvents(events);
  if (tokens.length === 0) return null;
  if (tokens.length > 1) return MULTI_TYPE;
  return tokens[0];
}

export function getStatusToken(status) {
  return STATUS_TOKENS[String(status || '').toUpperCase()] || null;
}

/**
 * For the admin add/edit preview, where the value is a scheduling state
 * (e.g. "Scheduled") rather than a derived event status.
 *
 * "Scheduled" is not a derived status (the calendar derives UPCOMING / ONGOING /
 * FINISHED / CANCELLED from the dates), and it has no entry of its own, so it
 * borrows the UPCOMING styling - "Scheduled" is the closest thing a new event
 * can be. The shared neutral token remains the fallback for anything else.
 */
export function getScheduleStateToken(value) {
  if (String(value || '').toLowerCase() === 'scheduled') return STATUS_TOKENS.UPCOMING;
  return getStatusToken(value) || NEUTRAL_TOKEN;
}

/** Two-letter initials for the event avatar, e.g. "Pre-Marriage Orientation" -> "PO". */
export function getTypeInitials(type) {
  return String(type || '')
    .split(/\s|\//)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
