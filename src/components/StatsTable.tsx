import { useMemo } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { BarChart3, AlertTriangle } from 'lucide-react';

export default function StatsTable() {
  const { schedule, residents, posts } = useSchedulerStore();

  const stats = useMemo(() => {
    const shiftPosts = new Set(posts.filter(p => p.type === 'shift').map(p => p.id));
    const sessionPosts = new Set(posts.filter(p => p.type === 'session').map(p => p.id));

    const records = residents.map(r => ({ ...r, shifts: 0, sessions: 0 }));
    const idToRecord = Object.fromEntries(records.map(r => [r.id, r]));

    Object.values(schedule).forEach(dayData => {
      Object.entries(dayData).forEach(([postId, residentIds]) => {
         if (Array.isArray(residentIds)) {
           if (shiftPosts.has(postId)) {
              residentIds.forEach(id => {
                if (idToRecord[id]) idToRecord[id].shifts++;
              });
           } else if (sessionPosts.has(postId)) {
              residentIds.forEach(id => {
                if (idToRecord[id]) idToRecord[id].sessions++;
              });
           }
         }
      });
    });

    return records.sort((a, b) => {
        const groupOrder = { 'זוטר': 1, 'מיון': 2, 'בכיר': 3, 'תורן חוץ': 4 };
        return groupOrder[a.group] - groupOrder[b.group];
    });
  }, [schedule, residents, posts]);

  const hasSchedule = Object.keys(schedule).length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            מעקב תורנויות וססיות
          </h2>
          <p className="text-sm text-gray-500 mt-1">כמות התורנויות והססיות שבוצעו על ידי כל אחת ואחד מהרופאים בחודש הנוכחי</p>
        </div>
      </div>

      {!hasSchedule ? (
        <div className="p-12 text-center text-gray-500 text-sm">
          לא קיים סידור עבודה כרגע. הפעל את חולל הסידור ולכאן ייאספו הנתונים האוטומטיים.
        </div>
      ) : (
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-right hover:border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-12">#</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">שם הרופא</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">תפקיד</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">הקצאת תורנויות מקסימלית</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">תורנויות ששובצו</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">ססיות ששובצו</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.map((r, index) => {
                const overLimit = r.shifts > r.maxShiftsPerMonth;
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4 text-gray-500">{r.group}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{r.maxShiftsPerMonth}</td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                        overLimit ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {r.shifts}
                        {overLimit && <AlertTriangle className="w-3.5 h-3.5" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-bold">
                        {r.sessions}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
