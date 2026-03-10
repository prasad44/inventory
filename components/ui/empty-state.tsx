import { type LucideIcon, Package } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/50" />
      <h3 className="mt-4 text-sm font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
