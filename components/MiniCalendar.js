'use client';

import { useState } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MiniCalendar({ events }) {
  const now = new Date();
  const [calDate, setCalDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const eventDays = events
    .map((e) => (e.starts_at ? new Date(e.starts_at + 'T12:00:00') : null))
    .filter((d) => d && d.getFullYear() === year && d.getMonth() === month)
    .map((d) => d.getDate());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  let day = 1;
  for (let r = 0; r < 6 && day <= daysInMonth; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const cellIndex = r * 7 + c;
      if (cellIndex < firstDay || day > daysInMonth) {
        row.push({ blank: true, key: `${r}-${c}` });
      } else {
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        const hasEvent = eventDays.includes(day);
        row.push({ day, isToday, hasEvent, key: `${r}-${c}` });
        day++;
      }
    }
    cells.push(row);
  }

  return (
    <div className="sidebar-widget">
      <div className="cal-nav">
        <button onClick={() => setCalDate(new Date(year, month - 1, 1))}>‹</button>
        <span className="cal-month">{MONTHS[month]} {year}</span>
        <button onClick={() => setCalDate(new Date(year, month + 1, 1))}>›</button>
      </div>
      <table className="mini-cal">
        <thead>
          <tr><th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th></tr>
        </thead>
        <tbody>
          {cells.map((row, i) => (
            <tr key={i}>
              {row.map((cell) => (
                <td
                  key={cell.key}
                  className={cell.blank ? 'other-month' : cell.isToday ? 'today' : cell.hasEvent ? 'has-event' : ''}
                >
                  {cell.blank ? '' : cell.day}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
