import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';

const REPO_URL = 'https://github.com/mrahuls2608/refunddesk';

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-text-muted">Mock data only. No real payments, names or bank details.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-6 text-sm text-text-muted">
            <li>
              <a href={REPO_URL} className="hover:text-text">
                Source code
              </a>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-text">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-text">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-text">
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
