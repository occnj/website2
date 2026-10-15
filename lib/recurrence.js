// Repeating events. An event row may carry
//   recurrence: { freq: 'daily'|'weekly'|'monthly'|'yearly', interval,
//                 weekdays: [0-6]          (weekly; monthly by weekday)
//                 monthly_mode: 'date'|'weekday',
//                 ordinals: [1,2,3,4,-1]   (monthly by weekday; -1 = last)
//                 until: 'YYYY-MM-DD', count }
//   exceptions: ['YYYY-MM-DD', ...]       (dates to skip)
// and starts_at is the first date. Shared by the public pages (server) and the
// admin (exposed as window.OasisRecurrence), so both agree on every date.

const DAY = 86400000;
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ORDINAL_LABELS = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', '-1': 'last' };

export function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
}
export function ymd(t) { return new Date(t).toISOString().slice(0, 10); }
export function addDays(date, n) { return ymd(parseDate(date) + n * DAY); }

// Today's date (YYYY-MM-DD) in the church's time zone.
export function churchToday(now = new Date(), timeZone = 'America/New_York') {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now).forEach((x) => { p[x.type] = x.value; });
  return `${p.year}-${p.month}-${p.day}`;
}

export function isRecurring(ev) {
  const r = ev && ev.recurrence;
  return !!(r && r.freq && r.freq !== 'none');
}

function joinList(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' & ' + items[items.length - 1];
}

// Dates (YYYY-MM-DD) the event happens on between from and to, inclusive.
export function occurrences(ev, from, to, limit = 500) {
  const start = parseDate(ev && ev.starts_at);
  if (isNaN(start)) return [];
  const lo = parseDate(from), hi = parseDate(to);
  const skip = new Set((ev.exceptions || []).map((d) => String(d).slice(0, 10)));
  const r = ev.recurrence;
  if (!isRecurring(ev)) {
    return start >= lo && start <= hi && !skip.has(ymd(start)) ? [ymd(start)] : [];
  }

  const interval = Math.max(1, parseInt(r.interval, 10) || 1);
  const sd = new Date(start);
  const startDow = sd.getUTCDay(), startDay = sd.getUTCDate(), startMonth = sd.getUTCMonth(), startYear = sd.getUTCFullYear();
  const weekdays = r.weekdays && r.weekdays.length ? r.weekdays.map(Number) : [startDow];
  const ordinals = r.ordinals && r.ordinals.length ? r.ordinals.map(Number) : [Math.ceil(startDay / 7)];
  const until = r.until ? parseDate(r.until) : NaN;
  const count = parseInt(r.count, 10) || 0;
  const end = Math.min(hi, isNaN(until) ? Infinity : until, start + 20 * 366 * DAY);
  const startWeek = start - startDow * DAY;
  const out = [];
  let seen = 0;

  for (let t = start; t <= end; t += DAY) {
    const d = new Date(t);
    const dow = d.getUTCDay(), day = d.getUTCDate(), month = d.getUTCMonth(), year = d.getUTCFullYear();
    let hit = false;
    if (r.freq === 'daily') {
      hit = Math.round((t - start) / DAY) % interval === 0;
    } else if (r.freq === 'weekly') {
      hit = weekdays.includes(dow) && Math.round((t - dow * DAY - startWeek) / (7 * DAY)) % interval === 0;
    } else if (r.freq === 'monthly') {
      if (((year - startYear) * 12 + month - startMonth) % interval === 0) {
        if (r.monthly_mode === 'weekday') {
          const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
          hit = weekdays.includes(dow) &&
            (ordinals.includes(Math.ceil(day / 7)) || (ordinals.includes(-1) && day + 7 > dim));
        } else {
          hit = day === startDay;
        }
      }
    } else if (r.freq === 'yearly') {
      hit = (year - startYear) % interval === 0 && month === startMonth && day === startDay;
    }
    if (!hit) continue;
    seen++;
    if (count && seen > count) break;
    if (t >= lo && !skip.has(ymd(t))) {
      out.push(ymd(t));
      if (out.length >= limit) break;
    }
  }
  return out;
}

// Every event expanded into one row per date, sorted by date then sort_order.
// Each row keeps the event's fields with starts_at set to that date, plus
// occurrence_key (unique per date) and series_start (the first date).
export function expandEvents(events, from, to) {
  const out = [];
  (events || []).forEach((ev) => {
    occurrences(ev, from, to).forEach((date) => {
      out.push({ ...ev, starts_at: date, series_start: ev.starts_at, occurrence_key: `${ev.id}:${date}` });
    });
  });
  return out.sort((a, b) => (a.starts_at < b.starts_at ? -1 : a.starts_at > b.starts_at ? 1 : (a.sort_order || 0) - (b.sort_order || 0)));
}

export function describeRecurrence(r, startDate) {
  if (!r || !r.freq || r.freq === 'none') return '';
  const n = Math.max(1, parseInt(r.interval, 10) || 1);
  const sd = new Date(parseDate(startDate));
  const days = (r.weekdays && r.weekdays.length ? r.weekdays : [sd.getUTCDay()]).map(Number).sort((a, b) => a - b);
  const dayNames = joinList(days.map((d) => DAYS[d]));
  let text;
  if (r.freq === 'daily') text = n === 1 ? 'Every day' : `Every ${n} days`;
  else if (r.freq === 'weekly') text = `${n === 1 ? 'Every week' : `Every ${n} weeks`} on ${dayNames}`;
  else if (r.freq === 'monthly') {
    const every = n === 1 ? 'Every month' : `Every ${n} months`;
    if (r.monthly_mode === 'weekday') {
      const ords = (r.ordinals && r.ordinals.length ? r.ordinals : [Math.ceil(sd.getUTCDate() / 7)]).map(Number)
        .sort((a, b) => (a < 0 ? 9 : a) - (b < 0 ? 9 : b));
      text = `${every} on the ${joinList(ords.map((o) => ORDINAL_LABELS[o]))} ${dayNames}`;
    } else {
      text = `${every} on day ${sd.getUTCDate()}`;
    }
  } else if (r.freq === 'yearly') text = `${n === 1 ? 'Every year' : `Every ${n} years`} on ${MONTHS[sd.getUTCMonth()]} ${sd.getUTCDate()}`;
  else return '';
  if (r.until) text += `, until ${formatLongDate(r.until)}`;
  else if (r.count) text += `, ${r.count} times`;
  return text;
}

export function formatLongDate(s) {
  const t = parseDate(s);
  if (isNaN(t)) return '';
  const d = new Date(t);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// Keeps only the recurrence fields the site understands, so the admin can't
// store something the public pages would misread.
export function normalizeRecurrence(r) {
  if (!r || !['daily', 'weekly', 'monthly', 'yearly'].includes(r.freq)) return null;
  const out = { freq: r.freq, interval: Math.min(99, Math.max(1, parseInt(r.interval, 10) || 1)) };
  const wd = [...new Set((r.weekdays || []).map(Number).filter((d) => d >= 0 && d <= 6))].sort();
  if (r.freq === 'weekly' && wd.length) out.weekdays = wd;
  if (r.freq === 'monthly') {
    out.monthly_mode = r.monthly_mode === 'weekday' ? 'weekday' : 'date';
    if (out.monthly_mode === 'weekday') {
      out.weekdays = wd;
      out.ordinals = [...new Set((r.ordinals || []).map(Number).filter((o) => [1, 2, 3, 4, -1].includes(o)))];
    }
  }
  if (r.until && !isNaN(parseDate(r.until))) out.until = String(r.until).slice(0, 10);
  else if (parseInt(r.count, 10) > 0) out.count = parseInt(r.count, 10);
  return out;
}
