// When the site is "live": the Sunday stream window, or an admin override.
// Used by the home page hero, LiveBanner, LiveInfoPanel and the admin.
//
// site_settings (db/migrations-2026-10-redesign.sql):
//   live_mode   'auto' (follow the schedule) | 'live' (force on) | 'off'
//   live_day    0-6, 0 = Sunday
//   live_start  'HH:MM' and live_end 'HH:MM', America/New_York
// Without those columns the window is Sunday 9:55–11:20 AM, as before.

export const LIVE_DEFAULTS = { live_mode: 'auto', live_day: 0, live_start: '09:55', live_end: '11:20' };
const TIME_ZONE = 'America/New_York';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// { day: 0-6, minutes since midnight } in church time.
export function churchClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => (parts.find((p) => p.type === type) || {}).value;
  return { day: DAYS.indexOf(get('weekday')), minutes: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
}

export function liveSchedule(settings) {
  const s = settings || {};
  const day = Number(s.live_day);
  return {
    mode: ['auto', 'live', 'off'].includes(s.live_mode) ? s.live_mode : LIVE_DEFAULTS.live_mode,
    day: Number.isInteger(day) && day >= 0 && day <= 6 && s.live_day != null ? day : LIVE_DEFAULTS.live_day,
    start: s.live_start || LIVE_DEFAULTS.live_start,
    end: s.live_end || LIVE_DEFAULTS.live_end,
  };
}

// clock: { day, minutes } — defaults to the real church time.
export function isLiveNow(settings, clock) {
  try {
    const s = liveSchedule(settings);
    if (s.mode === 'live') return true;
    if (s.mode === 'off') return false;
    const c = clock || churchClock();
    const start = toMinutes(s.start), end = toMinutes(s.end);
    return c.day === s.day && start != null && end != null && c.minutes >= start && c.minutes < end;
  } catch {
    return false;
  }
}

// Browser-only test overrides, never stored: ?live=1 / ?live=0 force a state,
// ?now=2026-10-18T09:55 pretends it is that church-local time.
export function previewOverride(search) {
  const q = new URLSearchParams(search || '');
  if (q.get('live') === '1') return { live: true };
  if (q.get('live') === '0') return { live: false };
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(q.get('now') || '');
  if (m) {
    const day = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay();
    return { clock: { day, minutes: +m[4] * 60 + +m[5] } };
  }
  return null;
}

export function isLiveInBrowser(settings) {
  const o = typeof window !== 'undefined' ? previewOverride(window.location.search) : null;
  if (o && typeof o.live === 'boolean') return o.live;
  return isLiveNow(settings, o && o.clock);
}

// Kept for existing callers.
export function isServiceWindowNow(settings) {
  return isLiveNow(settings);
}

export function formatClock(hhmm) {
  const t = toMinutes(hhmm);
  if (t == null) return '';
  const h = Math.floor(t / 60), m = t % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
