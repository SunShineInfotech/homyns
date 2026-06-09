import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/lib/confirm";
import { toast } from "@/hooks/use-toast";

export default function Register() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await confirm({ title: "Create Account", message: "Confirm your registration details?" });
    if (!ok) return;
    toast({ title: "Account created", description: "Welcome to Homyns!" });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-subtle" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <Card className="w-full max-w-md p-7 md:p-8 rounded-2xl shadow-elevated border-border relative animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-md mb-3">
            <span className="text-primary-foreground font-display font-bold text-2xl">H</span>
          </div>
          <h1 className="text-2xl font-display font-semibold">Create Account</h1>
          <p className="text-sm text-muted-foreground">Start using Homyns in minutes</p>
        </div>

        <form onSubmit={handle} className="space-y-3.5">
          <div><Label>Name</Label><Input required className="h-11 rounded-xl mt-1.5" placeholder="Your full name" /></div>
          <div><Label>Mobile Number</Label><Input required className="h-11 rounded-xl mt-1.5" placeholder="+91 ..." /></div>
          <div><Label>Email</Label><Input required type="email" className="h-11 rounded-xl mt-1.5" placeholder="you@company.com" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Password</Label><Input required type="password" className="h-11 rounded-xl mt-1.5" /></div>
            <div><Label>Confirm</Label><Input required type="password" className="h-11 rounded-xl mt-1.5" /></div>
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl mt-2">Create Account</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already a member? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
