import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex max-w-content flex-col gap-3 p-6">
      <p className="text-sm font-semibold text-primary-600">404</p>
      <h1 className="text-h1">This page took a refund</h1>
      <p className="text-text-muted">We couldn&apos;t find the page you asked for. It may have moved, or the link may be mistyped.</p>
      <Link href="/" className="text-primary-600 underline">
        Go to the RefundDesk home page
      </Link>
    </main>
  );
}
