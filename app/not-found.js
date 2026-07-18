import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="section" style={{ paddingTop: 'calc(var(--header-h) + var(--sp-8))', minHeight: '70vh' }}>
      <div className="container-narrow text-center">
        <p className="t-eyebrow">404</p>
        <h1 className="t-display mt-2">Page not found</h1>
        <p className="t-body t-muted mt-3">The page may have moved or the address may be incorrect.</p>
        <Link href="/" className="btn btn-primary mt-4">Return Home</Link>
      </div>
    </main>
  );
}
