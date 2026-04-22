import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resident, Post, Schedule, ResidentPreferences, EngineConfig } from '../types';
import { generateSchedule } from '../core/schedulerEngine';

interface SchedulerState {
  residents: Resident[];
  posts: Post[];
  schedule: Schedule;
  preferences: Record<string, ResidentPreferences>;
  month: number;
  year: number;
  
  // Actions
  addResident: (resident: Resident) => void;
  updateResident: (id: string, data: Partial<Resident>) => void;
  deleteResident: (id: string) => void;
  setSchedule: (schedule: Schedule) => void;
  setMonthYear: (month: number, year: number) => void;
  updateDaySchedule: (day: number, updates: Record<string, string[]>) => void;
  runGenerator: (config: EngineConfig) => void;
}

export const useSchedulerStore = create<SchedulerState>()(
  persist(
    (set, get) => ({
      residents: [
        { id: "ari", name: "ארי", group: "זוטר", startDate: "2024-07-01", maxShiftsPerMonth: 6 },
        { id: "irit", name: "אירית", group: "זוטר", startDate: "2025-01-01", maxShiftsPerMonth: 6 },
        { id: "asaf", name: "אסף", group: "בכיר", startDate: "2020-07-01", maxShiftsPerMonth: 12 },
        { id: "amir", name: "אמיר", group: "בכיר", startDate: "2020-08-01", maxShiftsPerMonth: 12 },
        { id: "boris", name: "בוריס", group: "בכיר", startDate: "2021-07-01", maxShiftsPerMonth: 12 },
        { id: "taib", name: "טייב", group: "מיון", startDate: "2021-08-01", maxShiftsPerMonth: 10 },
        { id: "muhammad", name: "מוחמד", group: "בכיר", startDate: "2022-07-01", maxShiftsPerMonth: 12 },
        { id: "shani", name: "שני", group: "בכיר", startDate: "2022-08-01", maxShiftsPerMonth: 12 },
        { id: "dana", name: "דנה", group: "בכיר", startDate: "2023-07-01", maxShiftsPerMonth: 12 },
        { id: "haim", name: "חיים", group: "בכיר", startDate: "2023-08-01", maxShiftsPerMonth: 12 },
        { id: "maria", name: "מריה", group: "בכיר", startDate: "2024-07-01", maxShiftsPerMonth: 12 },
        { id: "chen", name: "חן", group: "בכיר", startDate: "2024-08-01", maxShiftsPerMonth: 12 },
        { id: "noor", name: "נור", group: "בכיר", startDate: "2024-09-01", maxShiftsPerMonth: 12 },
        { id: "shahar", name: "שחר", group: "מיון", startDate: "2023-07-01", maxShiftsPerMonth: 10 },
        { id: "netanel", name: "נתנאל", group: "מיון", startDate: "2023-08-01", maxShiftsPerMonth: 10 },
        { id: "rafael", name: "רפאל", group: "מיון", startDate: "2024-07-01", maxShiftsPerMonth: 10 },
        { id: "hamdan", name: "חמדאן", group: "מיון", startDate: "2024-08-01", maxShiftsPerMonth: 10 },
        { id: "khaled_ext", name: "חאלד", group: "תורן חוץ", startDate: "2020-01-01", maxShiftsPerMonth: 6 },
        { id: "suleiman_ext", name: "סלימאן", group: "תורן חוץ", startDate: "2021-03-01", maxShiftsPerMonth: 6 },
        { id: "muhammad_h_ext", name: "מוחמד ח", group: "תורן חוץ", startDate: "2022-06-01", maxShiftsPerMonth: 6 },
        { id: "ali_ext", name: "עלי", group: "תורן חוץ", startDate: "2023-02-01", maxShiftsPerMonth: 6 }
      ],
      posts: [
        // SHIFTS & SESSIONS
        { id: 'p_hazi', name: 'תורן חצי', type: 'shift', requiresRestDay: false, allowedGroups: ['זוטר', 'תורן חוץ'], priority: 8, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'p_miyun', name: 'תורן מיון', type: 'shift', requiresRestDay: true, allowedGroups: ['מיון', 'בכיר'], priority: 10, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'p_bahir', name: 'תורן בכיר', type: 'shift', requiresRestDay: true, allowedGroups: ['בכיר'], priority: 10, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'p_rest', name: 'אחרי תורנות', type: 'other', requiresRestDay: false, allowedGroups: ['מיון', 'בכיר'], priority: 0, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'p_sess_b', name: 'ססיה בכיר', type: 'session', requiresRestDay: false, allowedGroups: ['בכיר'], priority: 3, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_sess_z', name: 'ססיה זוטר', type: 'session', requiresRestDay: false, allowedGroups: ['זוטר', 'מיון'], priority: 3, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_vac', name: 'חופש', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר', 'מיון', 'בכיר', 'תורן חוץ'], priority: 0, daysOfWeek: [0,1,2,3,4,5,6] },

        // DAILY STATIONS
        { id: 'p_dept', name: 'מחלקה', type: 'department', requiresRestDay: false, allowedGroups: ['זוטר', 'מיון', 'בכיר'], priority: 10, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_er1', name: 'מיון', type: 'department', requiresRestDay: false, allowedGroups: ['מיון', 'בכיר'], priority: 10, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_er2', name: 'מיון 2', type: 'department', requiresRestDay: false, allowedGroups: ['זוטר', 'מיון', 'בכיר'], priority: 9, daysOfWeek: [0, 1, 2, 3, 4] },
        
        { id: 'p_or1', name: 'ח.נ גדול 1', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 9, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_or2', name: 'ח.נ גדול 2', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 8, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_or3', name: 'ח.נ גדול 3', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 0, daysOfWeek: [0, 1, 2, 3, 4] },
        
        { id: 'p_ds1', name: 'אשפוז יום ספורט', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 6, daysOfWeek: [0, 3] },
        { id: 'p_ds2', name: 'אשפוז יום כף יד', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 6, daysOfWeek: [0, 2] },
        { id: 'p_ds3', name: 'אשפוז יום כף רגל', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 6, daysOfWeek: [0] },
        
        { id: 'p_cl1', name: 'מ. ילדים', type: 'other', requiresRestDay: false, allowedGroups: ['מיון','בכיר'], priority: 5, daysOfWeek: [0, 2] },
        { id: 'p_cl2', name: 'מ. ספורט', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 5, daysOfWeek: [1, 4] },
        { id: 'p_cl3', name: 'מ. כף יד', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 5, daysOfWeek: [1, 4] },
        { id: 'p_cl4', name: 'מ. שברים', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 5, daysOfWeek: [1, 3] },
        { id: 'p_cl5', name: 'מ. מעקב ניתוחים', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 4, daysOfWeek: [3] },
        { id: 'p_cl6', name: 'מ. כף רגל', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 4, daysOfWeek: [2] },
        { id: 'p_cl7', name: 'מ. מפרקים', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 0, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_cl8', name: 'מ. גב', type: 'other', requiresRestDay: false, allowedGroups: ['זוטר','מיון','בכיר'], priority: 0, daysOfWeek: [0, 1, 2, 3, 4] },
        
        { id: 'p_ex1', name: 'רמז', type: 'other', requiresRestDay: false, allowedGroups: ['מיון','בכיר'], priority: 8, daysOfWeek: [2, 3, 4] },
        { id: 'p_ex2', name: 'יבנה', type: 'other', requiresRestDay: false, allowedGroups: ['מיון','בכיר'], priority: 7, daysOfWeek: [1] },
        { id: 'p_ex3', name: 'אשדוד', type: 'other', requiresRestDay: false, allowedGroups: ['מיון','בכיר'], priority: 8, daysOfWeek: [0, 1, 2, 3, 4] }
      ],
      schedule: {},
      preferences: {},
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      
      addResident: (resident) => set((state) => ({ residents: [...state.residents, resident] })),
      updateResident: (id, data) => set((state) => ({
        residents: state.residents.map(r => r.id === id ? { ...r, ...data } : r)
      })),
      deleteResident: (id) => set((state) => ({
        residents: state.residents.filter(r => r.id !== id)
      })),
      setSchedule: (schedule) => set({ schedule }),
      updateDaySchedule: (day, updates) => set((state) => {
        const newSchedule = { ...state.schedule };
        if (!newSchedule[day]) newSchedule[day] = {};
        newSchedule[day] = { ...newSchedule[day], ...updates };
        return { schedule: newSchedule };
      }),
      setMonthYear: (month, year) => set({ month, year }),
      runGenerator: (config) => {
        const { residents, posts, preferences } = get();
        const newSchedule = generateSchedule({ residents, posts, preferences, config });
        set({ schedule: newSchedule });
      }
    }),
    {
      name: 'medical-scheduler-v2-storage',
      version: 3, // Bumped: updates mion/mion2 daysOfWeek to exclude weekends
      partialize: (state) => ({
        residents: state.residents,
        preferences: state.preferences,
        schedule: state.schedule,
        month: state.month,
        year: state.year,
        // NOTE: posts are NOT persisted so config changes always take effect
      }),
    }
  )
);
