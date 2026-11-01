import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, {
      full_name: fullName,
      role,
      business_name: role === "seller" ? businessName : undefined,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message?.includes("already registered") ? "This email is already registered. Try logging in." : "Could not create account. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-10">
      <div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">D</div>
          <h1 className="font-display text-xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join Duniya Mart today</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["buyer", "seller"] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-all ${role === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"}`}
            >
              {r === "buyer" ? "🛒 Buyer" : "🏭 Seller"}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Full Name</Label>
            <Input placeholder="Your name" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          {role === "seller" && (
            <div>
              <Label>Business Name</Label>
              <Input placeholder="Your business name" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? "Creating account..." : role === "buyer" ? "Create Buyer Account" : "Register as Seller"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
