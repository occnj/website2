// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PromotionalPopup, { normalizePopupSettings, safePopupHref } from './PromotionalPopup';
import { SiteDataProvider } from './SiteDataContext';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;

function renderPopup(settings) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(
        SiteDataProvider,
        { settings, navItems: [] },
        React.createElement(PromotionalPopup),
      ),
    );
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  if (root) act(() => root.unmount());
  root = null;
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  vi.useRealTimers();
});

describe('PromotionalPopup', () => {
  it('sanitizes URLs, accent color, and delay values', () => {
    expect(safePopupHref('javascript:alert(1)')).toBe('');
    expect(safePopupHref('/plan-your-visit')).toBe('/plan-your-visit');
    expect(normalizePopupSettings({ popup_delay_seconds: 99, popup_accent_color: 'red' }))
      .toMatchObject({ delaySeconds: 30, accent: '#00A4CC' });
  });

  it('opens on the public website and can be dismissed from the close button', async () => {
    renderPopup({
      popup_enabled: true,
      popup_title: 'Join us Sunday',
      popup_description: 'Everyone is welcome.',
      popup_primary_label: 'Plan a visit',
      popup_primary_url: '/plan-your-visit',
      popup_delay_seconds: 2,
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    act(() => document.querySelector('.promo-popup-close').click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(window.sessionStorage.getItem('oasis-promotional-popup-dismissed')).toBe('1');
  });

  it('dismisses on a backdrop click but not a card click', async () => {
    renderPopup({ popup_enabled: true, popup_title: 'Important message' });
    await act(async () => { vi.runAllTimers(); });

    const backdrop = document.querySelector('.promo-popup-backdrop');
    const card = document.querySelector('.promo-popup-card');
    act(() => card.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    act(() => backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('never opens on Admin routes', async () => {
    window.history.replaceState({}, '', '/admin');
    renderPopup({ popup_enabled: true, popup_title: 'Public only' });
    await act(async () => { vi.runAllTimers(); });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
