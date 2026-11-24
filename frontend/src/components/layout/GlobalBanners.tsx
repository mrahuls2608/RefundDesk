'use client';

import { useIsFetching } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Banner } from '@/components/ui';
import { useOnline } from '@/lib/useOnline';

const COLD_START_HINT_MS = 3000;

/** Offline notice and the free-tier cold-start hint (Design §9). */
export function GlobalBanners() {
  const online = useOnline();
  const fetching = useIsFetching();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (fetching === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), COLD_START_HINT_MS);
    return () => clearTimeout(timer);
  }, [fetching]);

  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {!online && <Banner variant="warning">You&apos;re offline. Changes will fail until you reconnect.</Banner>}
      {online && slow && <Banner variant="info">Waking up the server, this can take up to a minute…</Banner>}
    </div>
  );
}
