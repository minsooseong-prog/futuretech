import type { LucideIcon } from 'lucide-react';

type Props = { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode };

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <Icon className="h-7 w-7 text-muted" strokeWidth={1.5} aria-hidden="true" />
      <p className="mt-4 text-[0.95rem] font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
