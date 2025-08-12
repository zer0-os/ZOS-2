import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLogin, useSignup, useSync, useAuth } from '@/hooks/useAuth';
import { DevAuthToggle } from './DevAuthToggle';
import type { LoginCredentials, SignupCredentials } from '@/types/auth';

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  className = '' 
}) => {
  const [loginData, setLoginData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState<SignupCredentials>({
    email: '',
    password: '',
    username: '',
    name: '',
    inviteCode: '',
  });

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const { isLoading, error, clearError } = useAuth();
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const syncMutation = useSync();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors before attempting login
    clearError();
    
    try {
      await loginMutation.mutateAsync(loginData);
      
      // After successful login, sync with invite code if provided
      if (signupData.inviteCode) {
        await syncMutation.mutateAsync({ inviteCode: signupData.inviteCode });
      }
      
      onSuccess?.();
    } catch (error) {
      // Error is handled by Zustand store
      console.error('Login error:', error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors before attempting signup
    signupMutation.reset();
    
    try {
      await signupMutation.mutateAsync(signupData);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation, but log for debugging
      console.error('Signup error:', error);
      // The form will remain usable for retry
    }
  };

  // Loading and error states come from Zustand store
  const isFormLoading = isLoading || syncMutation.isPending;
  const formError = error || syncMutation.error;

  return (
    <div className="w-full max-w-md space-y-4">
      <DevAuthToggle />
      
      <Card className={`p-6 ${className}`}>
        <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome</h1>
          <p className="text-muted-foreground">
            Sign in to your account or create a new one
          </p>
        </div>

        {formError && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start justify-between">
              <div>
                <strong>Login Failed:</strong> {formError.message || formError || 'An error occurred'}
                <div className="text-xs mt-1 text-destructive/80">
                  Please check your credentials and try again.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  syncMutation.reset();
                }}
                className="text-destructive/60 hover:text-destructive ml-2"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e) => {
                    setLoginData(prev => ({ ...prev, email: e.target.value }));
                    // Clear errors when user starts typing
                    if (error) clearError();
                  }}
                  required
                  disabled={isFormLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => {
                    setLoginData(prev => ({ ...prev, password: e.target.value }));
                    // Clear errors when user starts typing
                    if (error) clearError();
                  }}
                  required
                  disabled={isFormLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="invite-code" className="text-sm font-medium">
                  Invite Code (Optional)
                </label>
                <Input
                  id="invite-code"
                  type="text"
                  placeholder="Enter invite code if you have one"
                  value={signupData.inviteCode}
                  onChange={(e) => setSignupData(prev => ({ ...prev, inviteCode: e.target.value }))}
                  disabled={isFormLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isFormLoading ? 'Signing in...' : (formError ? 'Try Again' : 'Sign In')}
              </Button>
              
              {formError && !isFormLoading && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    The form is ready for another attempt. Please check your credentials.
                  </p>
                </div>
              )}
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="signup-name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Full name"
                    value={signupData.name}
                    onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={isFormLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Username"
                    value={signupData.username}
                    onChange={(e) => setSignupData(prev => ({ ...prev, username: e.target.value }))}
                    disabled={isFormLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={isFormLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signupData.password}
                  onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={isFormLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-invite-code" className="text-sm font-medium">
                  Invite Code (Optional)
                </label>
                <Input
                  id="signup-invite-code"
                  type="text"
                  placeholder="Enter invite code if you have one"
                  value={signupData.inviteCode}
                  onChange={(e) => setSignupData(prev => ({ ...prev, inviteCode: e.target.value }))}
                  disabled={isFormLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isFormLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        </div>
      </Card>
    </div>
  );
};
