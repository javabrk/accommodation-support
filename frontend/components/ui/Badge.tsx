import { ReactNode } from 'react';

type Variant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'orange';

const colors: Record<Variant, string> = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  gray:   'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-700',
};

export function Badge({ children, variant = 'gray' }: { children: ReactNode; variant?: Variant }) {
  return <span className={`badge ${colors[variant]}`}>{children}</span>;
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: Variant }> = {
    active:         { label: 'Active',          variant: 'green'  },
    inactive:       { label: 'Inactive',        variant: 'gray'   },
    pending:        { label: 'Pending',          variant: 'yellow' },
    exited:         { label: 'Exited',           variant: 'red'    },
    available:      { label: 'Available',        variant: 'green'  },
    occupied:       { label: 'Occupied',         variant: 'blue'   },
    maintenance:    { label: 'Maintenance',      variant: 'orange' },
    open:           { label: 'Open',             variant: 'blue'   },
    in_progress:    { label: 'In Progress',      variant: 'yellow' },
    pending_client: { label: 'Awaiting Client',  variant: 'purple' },
    resolved:       { label: 'Resolved',         variant: 'green'  },
    closed:         { label: 'Closed',           variant: 'gray'   },
    low:            { label: 'Low',              variant: 'gray'   },
    medium:         { label: 'Medium',           variant: 'blue'   },
    high:           { label: 'High',             variant: 'orange' },
    urgent:         { label: 'Urgent',           variant: 'red'    },
  };
  const s = map[status] || { label: status, variant: 'gray' as Variant };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
