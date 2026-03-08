import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Building2, Users, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore, UserRole } from '@/stores/authStore';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, signup, isAuthenticated, role } = useAuthStore();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>('supplier');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(role === 'manager' ? '/admin/dashboard' : '/supplier/submit');
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignup) {
        if (!fullName) {
          toast.error('Please enter your full name');
          setIsLoading(false);
          return;
        }
        await signup(email, password, fullName, selectedRole);
        toast.success('Account created! Check your email for confirmation.');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error('Google sign-in failed');
  };

  const handleAppleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error('Apple sign-in failed');
  };

  const roleCards = [
    {
      role: 'supplier' as UserRole,
      icon: Building2,
      title: t('auth.supplier'),
      description: t('auth.supplierDesc'),
      gradient: 'from-emerald-500 to-emerald-700',
    },
    {
      role: 'manager' as UserRole,
      icon: Users,
      title: t('auth.manager'),
      description: t('auth.managerDesc'),
      gradient: 'from-slate-600 to-slate-800',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      {/* Left Panel - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-emerald-700 to-emerald-900 p-12 flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">ESG Chain</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white leading-tight">
              {t('brand.title').split(' ').slice(0, 2).join(' ')}
              <br />
              {t('brand.title').split(' ').slice(2).join(' ')}
            </h1>
            <p className="text-xl text-white/80 max-w-md">{t('brand.subtitle')}</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {[t('brand.feature1'), t('brand.feature2'), t('brand.feature3')].map((text) => (
            <div key={text} className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-medium">✓</span>
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">ESG Chain</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">{isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}</h2>
            <p className="mt-2 text-muted-foreground">
              {isSignup ? t('auth.selectRole') : t('auth.signInContinue')}
            </p>
          </div>

          {/* Role Selection (signup only) */}
          {isSignup && (
            <div className="grid grid-cols-2 gap-4">
              {roleCards.map((card) => (
                <motion.button
                  key={card.role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(card.role)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedRole === card.role
                      ? 'border-primary bg-accent shadow-lg'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground">{card.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  {selectedRole === card.role && (
                    <motion.div
                      layoutId="selectedIndicator"
                      className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">{t('auth.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isSignup ? t('auth.creatingAccount') : t('auth.signingIn')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isSignup ? t('auth.createAccount') : t('auth.signIn')}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t('auth.orContinue')}</span></div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" onClick={handleGoogleSignIn} className="h-12">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </Button>
            <Button variant="outline" type="button" onClick={handleAppleSignIn} className="h-12">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Apple
            </Button>
          </div>

          <div className="text-center space-y-2">
            {!isSignup && (
              <p className="text-sm">
                <Link to="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">{t('auth.forgotPassword')}</Link>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {isSignup ? (
                <>{t('auth.hasAccount')} <button type="button" onClick={() => setIsSignup(false)} className="text-primary font-medium hover:underline">{t('auth.signInLink')}</button></>
              ) : (
                <>{t('auth.noAccount')} <button type="button" onClick={() => setIsSignup(true)} className="text-primary font-medium hover:underline">{t('auth.createOne')}</button></>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
