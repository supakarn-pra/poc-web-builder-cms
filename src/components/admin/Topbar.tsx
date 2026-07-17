interface TopbarProps {
  title: string;
  websiteName?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, websiteName, actions }: TopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-lg font-semibold">{title}</h1>
        {websiteName ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-muted">
            <span className="h-2 w-2 rounded-full bg-success" />
            {websiteName}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
