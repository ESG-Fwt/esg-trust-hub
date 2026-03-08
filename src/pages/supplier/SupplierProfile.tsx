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

const SupplierProfile = () => {
  const { user, profile, fetchProfile } = useAuthStore();
  const { toast } = useToast();
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
      toast({ title: 'Profile updated' });
    }
    setSaving(false);
  };

  return (
    <SupplierLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account details</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </CardTitle>
            <CardDescription>Update your display name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                Supplier
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
};

export default SupplierProfile;
