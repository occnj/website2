// Shared: returns true only during the Sunday service window.
// Used by LiveBanner and the Watch Now Live info panel.
// Service window: Sunday 9:45 AM – 12:00 PM America/New_York.
// Re-exported so one edit here updates every consumer.

export function isServiceWindowNow() {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(new Date());
    const get = (type) => (parts.find((p) => p.type === type) || {}).value;
    if (get('weekday') !== 'Sun') return false;
    const minutes = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
    return minutes >= 9 * 60 + 45 && minutes < 12 * 60;
  } catch {
    return false;
  }
}
