'use client';

import { useState } from 'react';
import { useSiteData } from './SiteDataContext';

const FALLBACK_DONATE_URL = 'https://thekingdomledger.com/donate?code=2335';
const AMOUNTS = ['$25', '$50', '$100', '$200', '$500', 'Other'];

export default function GiveCard() {
  const { settings } = useSiteData();
  const donateUrl = (settings && settings.donate_url) || FALLBACK_DONATE_URL;
  const [tab, setTab] = useState('one');
  const [freq, setFreq] = useState('Weekly');
  const [amount, setAmount] = useState('$200');

  const isOther = amount === 'Other';

  return (
    <div className="give-card">
      <div className="give-card-tabs">
        <div className={'give-tab' + (tab === 'one' ? ' active' : '')} onClick={() => setTab('one')}>Give Once</div>
        <div className={'give-tab' + (tab === 'recurring' ? ' active' : '')} onClick={() => setTab('recurring')}>Give Regularly</div>
      </div>
      <div className="give-tab-body">
        {tab === 'recurring' && (
          <div style={{ marginBottom: 'var(--sp-3)' }}>
            <div className="freq-toggle">
              {['Weekly', 'Bi-weekly', 'Monthly'].map((f) => (
                <div key={f} className={'freq-btn' + (freq === f ? ' active' : '')} onClick={() => setFreq(f)}>{f}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gray-1)', marginBottom: 8 }}>Select Amount</div>
        <div className="amount-grid">
          {AMOUNTS.map((a) => (
            <button key={a} type="button" className={'amount-btn' + (amount === a ? ' active' : '')} onClick={() => setAmount(a)}>{a}</button>
          ))}
        </div>

        {isOther && (
          <div className="form-group" style={{ display: 'flex' }}>
            <input type="number" className="form-input" placeholder="Enter amount ($)" min="1" />
          </div>
        )}

        <div className="form-group">
          <label className="form-label" style={{ fontSize: '.78rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gray-1)' }}>Designate Your Gift</label>
          <select className="form-input">
            <option>General Fund (Where Needed Most)</option>
            <option>Local Outreach</option>
            <option>Global Missions</option>
            <option>Building Fund</option>
            <option>Youth & Children&rsquo;s Ministry</option>
          </select>
        </div>

        <a
          className="btn btn-amber full-w"
          style={{ justifyContent: 'center', padding: 16, fontSize: '1rem' }}
          href={donateUrl}
          target="_blank"
          rel="noopener"
        >
          {isOther ? 'Give' : `Give ${amount}`}
        </a>
        <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--gray-1)', marginTop: 10 }}>You&rsquo;ll complete your gift securely on our giving page. Tax-deductible.</p>
      </div>
    </div>
  );
}
