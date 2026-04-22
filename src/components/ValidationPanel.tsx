import { useMemo } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { validateSchedule } from '../core/schedulerValidator';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ValidationPanel() {
  const { schedule, residents, posts, preferences, year, month } = useSchedulerStore();

  const anomalies = useMemo(() => {
    return validateSchedule(schedule, residents, posts, preferences, {
      month,
      year,
      preventConsecutiveShifts: true,
      enforcePostShiftRest: true
    });
  }, [schedule, residents, posts, preferences, month, year]);

  const hasSchedule = Object.keys(schedule).length > 0;

  if (!hasSchedule) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
        לא הופעל סידור לחודש זה.
      </div>
    );
  }

  const criticals = anomalies.filter(a => a.type === 'critical');
  const warnings = anomalies.filter(a => a.type === 'warning');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-red-50/30">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className={`w-4 h-4 ${criticals.length ? 'text-red-500' : 'text-green-500'}`} />
            בקרת סריקת תקלות (QA)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">סריקת סידור והתראה על התנגשויות ושגיאות</p>
        </div>
        <div className="flex gap-4">
           {criticals.length > 0 && (
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" />
                 {criticals.length} שגיאות קריטיות
              </div>
           )}
           {warnings.length > 0 && (
              <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" />
                 {warnings.length} אזהרות
              </div>
           )}
           {criticals.length === 0 && warnings.length === 0 && (
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4" />
                 סידור תקין לחלוטין
              </div>
           )}
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        {anomalies.length === 0 ? (
          <div className="p-12 text-center text-green-600 flex flex-col items-center gap-3">
             <CheckCircle2 className="w-12 h-12" />
             <div className="text-lg font-bold">הסידור במצב מעולה!</div>
             <p className="text-sm">לא נמצאו חריגות מהתקן, אין חוסר איוש ואין שיבוצים כפולים.</p>
          </div>
        ) : (
          <table className="w-full text-right hover:border-collapse" style={{ fontSize: '12.5px', minWidth: '600px' }}>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 w-16">רמת חומרה</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 w-20">תאריך</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 w-36">רופא</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500">תיאור התקלה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {anomalies.map((anomaly, idx) => (
                <tr key={`${anomaly.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-1.5">
                     {anomaly.type === 'critical' ? (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 text-xs font-bold px-2 py-0.5 rounded">קריטי</span>
                     ) : (
                        <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 text-xs font-bold px-2 py-0.5 rounded">אזהרה</span>
                     )}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 text-xs">
                     {anomaly.day === 0 ? 'כללי' : `${anomaly.day}/${month + 1}/${year}`}
                  </td>
                  <td className="px-3 py-1.5 font-medium text-gray-900 text-xs">
                     {anomaly.residentName || '-'}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 text-xs">
                    {anomaly.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
