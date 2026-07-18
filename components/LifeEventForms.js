'use client';

import { useState } from 'react';

function LifeEventForm({ kind }) {
  const isBaptism = kind === 'baptism';
  const [state, setState] = useState({ sending: false, sent: false, error: '' });

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = Object.fromEntries(form.entries());
    setState({ sending: true, sent: false, error: '' });
    try {
      const response = await fetch('/website/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'life-event',
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          'Life Event': isBaptism ? 'Water Baptism' : 'Baby Dedication',
          ...fields,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Submission failed.');
      setState({ sending: false, sent: true, error: '' });
      event.currentTarget.reset();
    } catch (error) {
      setState({ sending: false, sent: false, error: error.message || 'Please try again.' });
    }
  }

  return (
    <form onSubmit={submit} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-5)', boxShadow: 'var(--shadow-md)' }}>
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
      <p className="t-eyebrow" style={{ color: isBaptism ? 'var(--blue)' : 'var(--amber)' }}>{isBaptism ? 'Water Baptism' : 'Baby Dedication'}</p>
      <h3 className="t-h2 mt-2" style={{ marginBottom: 'var(--sp-4)' }}>{isBaptism ? 'Register for Baptism' : 'Request a Dedication'}</h3>
      <div className="form-group"><label className="form-label" htmlFor={`${kind}-name`}>{isBaptism ? 'Full Name' : 'Parent / Guardian Name'} *</label><input id={`${kind}-name`} name="name" required className="form-input" /></div>
      {!isBaptism && <div className="form-group"><label className="form-label" htmlFor="child-name">Child&rsquo;s Name *</label><input id="child-name" name="childName" required className="form-input" /></div>}
      {!isBaptism && <div className="form-group"><label className="form-label" htmlFor="child-dob">Child&rsquo;s Date of Birth</label><input id="child-dob" name="childDob" type="date" className="form-input" /></div>}
      <div className="form-group"><label className="form-label" htmlFor={`${kind}-email`}>Email *</label><input id={`${kind}-email`} name="email" type="email" required className="form-input" /></div>
      <div className="form-group"><label className="form-label" htmlFor={`${kind}-phone`}>Phone</label><input id={`${kind}-phone`} name="phone" type="tel" className="form-input" /></div>
      <div className="form-group"><label className="form-label" htmlFor={`${kind}-preferred`}>{isBaptism ? 'Preferred Baptism Date' : 'Preferred Sunday'}</label><input id={`${kind}-preferred`} name="preferredDate" className="form-input" placeholder="Tell us what works for you" /></div>
      <div className="form-group"><label className="form-label" htmlFor={`${kind}-notes`}>Notes</label><textarea id={`${kind}-notes`} name="message" className="form-textarea" style={{ minHeight: 90 }} /></div>
      <button type="submit" disabled={state.sending || state.sent} className={isBaptism ? 'btn btn-primary full-w' : 'btn btn-amber full-w'} style={{ justifyContent: 'center' }}>
        {state.sending ? 'Sending…' : state.sent ? 'Submitted!' : isBaptism ? 'Submit Registration' : 'Submit Request'}
      </button>
      {state.error && <p role="alert" style={{ color: 'var(--red)', marginTop: 12 }}>{state.error}</p>}
      {state.sent && <p role="status" style={{ color: 'var(--green)', marginTop: 12 }}>Thank you. Our team will contact you.</p>}
    </form>
  );
}

export default function LifeEventForms() {
  return (
    <section className="section bg-blue-light" id="baptism-form" data-screen-label="Life Event Forms">
      <div className="container">
        <div className="split-2" style={{ alignItems: 'start' }}>
          <LifeEventForm kind="baptism" />
          <div id="dedication-form"><LifeEventForm kind="dedication" /></div>
        </div>
      </div>
    </section>
  );
}
