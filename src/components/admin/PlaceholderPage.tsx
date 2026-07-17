import { Topbar } from "./Topbar";

interface PlaceholderPageProps {
  title: string;
  sprintNote: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function PlaceholderPage({
  title,
  sprintNote,
  action,
  children,
}: PlaceholderPageProps) {
  return (
    <>
      <Topbar title={title} actions={action} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="max-w-md space-y-2">
          <h2 className="font-display text-xl font-semibold">
            หน้านี้ยังไม่พร้อมใน POC
          </h2>
          <p className="text-sm text-text-muted">{sprintNote}</p>
        </div>
        {children}
      </div>
    </>
  );
}
