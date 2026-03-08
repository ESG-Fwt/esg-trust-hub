import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, UserPlus, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  organization_id: string | null;
  created_at: string;
  role?: string;
  org_name?: string;
}

const UsersView = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (profiles ?? []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        organization_id: p.organization_id,
        created_at: p.created_at,
        role: p.user_roles?.[0]?.role ?? 'supplier',
      })) as UserProfile[];
    },
  });

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const assignOrgMutation = useMutation({
    mutationFn: async ({ userId, orgId }: { userId: string; orgId: string | null }) => {
      const { error } = await supabase.from('profiles').update({ organization_id: orgId }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
      setIsAssigning(false);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to assign'),
  });

  const filtered = users?.filter((u) =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignOrg = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedOrgId(user.organization_id ?? '');
    setIsAssigning(true);
  };

  const orgMap = Object.fromEntries((orgs ?? []).map((o) => [o.id, o.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users and assign organizations</p>
        </div>
        <Badge variant="secondary" className="text-xs font-normal">{users?.length ?? 0} users</Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Organization</TableHead>
                <TableHead className="text-xs">Joined</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((user, i) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{user.full_name}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'manager' ? 'default' : 'secondary'} className="text-[11px]">
                      {user.role === 'manager' ? <Shield className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.organization_id ? orgMap[user.organization_id] ?? 'Unknown' : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleAssignOrg(user)} className="h-7 text-xs">
                      <Building2 className="w-3.5 h-3.5 mr-1" /> Assign Org
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">No users found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAssigning} onOpenChange={setIsAssigning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Organization</DialogTitle>
            <DialogDescription>Assign {selectedUser?.full_name} to an organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Organization</SelectItem>
                  {orgs?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssigning(false)}>Cancel</Button>
            <Button
              onClick={() => selectedUser && assignOrgMutation.mutate({
                userId: selectedUser.user_id,
                orgId: selectedOrgId === 'none' ? null : selectedOrgId || null,
              })}
              disabled={assignOrgMutation.isPending}
            >
              {assignOrgMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersView;
