import { ReactNode, useEffect, useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  /** If provided, shows back-button header (sub page). Use "" to navigate(-1). */
  backTo?: string;
  /** Render a focused full-window workspace without the app navigation chrome. */
  bare?: boolean;
}

export function MainLayout({ children, title, subtitle, backTo, bare = false }: MainLayoutProps) {
  const [expiryNoticeOpen, setExpiryNoticeOpen] = useState(false);
  const expiryDate = useMemo(() => {
    try {
      const raw = localStorage.getItem("company_data");
      const value = raw ? JSON.parse(raw)?.company_expiry_date : "";
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return "";
      const expiry = value.slice(0, 10);
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date());
      return expiry < today ? expiry : "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    if (expiryDate) setExpiryNoticeOpen(true);
  }, [expiryDate]);

  return (
    <div className={bare ? "flex h-[100dvh] w-full flex-col overflow-hidden bg-background" : "min-h-screen flex w-full bg-background"}>
      {!bare && <Sidebar />}
      <div className={bare ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex min-h-screen flex-1 flex-col overflow-x-hidden"}>
        {!bare && <Header title={title} subtitle={subtitle} backTo={backTo} />}
        <main className={bare ? "min-h-0 flex-1 overflow-hidden p-0" : "flex-1 p-4 pb-24 md:p-6 md:pb-6"}>{children}</main>
      </div>
      {!bare && <MobileBottomNav />}
      <Dialog open={expiryNoticeOpen} onOpenChange={setExpiryNoticeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Company subscription expired</DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              <span className="block">Please complete your renewal. Your system service is suspended because the renewal payment is pending.</span>
              {expiryDate && <span className="block text-xs">Expiry date: {new Date(`${expiryDate}T00:00:00`).toLocaleDateString("en-IN")}</span>}
              <span className="block pt-2 font-medium text-foreground">Contact Sunshine Infotech</span>
              <a className="inline-flex items-center gap-1 text-primary underline" href="https://www.sunshineinfotech.in" target="_blank" rel="noreferrer">www.sunshineinfotech.in <ExternalLink className="h-3 w-3" /></a>
              <span className="block">Support: <a className="text-primary underline" href="tel:8200043151">8200043151</a> | <a className="text-primary underline" href="tel:9316392980">9316392980</a></span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setExpiryNoticeOpen(false)}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
