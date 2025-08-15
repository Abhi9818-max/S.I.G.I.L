
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

const setupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters.").max(20, "Username is too long."),
    password: z.string().min(6, "Password must be at least 6 characters.").max(50, "Password is too long."),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
        required_error: "You need to select a gender option.",
    }),
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
  
  const setupForm = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
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
    const success = await setupCredentials(data.username, data.password, data.gender);
    if (!success) {
      setError("Failed to create account. Username might be taken.");
      setupForm.reset();
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
          <Image src="/loading.gif" alt="Loading..." width={242} height={242} unoptimized />
      </div>
    );
  }

  const renderLoginForm = () => (
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
      </form>
  );

  const renderRegisterForm = () => (
      <form onSubmit={setupForm.handleSubmit(handleSetup)} className="space-y-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
            <Input
              id="reg-username"
              type="text"
              placeholder="Username"
              {...setupForm.register('username')}
              className="pl-10 bg-white/10 border-white/20 placeholder:text-gray-300 rounded-lg focus:bg-white/20 focus:ring-white/50"
            />
            {setupForm.formState.errors.username && <p className="text-sm text-red-400 mt-1">{setupForm.formState.errors.username.message}</p>}
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
            <Input
              id="reg-password"
              type="password"
              placeholder="Password"
              {...setupForm.register('password')}
              className="pl-10 bg-white/10 border-white/20 placeholder:text-gray-300 rounded-lg focus:bg-white/20 focus:ring-white/50"
            />
            {setupForm.formState.errors.password && <p className="text-sm text-red-400 mt-1">{setupForm.formState.errors.password.message}</p>}
          </div>
           <div>
              <Label className="text-gray-300">Gender</Label>
              <RadioGroup
                  onValueChange={(value) => setupForm.setValue('gender', value as any)}
                  className="grid grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="g-male" className="border-white/50 text-white" />
                  <Label htmlFor="g-male" className="text-gray-300">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="g-female" className="border-white/50 text-white"/>
                  <Label htmlFor="g-female" className="text-gray-300">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="g-other" className="border-white/50 text-white"/>
                  <Label htmlFor="g-other" className="text-gray-300">Other</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prefer_not_to_say" id="g-none" className="border-white/50 text-white"/>
                  <Label htmlFor="g-none" className="text-gray-300">Prefer not to say</Label>
                </div>
              </RadioGroup>
              {setupForm.formState.errors.gender && <p className="text-sm text-red-400 mt-1">{setupForm.formState.errors.gender.message}</p>}
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 font-bold text-base rounded-lg" disabled={setupForm.formState.isSubmitting}>
            {setupForm.formState.isSubmitting ? "Creating Account..." : 'Register'}
          </Button>
      </form>
  );

  return (
    <div 
        className="min-h-screen flex items-center justify-center p-4 bg-no-repeat bg-cover bg-center"
        style={{backgroundImage: "url('/Login.gif')"}}
    >
      <div className="w-full max-w-sm p-8 space-y-8 bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 text-white animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-center">
            {isRegistering ? "Register" : "Login"}
          </h1>
        </div>
        
        {isRegistering ? renderRegisterForm() : renderLoginForm()}
        
        <div className="text-center text-sm text-gray-300">
           {isRegistering ? "Already have an account? " : "Don't have an account? "}
           <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(null); }} className="font-semibold text-white hover:underline">
             {isRegistering ? "Login" : "Register"}
            </button>
        </div>
      </div>
    </div>
  );
}
