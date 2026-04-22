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
  isAdminMode: boolean;
  adminPassword: string | null;
  addResident: (resident: Resident) => void;
  updateResident: (id: string, data: Partial<Resident>) => void;
  deleteResident: (id: string) => void;
  setSchedule: (schedule: Schedule) => void;
  setMonthYear: (month: number, year: number) => void;
  updateDaySchedule: (day: number, updates: Record<string, string[]>) => void;
  runGenerator: (config: EngineConfig) => void;
  setAdminMode: (password: string) => Promise<boolean>;
  exitAdminMode: () => void;
  loadFromServer: () => Promise<void>;
}

export const useSchedulerStore = create<SchedulerState>()(
  persist(
    (set, get) => ({
      residents: [
        { id: "ari", name: "\u05d0\u05e8\u05d9", group: "\u05d6\u05d5\u05d8\u05e8", startDate: "2024-07-01", maxShiftsPerMonth: 6 },
        { id: "irit", name: "\u05d0\u05d9\u05e8\u05d9\u05ea", group: "\u05d6\u05d5\u05d8\u05e8", startDate: "2025-01-01", maxShiftsPerMonth: 6 },
        { id: "asaf", name: "\u05d0\u05e1\u05e3", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2020-07-01", maxShiftsPerMonth: 12 },
        { id: "amir", name: "\u05d0\u05de\u05d9\u05e8", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2020-08-01", maxShiftsPerMonth: 12 },
        { id: "boris", name: "\u05d1\u05d5\u05e8\u05d9\u05e1", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2021-07-01", maxShiftsPerMonth: 12 },
        { id: "taib", name: "\u05d8\u05d9\u05d9\u05d1", group: "\u05de\u05d9\u05d5\u05df", startDate: "2021-08-01", maxShiftsPerMonth: 10 },
        { id: "muhammad", name: "\u05de\u05d5\u05d7\u05de\u05d3", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2022-07-01", maxShiftsPerMonth: 12 },
        { id: "shani", name: "\u05e9\u05e0\u05d9", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2022-08-01", maxShiftsPerMonth: 12 },
        { id: "dana", name: "\u05d3\u05e0\u05d4", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2023-07-01", maxShiftsPerMonth: 12 },
        { id: "haim", name: "\u05d7\u05d9\u05d9\u05dd", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2023-08-01", maxShiftsPerMonth: 12 },
        { id: "maria", name: "\u05de\u05e8\u05d9\u05d4", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2024-07-01", maxShiftsPerMonth: 12 },
        { id: "chen", name: "\u05d7\u05df", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2024-08-01", maxShiftsPerMonth: 12 },
        { id: "noor", name: "\u05e0\u05d5\u05e8", group: "\u05d1\u05db\u05d9\u05e8", startDate: "2024-09-01", maxShiftsPerMonth: 12 },
        { id: "shahar", name: "\u05e9\u05d7\u05e8", group: "\u05de\u05d9\u05d5\u05df", startDate: "2023-07-01", maxShiftsPerMonth: 10 },
        { id: "netanel", name: "\u05e0\u05ea\u05e0\u05d0\u05dc", group: "\u05de\u05d9\u05d5\u05df", startDate: "2023-08-01", maxShiftsPerMonth: 10 },
        { id: "rafael", name: "\u05e8\u05e4\u05d0\u05dc", group: "\u05de\u05d9\u05d5\u05df", startDate: "2024-07-01", maxShiftsPerMonth: 10 },
        { id: "hamdan", name: "\u05d7\u05de\u05d3\u05d0\u05df", group: "\u05de\u05d9\u05d5\u05df", startDate: "2024-08-01", maxShiftsPerMonth: 10 },
        { id: "khaled_ext", name: "\u05d7\u05d0\u05dc\u05d3", group: "\u05ea\u05d5\u05e8\u05df \u05d7\u05d5\u05e5", startDate: "2020-01-01", maxShiftsPerMonth: 6 },
        { id: "suleiman_ext", name: "\u05e1\u05dc\u05d9\u05de\u05d0\u05df", group: "\u05ea\u05d5\u05e8\u05df \u05d7\u05d5\u05e5", startDate: "2021-03-01", maxShiftsPerMonth: 6 },
        { id: "muhammad_h_ext", name: "\u05de\u05d5\u05d7\u05de\u05d3 \u05d7", group: "\u05ea\u05d5\u05e8\u05df \u05d7\u05d5\u05e5", startDate: "2022-06-01", maxShiftsPerMonth: 6 },
        { id: "ali_ext", name: "\u05e2\u05dc\u05d9", group: "\u05ea\u05d5\u05e8\u05df \u05d7\u05d5\u05e5", startDate: "2023-02-01", maxShiftsPerMonth: 6 }
      ],
      posts: [
        { id: 'p_hazi', name: '\u05ea\u05d5\u05e8\u05df \u05d7\u05e6\u05d9', type: 'shift', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8', '\u05ea\u05d5\u05e8\u05df \u05d7\u05d5\u05e5'], priority: 8, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'p_miyun', name: '\u05ea\u05d5\u05e8\u05df \u05de\u05d9\u05d5\u05df', type: 'shift', requiresRestDay: true, allowedGroups: ['\u05de\u05d9\u05d5\u05df', '\u05d1\u05db\u05d9\u05e8'], priority: 10, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'p_bahir', name: '\u05ea\u05d5\u05e8\u05df \u05d1\u05db\u05d9\u05e8', type: 'shift', requiresRestDay: true, allowedGroups: ['\u05d1\u05db\u05d9\u05e8'], priority: 10, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'p_rest', name: '\u05d0\u05d7\u05e8\u05d9 \u05ea\u05d5\u05e8\u05e0\u05d5\u05ea', type: 'other', requiresRestDay: false, allowedGroups: ['\u05de\u05d9\u05d5\u05df', '\u05d1\u05db\u05d9\u05e8'], priority: 0, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'p_sess_b', name: '\u05e1\u05e1\u05d9\u05d4 \u05d1\u05db\u05d9\u05e8', type: 'session', requiresRestDay: false, allowedGroups: ['\u05d1\u05db\u05d9\u05e8'], priority: 3, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_sess_z', name: '\u05e1\u05e1\u05d9\u05d4 \u05d6\u05d5\u05d8\u05e8', type: 'session', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8', '\u05de\u05d9\u05d5\u05df'], priority: 3, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_vac', name: '\u05d7\u05d5\u05e4\u05e9', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8', '\u05de\u05d9\u05d5\u05df', '\u05d1\u05db\u05d9\u05e8', '\u05ea\u05d5\u05e8\u05df \u05d7\u05d5\u05e5'], priority: 0, daysOfWeek: [0,1,2,3,4,5,6] },
        { id: 'p_dept', name: '\u05de\u05d7\u05dc\u05e7\u05d4', type: 'department', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8', '\u05de\u05d9\u05d5\u05df', '\u05d1\u05db\u05d9\u05e8'], priority: 10, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_er1', name: '\u05de\u05d9\u05d5\u05df', type: 'department', requiresRestDay: false, allowedGroups: ['\u05de\u05d9\u05d5\u05df', '\u05d1\u05db\u05d9\u05e8'], priority: 10, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_er2', name: '\u05de\u05d9\u05d5\u05df 2', type: 'department', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8', '\u05de\u05d9\u05d5\u05df', '\u05d1\u05db\u05d9\u05e8'], priority: 9, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_or1', name: '\u05d7.\u05e0 \u05d2\u05d3\u05d5\u05dc 1', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 9, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_or2', name: '\u05d7.\u05e0 \u05d2\u05d3\u05d5\u05dc 2', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 8, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_or3', name: '\u05d7.\u05e0 \u05d2\u05d3\u05d5\u05dc 3', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 0, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_ds1', name: '\u05d0\u05e9\u05e4\u05d5\u05d6 \u05d9\u05d5\u05dd \u05e1\u05e4\u05d5\u05e8\u05d8', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 6, daysOfWeek: [0, 3] },
        { id: 'p_ds2', name: '\u05d0\u05e9\u05e4\u05d5\u05d6 \u05d9\u05d5\u05dd \u05db\u05e3 \u05d9\u05d3', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 6, daysOfWeek: [0, 2] },
        { id: 'p_ds3', name: '\u05d0\u05e9\u05e4\u05d5\u05d6 \u05d9\u05d5\u05dd \u05db\u05e3 \u05e8\u05d2\u05dc', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 6, daysOfWeek: [0] },
        { id: 'p_cl1', name: '\u05de. \u05d9\u05dc\u05d3\u05d9\u05dd', type: 'other', requiresRestDay: false, allowedGroups: ['\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 5, daysOfWeek: [0, 2] },
        { id: 'p_cl2', name: '\u05de. \u05e1\u05e4\u05d5\u05e8\u05d8', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 5, daysOfWeek: [1, 4] },
        { id: 'p_cl3', name: '\u05de. \u05db\u05e3 \u05d9\u05d3', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 5, daysOfWeek: [1, 4] },
        { id: 'p_cl4', name: '\u05de. \u05e9\u05d1\u05e8\u05d9\u05dd', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 5, daysOfWeek: [1, 3] },
        { id: 'p_cl5', name: '\u05de. \u05de\u05e2\u05e7\u05d1 \u05e0\u05d9\u05ea\u05d5\u05d7\u05d9\u05dd', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 4, daysOfWeek: [3] },
        { id: 'p_cl6', name: '\u05de. \u05db\u05e3 \u05e8\u05d2\u05dc', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 4, daysOfWeek: [2] },
        { id: 'p_cl7', name: '\u05de. \u05de\u05e4\u05e8\u05e7\u05d9\u05dd', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 0, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_cl8', name: '\u05de. \u05d2\u05d1', type: 'other', requiresRestDay: false, allowedGroups: ['\u05d6\u05d5\u05d8\u05e8','\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 0, daysOfWeek: [0, 1, 2, 3, 4] },
        { id: 'p_ex1', name: '\u05e8\u05de\u05d6', type: 'other', requiresRestDay: false, allowedGroups: ['\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 8, daysOfWeek: [2, 3, 4] },
        { id: 'p_ex2', name: '\u05d9\u05d1\u05e0\u05d4', type: 'other', requiresRestDay: false, allowedGroups: ['\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 7, daysOfWeek: [1] },
        { id: 'p_ex3', name: '\u05d0\u05e9\u05d3\u05d5\u05d3', type: 'other', requiresRestDay: false, allowedGroups: ['\u05de\u05d9\u05d5\u05df','\u05d1\u05db\u05d9\u05e8'], priority: 8, daysOfWeek: [0, 1, 2, 3, 4] }
      ],
      schedule: {},
      preferences: {},
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      isAdminMode: false,
      adminPassword: null,

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
      },
      setAdminMode: async (password: string): Promise<boolean> => {
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          });
          const data = await res.json();
          if (data.ok) {
            set({ isAdminMode: true, adminPassword: password });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      exitAdminMode: () => set({ isAdminMode: false, adminPassword: null }),
      loadFromServer: async () => {
        try {
          const res = await fetch('/api/data');
          if (!res.ok) return;
          const data = await res.json();
          if (!data) return;
          set({
            residents: data.residents ?? get().residents,
            preferences: data.preferences ?? get().preferences,
            schedule: data.schedule ?? get().schedule,
            month: data.month ?? get().month,
            year: data.year ?? get().year,
          });
        } catch {
          // Server not available - dev mode, use localStorage
        }
      },
    }),
    {
      name: 'medical-scheduler-v2-storage',
      version: 3,
      partialize: (state) => ({
        residents: state.residents,
        preferences: state.preferences,
        schedule: state.schedule,
        month: state.month,
        year: state.year,
      }),
    }
  )
);

// Auto-save to server when in admin mode (debounced 1.5s)
let saveTimeout: ReturnType<typeof setTimeout>;
useSchedulerStore.subscribe((state) => {
  if (!state.isAdminMode || !state.adminPassword) return;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.adminPassword}`,
        },
        body: JSON.stringify({
          residents: state.residents,
          preferences: state.preferences,
          schedule: state.schedule,
          month: state.month,
          year: state.year,
        }),
      });
    } catch {
      console.error('Failed to save to server');
    }
  }, 1500);
});
