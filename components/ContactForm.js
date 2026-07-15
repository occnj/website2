'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1200);
  }

  return (
    <div className="form-card">
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Send Us a Message</h2>
      <p className="t-small t-muted" style={{ marginBottom: 'var(--sp-4)' }}>We typically respond within one business day.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input type="text" className="form-input" placeholder="Your first name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input type="text" className="form-input" placeholder="Your last name" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input type="email" className="form-input" placeholder="you@email.com" required />
        </div>
        <div className="form-group">
          <label className="form-label">Phone (optional)</label>
          <input type="tel" className="form-input" placeholder="(732) 555-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">What is this about?</label>
          <select className="form-input reason-select">
            <option value="">Select a reason</option>
            <option>General Inquiry</option>
            <option>Planning a Visit</option>
            <option>Prayer Request</option>
            <option>Join a Team</option>
            <option>Baptism / Life Event</option>
            <option>Giving / Finances</option>
            <option>Pastoral Care</option>
            <option>Media / Press</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea className="form-textarea" placeholder="How can we help you?" required></textarea>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 'var(--sp-3)', fontSize: '.82rem', color: 'var(--gray-1)' }}>
          <input type="checkbox" style={{ marginTop: 3, accentColor: 'var(--blue)' }} id="consent" />
          <label htmlFor="consent">I agree to be contacted by Oasis Christian Centre. We respect your privacy and will never share your information.</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary full-w"
          style={{ justifyContent: 'center', padding: 16, background: sent ? '#4A8C6A' : undefined }}
          disabled={sending}
        >
          {sending ? 'Sending...' : sent ? 'Message Sent!' : 'Send Message'}
        </button>

        {sent && (
          <div className="success-msg" style={{ display: 'block' }}>
            Your message was sent! We&rsquo;ll be in touch within one business day.
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--gray-1)', marginTop: 'var(--sp-3)' }}>
          Need prayer now? <a href="#" style={{ color: 'var(--blue)', fontWeight: 600 }}>Submit a prayer request →</a>
        </p>
      </form>
    </div>
  );
}
