export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  grade?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  currentStreak: number;
}

export interface Student extends User {
  gamificationProfile?: GamificationProfile;
}

export interface Teacher extends User {
  courses?: Course[];
}

export interface Course {
  id: string;
  title: string;
  description?: string | null;
  subjectId?: string | null;
  grade?: string | null;
  createdAt: string;
  teacher?: { fullName: string };
  subject?: { name: string };
  _count?: { lessons: number; enrollments: number };
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  conversationId: string;
}

export interface Proposal {
  id: string;
  title: string;
  content: string;
  status: string;
  teacher?: { fullName: string };
  createdAt: string;
}

export interface Document {
  id: string;
  fileName: string;
  courseTitle?: string;
  size?: string;
  status: string;
  date?: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeTeachers: number;
  totalLessons: number;
  monthlyCost: number;
  recentActivity: ActivityItem[];
  tokenUsage: TokenUsage[];
  completionRate: number;
  dailyActiveData: DailyActiveData[];
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string | Date;
}

export interface TokenUsage {
  name: string;
  value: number;
  color: string;
  displayValue: string;
}

export interface DailyActiveData {
  name: string;
  value: number;
}
