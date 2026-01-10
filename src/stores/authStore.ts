import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'supplier' | 'manager';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

// Mock users for demo
const mockUsers = {
  supplier: {
    id: 'supplier-001',
    email: 'supplier@esgchain.io',
    name: 'Marco Rossi',
    role: 'supplier' as UserRole,
    company: 'Green Energy Solutions SRL',
  },
  manager: {
    id: 'manager-001',
    email: 'manager@esgchain.io',
    name: 'Dr. Elena Conti',
    role: 'manager' as UserRole,
    company: 'ESG Chain Platform',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string, role: UserRole) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        // Demo login - accept any credentials
        const user = mockUsers[role];
        set({ user: { ...user, email }, isAuthenticated: true });
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'esg-auth-storage',
    }
  )
);
