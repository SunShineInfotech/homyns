import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  /** If provided, shows back-button header (sub page). Use "" to navigate(-1). */
  backTo?: string;
}

export function MainLayout({ children, title, subtitle, backTo }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header title={title} subtitle={subtitle} backTo={backTo} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
