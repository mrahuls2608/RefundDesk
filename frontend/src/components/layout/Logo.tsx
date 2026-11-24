import { Receipt } from 'lucide-react';

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-h3 text-text">
      <Receipt aria-hidden="true" className="h-5 w-5 text-primary-600" />
      RefundDesk
    </span>
  );
}
