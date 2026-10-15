import { describe, it, expect } from 'vitest';
import { occurrences, expandEvents, describeRecurrence, normalizeRecurrence, churchToday } from '../lib/recurrence';

// 2026-10-15 is a Thursday.
const ev = (starts_at, recurrence, extra) => ({ id: 'e1', starts_at, recurrence, ...extra });

describe('occurrences', () => {
  it('one-time events fall inside or outside the range', () => {
    expect(occurrences(ev('2026-10-20'), '2026-10-01', '2026-10-31')).toEqual(['2026-10-20']);
    expect(occurrences(ev('2026-09-01'), '2026-10-01', '2026-10-31')).toEqual([]);
  });

  it('every 2 weeks on Thursday', () => {
    expect(occurrences(ev('2026-10-15', { freq: 'weekly', interval: 2, weekdays: [4] }), '2026-10-01', '2026-11-30'))
      .toEqual(['2026-10-15', '2026-10-29', '2026-11-12', '2026-11-26']);
  });

  it('every 1st and 3rd Thursday', () => {
    expect(occurrences(ev('2026-10-01', { freq: 'monthly', monthly_mode: 'weekday', weekdays: [4], ordinals: [1, 3] }), '2026-10-01', '2026-12-31'))
      .toEqual(['2026-10-01', '2026-10-15', '2026-11-05', '2026-11-19', '2026-12-03', '2026-12-17']);
  });

  it('last Friday of the month', () => {
    expect(occurrences(ev('2026-10-30', { freq: 'monthly', monthly_mode: 'weekday', weekdays: [5], ordinals: [-1] }), '2026-10-01', '2026-12-31'))
      .toEqual(['2026-10-30', '2026-11-27', '2026-12-25']);
  });

  it('monthly on the 31st skips short months', () => {
    expect(occurrences(ev('2026-10-31', { freq: 'monthly' }), '2026-10-01', '2027-01-31'))
      .toEqual(['2026-10-31', '2026-12-31', '2027-01-31']);
  });

  it('count, until and skipped dates', () => {
    expect(occurrences(ev('2026-10-18', { freq: 'weekly', count: 3 }, { exceptions: ['2026-10-25'] }), '2026-10-01', '2026-12-31'))
      .toEqual(['2026-10-18', '2026-11-01']);
    expect(occurrences(ev('2026-10-18', { freq: 'daily', interval: 3, until: '2026-10-27' }), '2026-10-20', '2026-12-31'))
      .toEqual(['2026-10-21', '2026-10-24', '2026-10-27']);
  });

  it('a series that started in the past still shows its upcoming dates', () => {
    expect(occurrences(ev('2025-01-02', { freq: 'weekly', weekdays: [4] }), '2026-10-15', '2026-10-29'))
      .toEqual(['2026-10-15', '2026-10-22', '2026-10-29']);
  });
});

describe('expandEvents', () => {
  it('gives each date its own row, sorted', () => {
    const rows = expandEvents([
      ev('2026-10-15', { freq: 'weekly', interval: 2 }, { id: 'a', title: 'A' }),
      ev('2026-10-20', null, { id: 'b', title: 'B' }),
    ], '2026-10-01', '2026-10-31');
    expect(rows.map((r) => `${r.title} ${r.starts_at}`)).toEqual(['A 2026-10-15', 'B 2026-10-20', 'A 2026-10-29']);
    expect(rows[2].occurrence_key).toBe('a:2026-10-29');
    expect(rows[2].series_start).toBe('2026-10-15');
  });
});

describe('describeRecurrence', () => {
  it('reads naturally', () => {
    expect(describeRecurrence({ freq: 'weekly', interval: 2, weekdays: [4] }, '2026-10-15')).toBe('Every 2 weeks on Thursday');
    expect(describeRecurrence({ freq: 'monthly', monthly_mode: 'weekday', weekdays: [4], ordinals: [3, 1] }, '2026-10-01'))
      .toBe('Every month on the 1st & 3rd Thursday');
    expect(describeRecurrence({ freq: 'monthly' }, '2026-10-31')).toBe('Every month on day 31');
    expect(describeRecurrence({ freq: 'weekly', until: '2027-06-30' }, '2026-10-15')).toBe('Every week on Thursday, until June 30, 2027');
    expect(describeRecurrence(null, '2026-10-15')).toBe('');
  });
});

describe('normalizeRecurrence', () => {
  it('drops unknown values', () => {
    expect(normalizeRecurrence({ freq: 'none' })).toBe(null);
    expect(normalizeRecurrence({ freq: 'weekly', interval: '2', weekdays: ['4', 9], evil: 1 })).toEqual({ freq: 'weekly', interval: 2, weekdays: [4] });
    expect(normalizeRecurrence({ freq: 'monthly', monthly_mode: 'weekday', weekdays: [4], ordinals: [1, 3, 7] }))
      .toEqual({ freq: 'monthly', interval: 1, monthly_mode: 'weekday', weekdays: [4], ordinals: [1, 3] });
  });
});

describe('churchToday', () => {
  it('uses New York time', () => {
    expect(churchToday(new Date('2026-10-16T02:00:00Z'))).toBe('2026-10-15');
  });
});
