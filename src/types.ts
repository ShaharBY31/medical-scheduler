// Residents
export type ResidentGroup = 'זוטר' | 'מיון' | 'בכיר' | 'תורן חוץ';

export interface Resident {
  id: string;
  name: string;
  group: ResidentGroup;
  startDate: string; // Used to calculate seniority
  maxShiftsPerMonth: number;
}

// Shifts & Posts
export type PostType = 'shift' | 'department' | 'session' | 'other';

export interface Post {
  id: string;
  name: string;
  type: PostType;
  requiresRestDay: boolean; // e.g. ER and Senior shifts require true
  allowedGroups: ResidentGroup[];
  priority: number; 
  daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
}

// Schedule
export interface ScheduleDay {
  [postId: string]: string[]; // array of resident ids
}

export interface Schedule {
  [day: number]: ScheduleDay; // 1 to 31
}

// Stats & Preferences
export interface ResidentPreferences {
  vacationDays: number[]; // days off (1-31)
  shiftBlocks: number[];  // specific days blocked from shifts but allowed in department
}

export interface MonthState {
  year: number;
  month: number;
  schedule: Schedule;
  preferences: Record<string, ResidentPreferences>; // key: residentId
}

// Engine Config
export interface EngineConfig {
  preventConsecutiveShifts: boolean;
  enforcePostShiftRest: boolean;
  month: number;
  year: number;
}
