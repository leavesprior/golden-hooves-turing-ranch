import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const AuthNew = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Welcome to Back of Beyond Ranch!",
        });
        navigate('/');
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = () => {
    // Allow guest play without authentication
    toast({
      title: "Playing as Guest",
      description: "Your progress won't be saved",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-primary text-2xl pixel-text">
            🐸 GOLDEN HOOVES QUEST
          </h1>
          <p className="text-foreground text-xs pixel-text">
            {isSignUp ? 'Create your ranch account' : 'Welcome back, rancher!'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="bg-card border-4 border-border p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-primary text-xs pixel-text block">
              EMAIL
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="pixel-text text-xs border-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-primary text-xs pixel-text block">
              PASSWORD
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="pixel-text text-xs border-2"
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <label className="text-primary text-xs pixel-text block">
                USERNAME (OPTIONAL)
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ShadowRancher"
                className="pixel-text text-xs border-2"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground pixel-text text-xs py-6 border-2"
          >
            {loading ? 'LOADING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
          </Button>

          <Button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            variant="outline"
            className="w-full pixel-text text-xs border-2"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground pixel-text">
                OR
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGuestPlay}
            variant="ghost"
            className="w-full pixel-text text-xs border-2"
          >
            PLAY AS GUEST
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-[10px] pixel-text">
          © 2025 BACK OF BEYOND RANCH
        </p>
      </div>
    </div>
  );
};

export default AuthNew;
