import { useMemo, useState, Fragment } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import CellEditorPopup from './CellEditorPopup';

const SHIFT_META: Record<string, { color: string; label: string }> = {
  'p_bahir':  { color: 'bg-rose-800',   label: 'תורנויות' },  // first shift → show section title
  'p_miyun':  { color: 'bg-rose-800',   label: '' },
  'p_hazi':   { color: 'bg-rose-700',   label: '' },
  'p_sess_b': { color: 'bg-violet-700', label: 'ססיות' },     // first session → show section title
  'p_sess_z': { color: 'bg-violet-700', label: '' },
  'p_rest':   { color: 'bg-slate-600',  label: 'מעקב ומנוחה' }, // tracking section
  'p_vac':    { color: 'bg-slate-600',  label: '' },
};

export default function ShiftsTable() {
  const { schedule, month, year, posts, residents } = useSchedulerStore();
  const [editingCell, setEditingCell] = useState<{ day: number, postId: string, anchorEl: HTMLElement } | null>(null);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const SHIFT_ORDER = ['p_bahir', 'p_miyun', 'p_hazi', 'p_sess_b', 'p_sess_z', 'p_rest', 'p_vac'];

  const shiftPosts = posts
    .filter(p => ['shift', 'session'].includes(p.type) || ['p_rest', 'p_vac'].includes(p.id))
    .sort((a, b) => {
      const ai = SHIFT_ORDER.indexOf(a.id);
      const bi = SHIFT_ORDER.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

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

  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const activeWeek = weeks[activeWeekIndex];

  return (
    <div className="rounded-2xl shadow-lg border border-gray-200 mb-6 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-indigo-900/20 bg-gradient-to-r from-indigo-900 to-violet-900 flex justify-between items-center">
        <h3 className="font-bold text-white text-lg tracking-wide">תורנויות וססיות</h3>
        <span className="text-indigo-300 text-sm font-medium">
          {new Date(year, month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-indigo-50/50 border-b border-indigo-100 px-4 pt-4 flex gap-2 overflow-x-auto" dir="rtl">
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
                  ? 'bg-white text-indigo-700 border-indigo-100 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] translate-y-[1px]' 
                  : 'bg-indigo-50/50 text-indigo-400 border-transparent hover:bg-indigo-100/50'}`}
            >
              שבוע {idx + 1}
              <span className="block text-[10px] font-normal leading-tight opacity-70">
                {firstValidDay}-{lastValidDay} בחודש
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4 bg-indigo-50/30" dir="rtl">
        {activeWeek && (
          <div className="overflow-x-auto w-full rounded-xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-center border-collapse text-[11px]">
              <thead>
                <tr>
                  <th className="p-2 bg-indigo-950 text-indigo-300 whitespace-nowrap sticky right-0 z-10 w-28 border-b border-indigo-800 text-xs font-semibold">
                    תורנות / יום
                  </th>
                  {activeWeek.map((day, i) => {
                    const isWeekend = i === 5 || i === 6;
                    return (
                      <th key={`date-${i}`} className={`p-1.5 w-1/8 min-w-[50px] border-x border-indigo-900 text-xs font-bold ${isWeekend ? 'bg-indigo-800 text-indigo-300' : 'bg-indigo-950 text-white'}`}>
                        <div className="flex flex-col">
                          <span className="font-normal text-[10px] text-indigo-400">{hebrewDays[i]}'</span>
                          <span className="text-sm">{day ? day : '-'}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {shiftPosts.map((post) => {
                  const meta = SHIFT_META[post.id];
                  const labelColor = meta?.color ?? 'bg-slate-700';
                  const showDivider = meta?.label;

                  return (
                    <Fragment key={post.id}>
                      {showDivider && (
                        <tr>
                          <td colSpan={8} className="bg-gradient-to-r from-indigo-50 to-gray-50 text-indigo-500 text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 text-right border-y border-indigo-100">
                            {showDivider}
                          </td>
                        </tr>
                      )}
                      <tr className="group">
                        <td className={`p-1.5 text-right text-[11px] font-semibold whitespace-nowrap sticky right-0 z-10 border-b border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.08)] truncate max-w-[110px] text-white ${labelColor}`}>
                          {post.name}
                        </td>
                        {activeWeek.map((day, i) => {
                          const dow = i;
                          const isWeekend = dow === 5 || dow === 6;
                          const isActive = post.daysOfWeek.includes(dow);

                          if (day === null) {
                            return <td key={`null-${i}`} className="bg-stripes bg-gray-50 border-b border-l border-gray-200"></td>;
                          }

                          const assignedIds = schedule[day]?.[post.id] || [];
                          const assignedNames = assignedIds.map(id => residents.find(r => r.id === id)?.name || id).join(', ');

                          let cellClass = 'border-b border-l border-gray-100 h-9 px-1 transition-all duration-150 relative ';

                          if (assignedNames) {
                            cellClass += isWeekend
                              ? 'bg-indigo-50 hover:bg-indigo-100 hover:ring-1 hover:ring-inset hover:ring-indigo-400 cursor-pointer text-indigo-800 font-bold '
                              : 'bg-white hover:bg-indigo-50 hover:ring-1 hover:ring-inset hover:ring-indigo-400 cursor-pointer text-slate-900 font-bold ';
                          } else if (!isActive || isWeekend) {
                            cellClass += 'bg-slate-50 cursor-pointer hover:bg-slate-100 text-slate-300 ';
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
