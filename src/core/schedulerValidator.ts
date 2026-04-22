import type { Schedule, Resident, Post, EngineConfig, ResidentPreferences } from '../types';

export interface ScheduleAnomaly {
  id: string;
  day: number;
  residentId?: string;
  residentName?: string;
  postId?: string;
  postName?: string;
  message: string;
  type: 'critical' | 'warning';
}

export function validateSchedule(
  schedule: Schedule,
  residents: Resident[],
  posts: Post[],
  _preferences: Record<string, ResidentPreferences>,
  config: EngineConfig
): ScheduleAnomaly[] {
  const anomalies: ScheduleAnomaly[] = [];
  const daysInMonth = new Date(config.year, config.month + 1, 0).getDate();
  const shiftCounts: Record<string, number> = {};
  
  // Create quick lookup maps
  const residentMap = new Map<string, Resident>();
  residents.forEach(r => {
    residentMap.set(r.id, r);
    residentMap.set(r.name, r); // Fallback for name-based IDs from imports
  });
  const postMap = new Map(posts.map(p => [p.id, p]));

  // Pre-calculate unknown residents
  const allIdsInSchedule = new Set<string>();
  Object.values(schedule).forEach(dayObj => {
    Object.values(dayObj).forEach((ids) => {
      (ids as string[]).forEach(id => allIdsInSchedule.add(id));
    });
  });

  allIdsInSchedule.forEach(id => {
    if (!residentMap.has(id)) {
      anomalies.push({
        id: `unknown-${id}`,
        day: 0,
        residentId: id,
        residentName: id,
        message: `רופא לא מוכר במערכת: רשום בגיליון כ-"${id}". נא להוסיף לעמודת הרופאים או לתקן שגיאת כתיב.`,
        type: 'critical'
      });
    }
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = schedule[day] || {};
    const date = new Date(config.year, config.month, day);
    const dow = date.getDay();

    // Track daily assignments for double-booking
    const dailyAssignments = new Map<string, string[]>(); // residentId -> postIds

    // 1. Missing coverage check & Shift Counting & Double booking accumulation
    Object.entries(dayData).forEach(([postId, residentIds]) => {
      const post = postMap.get(postId);
      if (!post) return;

      // Unmanned active required stations/shifts (Exclude rests/vacation and manual-only priority 0 posts)
      if (residentIds.length === 0 && !['p_rest', 'p_vac'].includes(postId)) {
        if (post.daysOfWeek.includes(dow) && !isDeactivatedHeader(post) && post.priority !== 0) {
           // Warning if a scheduled station is empty
           anomalies.push({
             id: `empty-${day}-${postId}`,
             day,
             postId,
             postName: post.name,
             message: `אין שיבוץ לעמדת ${post.name}`,
             type: post.type === 'shift' ? 'critical' : 'warning'
           });
        }
      }

      residentIds.forEach(resId => {
        const res = residentMap.get(resId);
        
        // Count shifts
        if (post.type === 'shift') {
          shiftCounts[resId] = (shiftCounts[resId] || 0) + 1;
        }

        // Check group permission
        if (res && !post.allowedGroups.includes(res.group) && !['p_rest', 'p_vac'].includes(postId)) {
          anomalies.push({
            id: `group-${day}-${postId}-${resId}`,
            day,
            residentId: resId,
            residentName: res.name,
            postId,
            postName: post.name,
            message: `שגיאת תקן: ${res.name} (מוגדר כ-${res.group}) איננו מורשה לבצע ${post.name}.`,
            type: 'critical'
          });
        }

        // Accumulate context for double booking
        if (!dailyAssignments.has(resId)) dailyAssignments.set(resId, []);
        dailyAssignments.get(resId)!.push(postId);
      });
    });

    // 2. Concurrency checks (Double booked in morning)
    dailyAssignments.forEach((postIds, resId) => {
      const res = residentMap.get(resId);
      // Filter only morning valid working posts (exclude shifts and sessions for this specific logic, as they happen evening/afternoon)
      // Actually, if someone is in 2 morning departments simultaneously:
      const morningPosts = postIds.filter(pid => {
        const p = postMap.get(pid);
        return p && p.type !== 'shift' && p.type !== 'session' && !['p_rest', 'p_vac'].includes(pid);
      });

      if (morningPosts.length > 1) {
        anomalies.push({
          id: `double-${day}-${resId}`,
          day,
          residentId: resId,
          residentName: res?.name || resId,
          message: `כפילות בוקר: ${res?.name || resId} משובץ במקביל ל-${morningPosts.length} עמדות בוקר באותו היום.`,
          type: 'critical'
        });
      }

      // Check if RESTING but assigned
      if (postIds.includes('p_rest') && postIds.some(pid => pid !== 'p_rest')) {
        anomalies.push({
          id: `restfail-${day}-${resId}`,
          day,
          residentId: resId,
          residentName: res?.name || resId,
          message: `שבירת חוק מנוחה: ${res?.name || resId} שובץ לעבודה למרות שהוא מסומן כ"אחרי תורנות" ביום זה.`,
          type: 'critical'
        });
      }
      
      // Check if VACATION but assigned
      if (postIds.includes('p_vac') && postIds.some(pid => pid !== 'p_vac')) {
          anomalies.push({
            id: `vacfail-${day}-${resId}`,
            day,
            residentId: resId,
            residentName: res?.name || resId,
            message: `שבירת חופש: ${res?.name || resId} שובץ לעבודה למרות שהוא מסומן בחופש.`,
            type: 'critical'
          });
      }
    });

    // 3. Post-shift Rules Next Day Checks Context
    if (config.enforcePostShiftRest && day > 1) {
      const yesterdayData = schedule[day - 1] || {};
      Object.entries(yesterdayData).forEach(([oldPostId, oldResIds]) => {
        const oldPost = postMap.get(oldPostId);
        if (oldPost && oldPost.requiresRestDay) {
          oldResIds.forEach(resId => {
            const todayAssignments = dailyAssignments.get(resId) || [];
            if (!todayAssignments.includes('p_rest') && todayAssignments.length > 0) {
              const res = residentMap.get(resId);
              anomalies.push({
                id: `missingrest-${day}-${resId}`,
                day,
                residentId: resId,
                residentName: res?.name || resId,
                message: `חוסר מנוחה: ${res?.name || resId} ביצע תורנות גדולה אתמול אך שובץ להמשך עבודה היום.`,
                type: 'critical'
              });
            }
          });
        }
      });
    }
  }

  // 4. Monthly Max Limit Checks
  Object.entries(shiftCounts).forEach(([resId, count]) => {
    const res = residentMap.get(resId);
    if (res && count > res.maxShiftsPerMonth) {
      anomalies.push({
        id: `limit-${resId}`,
        day: 0,
        residentId: resId,
        residentName: res.name,
        message: `חריגת שעות: ${res.name} חצה את מכסת התורנויות: בוצעו ${count} תורנויות (הגבלה: ${res.maxShiftsPerMonth}).`,
        type: 'warning'
      });
    }
  });

  return anomalies.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    if (a.type !== b.type) return a.type === 'critical' ? -1 : 1;
    return 0;
  });
}

function isDeactivatedHeader(post: Post) {
  return post.daysOfWeek.length === 0 && post.priority === 0;
}
