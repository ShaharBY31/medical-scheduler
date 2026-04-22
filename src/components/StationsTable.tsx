import { useMemo, useState, Fragment } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import CellEditorPopup from './CellEditorPopup';

// Section groupings for visual dividers
const SECTION_BREAKS: Record<string, string> = {
  'p_dept':    'מחלקה ומיון',
  'p_or1':     'חדרי ניתוח',
  'p_ds1':     'אשפוז יום',
  'p_cl1':     'מרפאות',
  'p_ex1':     'חוץ',
  'p_bahir':   'תורנויות',   // ← start of shift block
  'p_sess_b':  'ססיות',       // ← start of session block
  'p_rest':    'מעקב ומנוחה', // ← tracking block
};

export default function StationsTable() {
  const { schedule, month, year, posts, residents } = useSchedulerStore();
  const [editingCell, setEditingCell] = useState<{ day: number, postId: string, anchorEl: HTMLElement } | null>(null);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const SHIFT_ORDER = ['p_bahir', 'p_miyun', 'p_hazi', 'p_sess_b', 'p_sess_z', 'p_rest', 'p_vac'];

  const stationPosts = [...posts].sort((a, b) => {
    const isAShift = ['shift', 'session'].includes(a.type) || ['p_rest', 'p_vac'].includes(a.id);
    const isBShift = ['shift', 'session'].includes(b.type) || ['p_rest', 'p_vac'].includes(b.id);
    // First: stations before shifts
    if (isAShift && !isBShift) return 1;
    if (!isAShift && isBShift) return -1;
    // Within shifts: use explicit order
    if (isAShift && isBShift) {
      const ai = SHIFT_ORDER.indexOf(a.id);
      const bi = SHIFT_ORDER.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return 0;
  }).filter(post => post.daysOfWeek.length > 0 || ['p_rest', 'p_vac'].includes(post.id));

  const weeks = useMemo(() => {
    const weeksArray: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay(); 
    
    // Pad first week with nulls for days before Sunday
    for (let i = 0; i < startDow; i++) {
        currentWeek.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeksArray.push(currentWeek);
            currentWeek = [];
        }
    }
    
    // Pad last week with nulls to reach Saturday
    if (currentWeek.length > 0) {
        while(currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeksArray.push(currentWeek);
    }
    return weeksArray;
  }, [year, month, daysInMonth]);

  const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  // Determine post category for row coloring
  const getRowStyle = (post: typeof posts[0]) => {
    if (['p_rest', 'p_vac'].includes(post.id)) return 'tracking-bg';
    if (['shift', 'session'].includes(post.type)) return 'shift-bg';
    if (['p_dept', 'p_er1', 'p_er2'].includes(post.id)) return 'dept-bg';
    if (post.id.startsWith('p_or')) return 'or-bg';
    if (post.id.startsWith('p_ds')) return 'day-hosp-bg';
    if (post.id.startsWith('p_cl')) return 'clinic-bg';
    if (post.id.startsWith('p_ex')) return 'external-bg';
    return '';
  };

  const [activeWeekIndex, setActiveWeekIndex] = useState(0);

  const rowLabelClass: Record<string, string> = {
    'dept-bg':     'bg-slate-700 text-white',
    'or-bg':       'bg-indigo-700 text-white',
    'day-hosp-bg': 'bg-teal-700 text-white',
    'clinic-bg':   'bg-sky-700 text-white',
    'external-bg': 'bg-orange-700 text-white',
    'shift-bg':    'bg-rose-800 text-white',
    'tracking-bg': 'bg-gray-600 text-white',
    '':            'bg-gray-100 text-gray-800',
  };

  const activeWeek = weeks[activeWeekIndex];

  return (
    <div className="rounded-2xl shadow-lg border border-gray-200 mb-6 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-white text-lg tracking-wide">סידור עבודה — עמדות ומחלקה</h3>
        <span className="text-slate-300 text-sm font-medium">
          {new Date(year, month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 border-b border-gray-200 px-4 pt-4 flex gap-2 overflow-x-auto" dir="rtl">
        {weeks.map((week, idx) => {
          const firstValidDay = week.find(d => d !== null);
          const lastValidDay = [...week].reverse().find(d => d !== null);
          const isActive = activeWeekIndex === idx;

          return (
            <button
              key={`tab-${idx}`}
              onClick={() => setActiveWeekIndex(idx)}
              className={`px-5 py-2.5 rounded-t-lg font-bold text-sm transition-colors border border-b-0 whitespace-nowrap
                ${isActive 
                  ? 'bg-white text-blue-700 border-gray-200 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] translate-y-[1px]' 
                  : 'bg-gray-50 text-slate-500 border-transparent hover:bg-gray-200'}`}
            >
              שבוע {idx + 1}
              <span className="block text-[10px] font-normal leading-tight opacity-70">
                {firstValidDay}-{lastValidDay} בחודש
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4 bg-slate-50" dir="rtl">
        {activeWeek && (
          <div className="overflow-x-auto w-full rounded-xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-center border-collapse text-[11px]">
              <thead>
                <tr>
                  <th className="p-2 bg-slate-900 text-slate-300 whitespace-nowrap sticky right-0 z-10 w-28 border-b border-slate-700 text-xs font-semibold">
                    תחנה / יום
                  </th>
                  {activeWeek.map((day, i) => {
                    const isWeekend = i === 5 || i === 6;
                    return (
                      <th key={`date-${i}`} className={`p-1.5 w-1/8 min-w-[50px] border-x border-slate-800 text-xs font-bold ${isWeekend ? 'bg-slate-600 text-slate-300' : 'bg-slate-900 text-white'}`}>
                        <div className="flex flex-col">
                          <span className="font-normal text-[10px] text-slate-400">{hebrewDays[i]}'</span>
                          <span className="text-sm">{day ? day : '-'}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {stationPosts.map((post, idx) => {
                  const rowStyle = getRowStyle(post);
                  const labelClass = rowLabelClass[rowStyle] || rowLabelClass[''];
                  const showDivider = SECTION_BREAKS[post.id];

                  return (
                    <Fragment key={post.id}>
                      {showDivider && (
                        <tr>
                          <td colSpan={8} className="bg-gradient-to-r from-slate-100 to-gray-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 text-right border-y border-gray-200">
                            {showDivider}
                          </td>
                        </tr>
                      )}
                      <tr className="group">
                        <td className={`p-1.5 text-right text-[11px] font-semibold whitespace-nowrap sticky right-0 z-10 border-b border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.08)] truncate max-w-[110px] ${labelClass}`}>
                          {post.name}
                        </td>
                        {activeWeek.map((day, i) => {
                          const dow = i;
                          const isWeekend = dow === 5 || dow === 6;
                          const isActive = post.daysOfWeek.includes(dow);

                          // Empty padding days at start/end of month
                          if (day === null) {
                            return <td key={`null-${i}`} className="bg-stripes bg-gray-50 border-b border-l border-gray-200"></td>;
                          }

                          const assignedIds = schedule[day]?.[post.id] || [];
                          const assignedNames = assignedIds.map(id => residents.find(r => r.id === id)?.name || id).join(', ');

                          let cellClass = 'border-b border-l border-gray-100 h-9 px-1 transition-all duration-150 relative ';

                          if (assignedNames) {
                            cellClass += isWeekend
                              ? 'bg-slate-100 hover:bg-blue-50 hover:ring-1 hover:ring-inset hover:ring-blue-400 cursor-pointer text-slate-800 font-bold '
                              : 'bg-white hover:bg-blue-50 hover:ring-1 hover:ring-inset hover:ring-blue-400 cursor-pointer text-slate-900 font-bold ';
                          } else if (!isActive || isWeekend) {
                            cellClass += 'bg-slate-50/80 cursor-pointer hover:bg-blue-50/50 text-slate-300 ';
                          } else {
                            cellClass += 'bg-rose-50/50 hover:bg-rose-100 hover:ring-1 hover:ring-inset hover:ring-rose-300 cursor-pointer text-rose-300 ';
                          }

                          return (
                            <td
                              key={`${post.id}-${day}`}
                              className={cellClass}
                              onClick={(e) => setEditingCell({ day, postId: post.id, anchorEl: e.currentTarget })}
                            >
                              <span className="block truncate leading-none text-center">
                                {assignedNames || (
                                  <span className="opacity-0 group-hover:opacity-40 text-slate-400 text-base leading-none">+</span>
                                )}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingCell && (
        <CellEditorPopup
          day={editingCell.day}
          postId={editingCell.postId}
          anchorEl={editingCell.anchorEl}
          onClose={() => setEditingCell(null)}
        />
      )}
    </div>
  );
}
