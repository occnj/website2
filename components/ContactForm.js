'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const f = e.target;
    const payload = {
      formType: 'contact',
      name: [f.firstName.value, f.lastName.value].filter(Boolean).join(' ').trim(),
      email: f.email.value,
      phone: f.phone.value,
      reason: f.reason.value,
      message: f.message.value,
      company: f.company.value, // honeypot
    };
    if (!payload.name || !payload.email) {
      setError('Please fill in your name and email.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/website/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to send.');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again or email oasis@oasisnj.net.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="form-card">
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Send Us a Message</h2>
      <p className="t-small t-muted" style={{ marginBottom: 'var(--sp-4)' }}>We typically respond within one business day.</p>

      <form onSubmit={handleSubmit}>
        {/* honeypot — hidden from users, catches bots */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} aria-hidden="true" />
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label" htmlFor="contact-first-name">First Name *</label>
            <input id="contact-first-name" name="firstName" type="text" autoComplete="given-name" className="form-input" placeholder="Your first name" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="contact-last-name">Last Name</label>
            <input id="contact-last-name" name="lastName" type="text" autoComplete="family-name" className="form-input" placeholder="Your last name" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-email">Email Address *</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" className="form-input" placeholder="you@email.com" required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-phone">Phone (optional)</label>
          <input id="contact-phone" name="phone" type="tel" autoComplete="tel" className="form-input" placeholder="Phone number" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-reason">What is this about?</label>
          <select id="contact-reason" name="reason" className="form-input reason-select" defaultValue="">
            <option value="">Select a reason</option>
            <option>General Inquiry</option>
            <option>Planning a Visit</option>
            <option>Prayer Request</option>
            <option>Join a Team</option>
            <option>Baptism / Life Event</option>
            <option>Pastoral Care</option>
            <option>Media / Press</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-message">Message *</label>
          <textarea id="contact-message" name="message" className="form-textarea" placeholder="How can we help you?" required></textarea>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 'var(--sp-3)', fontSize: '.82rem', color: 'var(--gray-1)' }}>
          <input type="checkbox" style={{ marginTop: 3, accentColor: 'var(--blue)' }} id="consent" required />
          <label htmlFor="consent">I agree to be contacted by Oasis Christian Centre. We respect your privacy and will never share your information.</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary full-w"
          style={{ justifyContent: 'center', padding: 16, background: sent ? '#4A8C6A' : undefined }}
          disabled={sending || sent}
        >
          {sending ? 'Sending...' : sent ? 'Message Sent!' : 'Send Message'}
        </button>

        {error && (
          <div role="alert" style={{ display: 'block', marginTop: 'var(--sp-3)', color: '#C45E4A', fontSize: '.85rem' }}>
            {error}
          </div>
        )}

        {sent && (
          <div role="status" className="success-msg" style={{ display: 'block' }}>
            Your message was sent! We&rsquo;ll be in touch within one business day.
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--gray-1)', marginTop: 'var(--sp-3)' }}>
          Need prayer? <a href="/website/prayer" style={{ color: 'var(--blue)', fontWeight: 600 }}>Submit a prayer request →</a>
        </p>
      </form>
    </div>
  );
}
