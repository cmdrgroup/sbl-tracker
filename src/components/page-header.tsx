import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, subtitle, actions, className }: Props) {
  return (
    <div className={cn("flex items-end justify-between gap-6", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            <span className="h-px w-6 bg-primary/60" />
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-[34px] font-semibold tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Panel({
  title, subtitle, actions, children, className, accent,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-4",
      accent && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent",
      className,
    )}>
      {(title || actions) && (
        <div className="flex items-baseline justify-between mb-4 gap-3">
          <div>
            {title && <div className="text-[13px] font-semibold">{title}</div>}
            {subtitle && (
              <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
