import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Password reset link sent!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">ESG Chain</span>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
            <p className="text-muted-foreground">We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/login">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
              <p className="mt-2 text-muted-foreground">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
