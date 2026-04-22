import { useSchedulerStore } from '../store/useSchedulerStore';
import { Users, CheckCircle2 } from 'lucide-react';

export default function UnassignedOverview() {
  const { schedule, month, year, residents } = useSchedulerStore();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getUnassignedResidents = (day: number) => {
    const assignedIds = new Set<string>();

    if (schedule[day]) {
      // Any resident assigned to any post (shifts, department, rests) is considered "assigned"
      Object.keys(schedule[day]).forEach(postId => {
        schedule[day][postId].forEach(resId => {
          assignedIds.add(resId);
        });
      });
    }

    return residents.filter(r => !assignedIds.has(r.id) && r.group !== 'תורן חוץ');
  };

  const hasSchedule = Object.keys(schedule).length > 0;
  if (!hasSchedule) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
        <Users className="w-5 h-5 text-gray-700" />
        <h3 className="font-bold text-gray-900 text-lg">רופאים זמינים (ללא סופי שבוע)</h3>
        <span className="text-sm font-medium text-gray-500">רופאים ללא שום שיבוץ ביום נתון</span>
      </div>
      
      <div className="p-6 bg-gray-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            
            // Skip weekends
            if (dayOfWeek === 5 || dayOfWeek === 6) return null;
            
            const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
            const dayName = dayNames[dayOfWeek];
            
            const unassigned = getUnassignedResidents(day);
            
            return (
              <div key={day} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="font-bold mb-3 text-center text-gray-800 border-b border-gray-100 pb-2">
                  {day}/{month + 1} ({dayName})
                </div>
                
                {unassigned.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-green-600 gap-2 py-2">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium text-sm">כולם מוקצים</span>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {unassigned.map(resident => {
                      let colorClass = 'text-gray-700';
                      if (resident.group === 'בכיר') colorClass = 'text-purple-600 font-semibold';
                      else if (resident.group === 'מיון') colorClass = 'text-orange-600 font-semibold';
                      else if (resident.group === 'זוטר') colorClass = 'text-blue-600 font-medium';
                      
                      return (
                        <div key={resident.id} className={`text-sm flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 ${colorClass}`}>
                          <span>{resident.name}</span>
                          <span className="text-xs opacity-75 bg-white px-2 py-0.5 rounded border border-gray-200">{resident.group}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }).filter(Boolean)}
        </div>
      </div>
    </div>
  );
}
