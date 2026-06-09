import { ArrowLeft, Bell, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "@/lib/confirm";
import { notifications } from "@/data/mockData";

interface HeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
}

export function Header({ title, subtitle, backTo }: HeaderProps) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const unread = notifications.filter((n) => n.unread).length;

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      destructive: true,
    });
    if (ok) navigate("/login");
  };

  return (
    <header className="h-16 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {backTo !== undefined ? (
          <Button variant="ghost" size="icon" onClick={() => backTo ? navigate(backTo) : navigate(-1)} className="rounded-xl shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <div className="md:hidden w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-display font-bold">H</span>
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-display font-semibold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-destructive rounded-full text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 rounded-2xl">
            <div className="p-4 border-b border-border">
              <p className="font-display font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">{unread} unread</p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 hover:bg-secondary/50 cursor-pointer">
                  <div className="flex items-start gap-2">
                    {n.unread && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-xl hover:bg-secondary transition">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">AK</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-semibold text-foreground leading-tight">Arjun Kapoor</span>
                <span className="text-xs text-muted-foreground">Designer</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
              <UserCircle className="w-4 h-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
