import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Sparkles, Loader2, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  passwordHash: z.string().min(1, "Password is required"), // passwordHash acts as the raw password text input on the client
});

export default function AuthPage() {
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Visuals */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1974&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">SmartPaper</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-display font-bold leading-tight mb-6">
            Generate professional academic papers in seconds, not hours.
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Our AI-assisted platform helps educators create balanced, high-quality question papers aligned with academic requirements.
          </p>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/60">
          © 2026 SmartPaper Inc. All rights reserved.
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold text-foreground">Welcome</h2>
            <p className="text-muted-foreground mt-2">Enter your details to access your dashboard.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm login={login} />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm register={register} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ login }: { login: any }) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <Card className="border-none shadow-none">
      <form onSubmit={form.handleSubmit((data) => login.mutate(data))}>
        <CardContent className="space-y-4 px-0">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" {...form.register("email")} placeholder="educator@college.edu" />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...form.register("passwordHash")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.passwordHash && (
              <p className="text-xs text-destructive">{form.formState.errors.passwordHash.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-0 flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          {login.error && (
            <p className="text-sm text-destructive text-center">{login.error.message}</p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

function RegisterForm({ register }: { register: any }) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      role: "lecturer",
    },
  });

  return (
    <Card className="border-none shadow-none">
      <form onSubmit={form.handleSubmit((data) => register.mutate(data))}>
        <CardContent className="space-y-4 px-0">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Full Name</Label>
            <Input id="reg-name" placeholder="Enter you Full Name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" placeholder="Educator@college.edu" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...form.register("passwordHash")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.passwordHash && (
              <p className="text-xs text-destructive">{form.formState.errors.passwordHash.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-0 flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
          {register.error && (
            <p className="text-sm text-destructive text-center">{register.error.message}</p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
