'use client';

import { useState } from 'react';

export default function PrayerForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const f = e.target;
    const payload = {
      formType: 'prayer',
      name: [f.firstName.value, f.lastName.value].filter(Boolean).join(' ').trim(),
      email: f.email.value,
      phone: f.phone.value,
      'Prayer Request': f.request.value,
      'Keep confidential': f.confidential.checked ? 'Yes — prayer team only' : 'No',
      'OK to contact me': f.contactOk.checked ? 'Yes' : 'No',
      company: f.company.value, // honeypot
    };
    if (!payload.name || !payload['Prayer Request']) {
      setError('Please share your name and prayer request.');
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

  if (sent) {
    return (
      <div className="form-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-2)' }}>🙏</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>Your request has been received.</h2>
        <p className="t-body t-muted">Our prayer team will stand with you. You are not alone — we&rsquo;re praying.</p>
      </div>
    );
  }

  return (
    <div className="form-card">
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Prayer Request</h2>
      <p className="t-small t-muted" style={{ marginBottom: 'var(--sp-4)' }}>
        Share what&rsquo;s on your heart. Our dedicated prayer team reads every request and will personally pray over your situation.
      </p>

      <form onSubmit={handleSubmit}>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} aria-hidden="true" />
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input name="firstName" type="text" className="form-input" placeholder="Your first name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input name="lastName" type="text" className="form-input" placeholder="Your last name" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input name="email" type="email" className="form-input" placeholder="you@email.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Phone (optional)</label>
          <input name="phone" type="tel" className="form-input" placeholder="(732) 555-0000" />
        </div>
        <div className="form-group">
          <label className="form-label">Your Prayer Request *</label>
          <textarea name="request" className="form-textarea" style={{ minHeight: 140 }} placeholder="Share what you'd like us to pray for..." required></textarea>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 'var(--sp-2)', fontSize: '.82rem', color: 'var(--gray-1)' }}>
          <input type="checkbox" name="confidential" style={{ marginTop: 3, accentColor: 'var(--blue)' }} id="confidential" defaultChecked />
          <label htmlFor="confidential">Keep my request confidential (seen only by the prayer team).</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 'var(--sp-3)', fontSize: '.82rem', color: 'var(--gray-1)' }}>
          <input type="checkbox" name="contactOk" style={{ marginTop: 3, accentColor: 'var(--blue)' }} id="contactOk" />
          <label htmlFor="contactOk">It&rsquo;s okay for someone from the care team to follow up with me.</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary full-w"
          style={{ justifyContent: 'center', padding: 16 }}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Submit Prayer Request'}
        </button>

        {error && (
          <div style={{ display: 'block', marginTop: 'var(--sp-3)', color: '#C45E4A', fontSize: '.85rem' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
