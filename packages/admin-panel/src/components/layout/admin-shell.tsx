import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-bg-void text-foreground font-mono overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto bg-[url('/grid-pattern.svg')] relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-bg-void via-transparent to-bg-void/50 pointer-events-none" />
          {children}
        </main>
      </div>
    </div>
  );
}
