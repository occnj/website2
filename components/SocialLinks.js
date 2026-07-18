import { safeHttpUrl } from '@/lib/safeUrl';

const ICONS = {
  facebook: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.7H7.7V14h2.8v8h3z" /></svg>,
  instagram: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>,
  youtube: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 7.5s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.4 4 12 4 12 4s-4.4 0-7.7.2c-.5.1-1.5.1-2.4 1-.7.7-.9 2.3-.9 2.3S.8 9.4.8 11.3v1.4c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.9.2 7.6.2 7.6.2s4.4 0 7.7-.2c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4c0-1.9-.2-3.8-.2-3.8zM9.7 15.3V8.7l6.2 3.3-6.2 3.3z" /></svg>,
};

export default function SocialLinks({ settings, className = 'social-links' }) {
  const links = [['facebook', settings && settings.facebook], ['instagram', settings && settings.instagram], ['youtube', settings && settings.youtube]].map(([name, url]) => [name, safeHttpUrl(url)]).filter(([, url]) => url);
  if (!links.length) return null;
  return <div className={className}>{links.map(([name, url]) => <a key={name} href={url} aria-label={name[0].toUpperCase() + name.slice(1)} target="_blank" rel="noopener noreferrer">{ICONS[name]}</a>)}</div>;
}
