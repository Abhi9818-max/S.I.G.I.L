
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, KeyRound } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

const setupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters.").max(20, "Username is too long."),
    password: z.string().min(6, "Password must be at least 6 characters.").max(50, "Password is too long."),
    gender: z.string({ required_error: "Please select your gender." }),
});

type LoginForm = z.infer<typeof loginSchema>;
type SetupForm = z.infer<typeof setupSchema>;

export default function LoginPage() {
  const { login, setupCredentials, loading, continueAsGuest } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
          <Image src="/loading.gif" alt="Loading..." width={242} height={242} unoptimized />
      </div>
    );
  }

  return (
    <div 
        className="min-h-screen flex items-center justify-center p-4 bg-no-repeat bg-cover bg-center"
        style={{backgroundImage: "url('https://placehold.co/1920x1080.png')"}}
        data-ai-hint="forest silhouette"
    >
      <div className="w-full max-w-sm p-8 space-y-8 bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 text-white animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-center">
            {isRegistering ? "Register" : "Login"}
          </h1>
        </div>
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
            <Input
              id="username"
              type="text"
              placeholder="Username"
              {...loginForm.register('username')}
              className="pl-10 bg-white/10 border-white/20 placeholder:text-gray-300 rounded-lg focus:bg-white/20 focus:ring-white/50"
            />
            {loginForm.formState.errors.username && <p className="text-sm text-red-400 mt-1">{loginForm.formState.errors.username.message}</p>}
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
            <Input
              id="password"
              type="password"
              placeholder="Password"
              {...loginForm.register('password')}
              className="pl-10 bg-white/10 border-white/20 placeholder:text-gray-300 rounded-lg focus:bg-white/20 focus:ring-white/50"
            />
            {loginForm.formState.errors.password && <p className="text-sm text-red-400 mt-1">{loginForm.formState.errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox id="remember-me" className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black" />
              <Label htmlFor="remember-me" className="ml-2 text-sm text-gray-300">Remember me</Label>
            </div>
            <a href="#" className="text-sm text-gray-300 hover:text-white">Forgot password?</a>
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 font-bold text-base rounded-lg" disabled={loginForm.formState.isSubmitting}>
            {loginForm.formState.isSubmitting ? "Logging in..." : 'Log In'}
          </Button>

          <div className="text-center text-sm text-gray-300">
             Don't have an account? <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="font-semibold text-white hover:underline">{isRegistering ? "Login" : "Register"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
