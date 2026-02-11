
export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weekday: string;
  entrance: string; // HH:mm
  lunchStart: string; // HH:mm
  lunchEnd: string; // HH:mm
  exit: string; // HH:mm
  totalWorkedMinutes: number;
  balanceMinutes: number; // Positive for extra, negative for deficit
}

export interface WorkSettings {
  dailyStandardMinutes: number; // Usually 480 (8h)
  employeeName: string;
  companyName: string;
}

export interface DashboardStats {
  totalWorkedMinutes: number;
  totalBalanceMinutes: number;
  entryCount: number;
}
