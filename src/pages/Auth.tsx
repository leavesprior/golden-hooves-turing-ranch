import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      
      toast({
        title: "Signed in as guest",
        description: "Welcome to the ranch!",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      
      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary pixel-text">
            BACK OF BEYOND RANCH
          </h1>
          <p className="text-muted-foreground pixel-text text-sm">
            Sign in to save your progress
          </p>
        </div>

        <div className="bg-card border-2 border-border p-6 space-y-6">
          <div className="space-y-4">
            <Button
              onClick={handleGuestSignIn}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground pixel-text"
            >
              CONTINUE AS GUEST
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground pixel-text">
                  Or sign in with email
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pixel-text"
                disabled={loading}
              />
              <Button
                onClick={handleMagicLink}
                disabled={loading}
                variant="outline"
                className="w-full pixel-text"
              >
                SEND MAGIC LINK
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pixel-text">
            No password required. We'll send you a secure link.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
