import type { Resident, Post, Schedule, ResidentPreferences, EngineConfig } from '../types';

interface EngineInput {
  residents: Resident[];
  posts: Post[];
  preferences: Record<string, ResidentPreferences>;
  config: EngineConfig;
}

export function generateSchedule(input: EngineInput): Schedule {
  const { residents, posts, preferences, config } = input;
  const daysInMonth = new Date(config.year, config.month + 1, 0).getDate();
  const schedule: Schedule = {};
  
  // Track continuous stats (very greedy but cleanly separated from React)
  // In a V3 this could be an actual CSP backtracking algorithm
  const shiftCounts: Record<string, number> = {};
  residents.forEach(r => shiftCounts[r.id] = 0);

  // Separate posts by type — shifts (require rest day) and sessions (don't)
  const shiftPosts = posts.filter(p => p.type === 'shift').sort((a, b) => b.priority - a.priority);
  const sessionPosts = posts.filter(p => p.type === 'session').sort((a, b) => b.priority - a.priority);

  for (let day = 1; day <= daysInMonth; day++) {
    schedule[day] = {};
    const date = new Date(config.year, config.month, day);
    const dayOfWeek = date.getDay();

    // 1. Calculate post-shift rest for today based on yesterday's major shifts
    const restingResidentIds = new Set<string>();
    if (config.enforcePostShiftRest && day > 1) {
      const yesterdayParams = schedule[day - 1];
      if (yesterdayParams) {
        shiftPosts.forEach(sp => {
          if (sp.requiresRestDay && yesterdayParams[sp.id]) {
             yesterdayParams[sp.id].forEach(rId => restingResidentIds.add(rId));
          }
        });
      }
      if (restingResidentIds.size > 0) {
        schedule[day]['p_rest'] = Array.from(restingResidentIds);
      }
    }

    // 2. Assign Shifts
    shiftPosts.forEach(post => {
      // Check if post should run today
      if (!post.daysOfWeek.includes(dayOfWeek)) return;

      // Filter valid candidates
      let candidates = residents.filter(r => {
        // Must belong to an allowed group
        if (!post.allowedGroups.includes(r.group)) return false;
        // Must not be resting
        if (restingResidentIds.has(r.id)) return false;
        // Must not have maxed out shifts
        if (shiftCounts[r.id] >= r.maxShiftsPerMonth) return false;
        // Must check if on vacation
        const pref = preferences[r.id];
        if (pref && pref.vacationDays.includes(day)) return false;
        // Check consecutive shift
        if (config.preventConsecutiveShifts && day > 1 && schedule[day - 1]) {
           const hadShiftYesterday = shiftPosts.some(sp => schedule[day - 1][sp.id]?.includes(r.id));
           if (hadShiftYesterday) return false;
        }
        // Must not already be assigned another shift today
        const hasShiftToday = shiftPosts.some(sp => schedule[day][sp.id]?.includes(r.id));
        if (hasShiftToday) return false;

        return true;
      });

      // Sort by fewest shifts to balance
      candidates.sort((a, b) => shiftCounts[a.id] - shiftCounts[b.id]);

      if (candidates.length > 0) {
        const assigned = candidates[0];
        schedule[day][post.id] = [assigned.id];
        shiftCounts[assigned.id]++;
      } else {
        // Could not find candidate
        schedule[day][post.id] = [];
      }
    });

    // 2b. Assign Sessions (ססיות) — every weekday א-ה, no rest required after
    sessionPosts.forEach(post => {
      if (!post.daysOfWeek.includes(dayOfWeek)) return;

      let candidates = residents.filter(r => {
        if (!post.allowedGroups.includes(r.group)) return false;
        // Must not be resting after a major shift
        if (restingResidentIds.has(r.id)) return false;
        // Must not be on vacation
        const pref = preferences[r.id];
        if (pref && pref.vacationDays.includes(day)) return false;
        // Must not have a major shift tonight (תורן מיון/בכיר)
        const hasMajorShiftToday = shiftPosts
          .filter(sp => sp.requiresRestDay)
          .some(sp => schedule[day][sp.id]?.includes(r.id));
        if (hasMajorShiftToday) return false;
        // Must not already be in another session today
        const hasSessionToday = sessionPosts.some(sp => schedule[day][sp.id]?.includes(r.id));
        if (hasSessionToday) return false;

        return true;
      });

      // Prefer those with fewer total shifts/sessions for balance
      candidates.sort((a, b) => shiftCounts[a.id] - shiftCounts[b.id]);

      if (candidates.length > 0) {
        const assigned = candidates[0];
        schedule[day][post.id] = [assigned.id];
        shiftCounts[assigned.id]++;
      } else {
        schedule[day][post.id] = [];
      }
    });

    // 3. Assign Daily Posts (Stations, Clinics, ORs, Department)
    const dailyPosts = posts.filter(p => !['shift', 'session'].includes(p.type) && !['p_rest', 'p_vac'].includes(p.id));
    
    // Sort posts by priority to fill critical stations first (e.g., OR > Clinics > empty placeholders)
    const sortedDailyPosts = [...dailyPosts].sort((a, b) => b.priority - a.priority);

    // Initial pool of available doctors for today (not resting, not on vacation)
    let availableForPosts = residents.filter(r => {
      if (restingResidentIds.has(r.id)) return false;
      const pref = preferences[r.id];
      if (pref && pref.vacationDays.includes(day)) return false;
      
      const hasShiftToday = shiftPosts.some(sp => schedule[day][sp.id]?.includes(r.id));
      if (hasShiftToday && r.group !== 'זוטר') return false; 
      
      return true;
    });

    // Randomize the pool for fair distribution of daily assignments
    availableForPosts.sort(() => Math.random() - 0.5);

    // OR rooms: group them so each gets exactly 1 resident (not all in p_or1)
    // Detect OR groups by naming pattern (p_or1, p_or2, p_or3)
    const orGroupIds = ['p_or1', 'p_or2', 'p_or3'];

    sortedDailyPosts.forEach(post => {
      // Check if post should run today
      if (!post.daysOfWeek.includes(dayOfWeek)) {
        schedule[day][post.id] = [];
        return;
      }

      // Skip automatic assignment for posts that have priority 0 (e.g., p_or3, p_cl7, p_cl8)
      // They will remain empty for manual assignment.
      if (post.priority === 0) {
        schedule[day][post.id] = [];
        return;
      }

      // Find the first available doctor matching allowed groups for this specific station
      const candidateIndex = availableForPosts.findIndex(r => post.allowedGroups.includes(r.group));
      
      if (candidateIndex !== -1) {
        const candidate = availableForPosts[candidateIndex];
        schedule[day][post.id] = [candidate.id];
        
        // Remove from the pool so they aren't assigned to multiple stations simultaneously!
        availableForPosts.splice(candidateIndex, 1);
      } else {
        // No one available with the right permissions
        schedule[day][post.id] = [];
      }
    });
  }

  return schedule;
}
