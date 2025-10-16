import { memo } from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface Props {
  status: 'pending' | 'committed' | 'rejected';
}

/**
 * StatusBadge - Color-coded status indicator
 * Shows transaction status with icon and text
 */
function StatusBadge({ status }: Props) {
  const config = {
    pending: {
      icon: Clock,
      text: 'Pending Acceptance',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-300',
    },
    committed: {
      icon: CheckCircle,
      text: 'Committed',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
    },
    rejected: {
      icon: XCircle,
      text: 'Rejected',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
    },
  };

  const { icon: Icon, text, bgColor, textColor, borderColor } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor}`}
      role="status"
      aria-label={`Transaction status: ${text}`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {text}
    </span>
  );
}

export default memo(StatusBadge);

