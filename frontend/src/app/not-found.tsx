import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex max-w-content flex-col gap-3 p-6">
      <h1 className="text-h1">Page not found</h1>
      <p className="text-text-muted">The page you were looking for doesn&apos;t exist.</p>
      <Link href="/" className="text-primary-600 underline">
        Go to the start page
      </Link>
    </main>
  );
}
