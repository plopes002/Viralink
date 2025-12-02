import type { ReactNode } from 'react';

type DashboardHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div className="flex-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
