
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, KeyRound, User, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

const setupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters.").max(20, "Username is too long."),
    password: z.string().min(6, "Password must be at least 6 characters.").max(50, "Password is too long."),
});

type LoginForm = z.infer<typeof loginSchema>;
type SetupForm = z.infer<typeof setupSchema>;

export default function LoginPage() {
  const { login, setupCredentials, loading, continueAsGuest } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const setupForm = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: { username: '', password: '' },
  });

  const handleLogin = async (data: LoginForm) => {
    setError(null);
    const success = await login(data.username, data.password);
    if (!success) {
      setError("Invalid username or password.");
      loginForm.reset();
    }
  };

  const handleSetup = async (data: SetupForm) => {
    setError(null);
    const success = await setupCredentials(data.username, data.password);
    if (!success) {
      setError("An account with this username may already exist, or another error occurred.");
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
          <Image src="/loading.gif" alt="Loading..." className="w-72 h-72 md:w-96 md:h-96" width={384} height={384} unoptimized />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full shadow-2xl animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <CardTitle>Welcome to S.I.G.I.L.</CardTitle>
          </div>
          <CardDescription>
             Enter your credentials to access your records.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                     <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-username">Username</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="login-username" type="text" {...loginForm.register('username')} className="pl-10" />
                          </div>
                          {loginForm.formState.errors.username && <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.username.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="login-password" type="password" {...loginForm.register('password')} className="pl-10" />
                          </div>
                          {loginForm.formState.errors.password && <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.password.message}</p>}
                        </div>
                        
                        {error && <p className="text-sm text-destructive text-center">{error}</p>}

                        <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                          {loginForm.formState.isSubmitting ? "Logging in..." : 'Login'}
                        </Button>
                      </form>
                </TabsContent>
                <TabsContent value="signup">
                    <form onSubmit={setupForm.handleSubmit(handleSetup)} className="space-y-6 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-username">Username</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="signup-username" type="text" {...setupForm.register('username')} className="pl-10" />
                          </div>
                          {setupForm.formState.errors.username && <p className="text-sm text-destructive mt-1">{setupForm.formState.errors.username.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="signup-password" type="password" {...setupForm.register('password')} className="pl-10" />
                          </div>
                          {setupForm.formState.errors.password && <p className="text-sm text-destructive mt-1">{setupForm.formState.errors.password.message}</p>}
                        </div>
                        
                        {error && <p className="text-sm text-destructive text-center">{error}</p>}

                        <Button type="submit" className="w-full" disabled={setupForm.formState.isSubmitting}>
                          {setupForm.formState.isSubmitting ? "Creating Account..." : 'Create Account & Enter'}
                        </Button>
                      </form>
                </TabsContent>
            </Tabs>

            <div className="relative py-4">
              <Separator />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-card text-xs text-muted-foreground">
                OR
              </div>
            </div>

            <Button variant="secondary" className="w-full" onClick={continueAsGuest}>
                <Users className="mr-2 h-4 w-4" />
                Continue as Guest
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">Guest data is stored locally and will be lost if you clear your browser data.</p>
        </CardContent>
      </Card>
    </div>
  );
}
