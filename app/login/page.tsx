"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "viewer">("viewer");
  const [dummyEmail, setDummyEmail] = useState(false);
  const [signupRole, setSignupRole] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();

    if (dummyEmail) {
      // Dev mode: create pre-confirmed user via server route, then auto-sign in
      const res = await fetch("/api/auth/dev-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Dev signup failed");
        setLoading(false);
        return;
      }

      // Auto sign-in since user is already confirmed
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
      return;
    }

    // Normal flow: requires email confirmation
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSignupRole(role);
      setMessage("Check your email for a confirmation link.");
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 px-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Package className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">StockUp</h1>
            <p className="text-sm text-muted-foreground">
              Inventory Control System
            </p>
          </div>
        </div>

        {(urlError || error) && (
          <div className="w-full rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
            {error || "Authentication failed. Please try again."}
          </div>
        )}

        {message && (
          <div className="w-full rounded-md bg-green-500/10 p-3 text-center text-sm text-green-700 dark:text-green-400">
            <p>{message}</p>
            {signupRole && (
              <p className="mt-2 flex items-center justify-center gap-2">
                Assigned role: <Badge variant="secondary" className="capitalize">{signupRole}</Badge>
              </p>
            )}
          </div>
        )}

        <Card className="w-full">
          <CardContent className="pt-6">
            <Tabs defaultValue="sign-in" className="w-full" onValueChange={() => { setError(""); setMessage(""); }}>
              <TabsList className="w-full">
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="sign-in">
                <form onSubmit={handleSignIn} className="flex flex-col gap-4 pt-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="sign-up">
                <form onSubmit={handleSignUp} className="flex flex-col gap-4 pt-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as "admin" | "manager" | "viewer")}>
                      <SelectTrigger id="signup-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Dev mode: role selection will be restricted in production.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dummy-email"
                      checked={dummyEmail}
                      onCheckedChange={(checked) => setDummyEmail(checked === true)}
                    />
                    <Label htmlFor="dummy-email" className="text-sm font-normal cursor-pointer">
                      Dummy email (skip confirmation)
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
