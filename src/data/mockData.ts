export interface Verification {
  id: string;
  workerId: string;
  workerName: string;
  workerSkill: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  comment: string;
  timestamp: Date;
  isRepeatCustomer: boolean;
  workerType?: 0 | 1;
  amount?: number;
  paymentStatus?: "Paid" | "Pending";
}

export interface MonthlyData {
  month: string;
  jobs: number;
  rating: number;
  earnings: number;
}

export const MOCK_VERIFICATIONS: Verification[] = [];
export const MONTHLY_DATA: MonthlyData[] = [];

export const getAverageRating = (verifications: Verification[]) => {
  return 0;
};

export const getRepeatCustomers = (verifications: Verification[]) => {
  return [];
};

export const MOCK_DASHBOARD_DATA = {
  summary: { totalJobs: 0, activeMonths: 0, repeatCustomers: 0 },
  performance: { avgRating: 0, topSkills: [], issues: [] },
  financial: {
    incomeRange: { min: 0, max: 0 },
    perJobIncome: 0,
    totalEarnings: 0,
    safeEMI: 0,
    loanRange: { min: 0, max: 0 }
  },
  confidence: "LOW",
  loan: {
    safeEMI: 0,
    range: { min: 0, max: 0 }
  },
  trust: {
    muktiScore: 0,
    fraudRisk: "LOW",
    riskIndicators: []
  }
};

export const DEMO_VERIFICATIONS = MOCK_VERIFICATIONS;
export const DEMO_DASHBOARD_DATA = MOCK_DASHBOARD_DATA;
