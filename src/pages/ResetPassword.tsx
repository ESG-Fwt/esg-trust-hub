import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    // Also check hash fragment
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Loading recovery session...</p>
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">ESG Chain</span>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
          <p className="mt-2 text-muted-foreground">Choose a strong password for your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="confirm" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 h-12" />
            </div>
          </div>
          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
