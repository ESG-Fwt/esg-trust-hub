// Mock API service simulating microservices backend

import { EnergyData } from '@/stores/wizardStore';

// Simulated delays for realistic UX
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock submission data
export interface Submission {
  id: string;
  date: string;
  supplierName: string;
  supplierCompany: string;
  electricity: number;
  gas: number;
  fuel: number;
  waste: number;
  totalEmissions: number;
  status: 'pending' | 'approved' | 'rejected';
  auditHash?: string;
  verifiedAt?: string;
  pdfUrl?: string;
}

// Generate mock submissions
const generateMockSubmissions = (): Submission[] => {
  const statuses: ('pending' | 'approved' | 'rejected')[] = ['pending', 'approved', 'rejected'];
  const companies = [
    'Green Energy Solutions SRL',
    'EcoTech Manufacturing',
    'Sustainable Logistics SpA',
    'CleanPower Industries',
    'BioChem Solutions',
    'EarthFirst Packaging',
  ];
  const names = ['Marco Rossi', 'Giulia Bianchi', 'Alessandro Verde', 'Sofia Marino', 'Luca Ferrari', 'Emma Costa'];
  
  return Array.from({ length: 12 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * 3)];
    const electricity = Math.floor(Math.random() * 500) + 100;
    const gas = Math.floor(Math.random() * 200) + 50;
    const fuel = Math.floor(Math.random() * 100);
    const waste = Math.floor(Math.random() * 80) + 20;
    const totalEmissions = Math.round(electricity * 0.5 + gas * 2.0 + fuel * 2.5 + waste * 0.3);
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    return {
      id: `SUB-${String(i + 1).padStart(4, '0')}`,
      date: date.toISOString().split('T')[0],
      supplierName: names[i % names.length],
      supplierCompany: companies[i % companies.length],
      electricity,
      gas,
      fuel,
      waste,
      totalEmissions,
      status,
      auditHash: status === 'approved' ? generateHash() : undefined,
      verifiedAt: status === 'approved' ? new Date().toISOString() : undefined,
      pdfUrl: '/sample-invoice.pdf',
    };
  });
};

const generateHash = (): string => {
  const chars = '0123456789abcdef';
  return 'SHA-256: ' + Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('');
};

let mockSubmissions = generateMockSubmissions();

export const mockApi = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      await delay(800);
      return { success: true, token: 'mock-jwt-token' };
    },
    register: async (email: string, password: string, role: string) => {
      await delay(1000);
      return { success: true, message: 'Registration successful' };
    },
  },

  // Upload endpoint
  upload: {
    file: async (file: File) => {
      await delay(1500);
      return { 
        success: true, 
        fileUrl: `https://storage.esgchain.io/uploads/${file.name}`,
        fileId: `FILE-${Date.now()}`,
      };
    },
  },

  // AI Engine endpoint
  ai: {
    extract: async (fileUrl: string): Promise<{ success: boolean; data: EnergyData }> => {
      // Simulate AI processing stages
      await delay(2000);
      
      // Return mock extracted data
      return {
        success: true,
        data: {
          electricity: 450,
          gas: 120,
          fuel: 0,
          waste: 50,
          water: 0,
        },
      };
    },
  },

  // Submission endpoint
  submission: {
    submit: async (data: EnergyData): Promise<{ success: boolean; submissionId: string }> => {
      await delay(1200);
      const submissionId = `SUB-${Date.now()}`;
      return { success: true, submissionId };
    },
    
    getAll: async (): Promise<Submission[]> => {
      await delay(600);
      return mockSubmissions;
    },
    
    updateStatus: async (id: string, status: 'approved' | 'rejected'): Promise<{ success: boolean }> => {
      await delay(800);
      mockSubmissions = mockSubmissions.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              status,
              auditHash: status === 'approved' ? generateHash() : undefined,
              verifiedAt: status === 'approved' ? new Date().toISOString() : undefined,
            }
          : sub
      );
      return { success: true };
    },
  },

  // Audit endpoint
  audit: {
    getLogs: async (submissionId: string) => {
      await delay(400);
      return {
        success: true,
        logs: [
          { timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'CREATED', hash: generateHash() },
          { timestamp: new Date(Date.now() - 43200000).toISOString(), action: 'AI_EXTRACTED', hash: generateHash() },
          { timestamp: new Date().toISOString(), action: 'SUBMITTED', hash: generateHash() },
        ],
      };
    },
  },

  // Dashboard stats
  dashboard: {
    getStats: async () => {
      await delay(400);
      const pending = mockSubmissions.filter((s) => s.status === 'pending').length;
      const approved = mockSubmissions.filter((s) => s.status === 'approved').length;
      const total = mockSubmissions.length;
      const totalEmissions = mockSubmissions.reduce((sum, s) => sum + s.totalEmissions, 0);
      
      return {
        pendingReviews: pending,
        complianceRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        totalEmissions,
        activeSuppliers: 6,
      };
    },
  },
};
