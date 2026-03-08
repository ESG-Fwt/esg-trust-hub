import { useState } from 'react';
import { SupplierLayout } from '@/components/supplier/SupplierLayout';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SupplierProfile = () => {
  const { user, profile, fetchProfile } = useAuthStore();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchProfile(user.id);
      toast({ title: t('profile.profileUpdated') });
    }
    setSaving(false);
  };

  return (
    <SupplierLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('profile.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" /> {t('profile.personalInfo')}
            </CardTitle>
            <CardDescription>{t('profile.updateName')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('profile.role')}</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                {t('auth.supplier')}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
};

export default SupplierProfile;
