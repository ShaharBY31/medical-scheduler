import { useMemo, useState, Fragment, useEffect } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import CellEditorPopup from './CellEditorPopup';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const SHIFT_META: Record<string, { color: string; label: string }> = {
  'p_bahir':  { color: 'bg-rose-800',   label: 'תורנויות' },
  'p_miyun':  { color: 'bg-rose-800',   label: '' },
  'p_hazi':   { color: 'bg-rose-700',   label: '' },
  'p_sess_b': { color: 'bg-violet-700', label: 'ססיות' },
  'p_sess_z': { color: 'bg-violet-700', label: '' },
  'p_rest':   { color: 'bg-slate-600',  label: 'מעקב ומנוחה' },
  'p_vac':    { color: 'bg-slate-600',  label: '' },
};

const SHIFT_ORDER = ['p_bahir', 'p_miyun', 'p_hazi', 'p_sess_b', 'p_sess_z', 'p_rest', 'p_vac'];
const HEB_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export default function ShiftsTable() {
  const { schedule, month, year, posts, residents } = useSchedulerStore();
  const [editingCell, setEditingCell] = useState<{ day: number; postId: string; anchorEl: HTMLElement } | null>(null);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const shiftPosts = posts
    .filter(p => ['shift', 'session'].includes(p.type) || ['p_rest', 'p_vac'].includes(p.id))
    .sort((a, b) => {
      const ai = SHIFT_ORDER.indexOf(a.id), bi = SHIFT_ORDER.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  const weeks = useMemo(() => {
    const arr: (number | null)[][] = [];
    let cur: (number | null)[] = [];
    const startDow = new Date(year, month, 1).getDay();
    for (let i = 0; i < startDow; i++) cur.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cur.push(d);
      if (cur.length === 7) { arr.push(cur); cur = []; }
    }
    if (cur.length) {
      while (cur.length < 7) cur.push(null);
      arr.push(cur);
    }
    return arr;
  }, [year, month, daysInMonth]);

  // Detect current week index based on today
  const initialWeek = useMemo(() => {
    const today = new Date();
    if (today.getFullYear() !== year || today.getMonth() !== month) return 0;
    const d = today.getDate();
    const idx = weeks.findIndex(w => w.includes(d));
    return idx >= 0 ? idx : 0;
  }, [weeks, year, month]);

  const [activeWeekIndex, setActiveWeekIndex] = useState(initialWeek);

  // Update activeWeekIndex if initialWeek changes
  useEffect(() => {
    setActiveWeekIndex(initialWeek);
  }, [initialWeek]);

  const activeWeek = weeks[activeWeekIndex] ?? [];
  const monthLabel = new Date(year, month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  return (
    <div dir="rtl" className="flex flex-col gap-3">
      {/* Month title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">תורנויות וססיות — {monthLabel}</h2>
        <p className="text-xs text-gray-400 mt-0.5">לחץ על תא לעריכה</p>
      </div>

      {/* Week nav buttons */}
      <div className="flex items-center sm:justify-center gap-2 overflow-x-auto pb-2 px-1 hide-scrollbar snap-x">
        <button
          onClick={() => setActiveWeekIndex(i => Math.max(0, i - 1))}
          disabled={activeWeekIndex === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-25 transition-colors sticky right-0 bg-white/80 backdrop-blur-sm z-10 shrink-0"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        {weeks.map((week, i) => {
          const first = week.find(d => d !== null);
          const last = [...week].reverse().find(d => d !== null);
          return (
            <button
              key={i}
              onClick={() => setActiveWeekIndex(i)}
              className={`flex flex-col items-center px-4 sm:px-5 py-2 rounded-xl font-bold transition-all shrink-0 snap-center ${
                i === activeWeekIndex
                  ? 'bg-indigo-900 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm sm:text-base leading-tight">שבוע {i + 1}</span>
              <span className={`text-[10px] sm:text-[11px] font-normal leading-tight ${i === activeWeekIndex ? 'text-indigo-300' : 'text-gray-400'}`}>
                {first}–{last}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setActiveWeekIndex(i => Math.min(weeks.length - 1, i + 1))}
          disabled={activeWeekIndex === weeks.length - 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-25 transition-colors sticky left-0 bg-white/80 backdrop-blur-sm z-10 shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Auto-fit table, centered */}
      <div className="flex justify-center">
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-x-auto">
          <table className="border-collapse" style={{ fontSize: '12.5px', tableLayout: 'auto', width: 'auto' }}>
            <thead>
              <tr>
                <th className="bg-indigo-950 text-indigo-300 text-right px-2 py-1.5 sticky right-0 z-10 border-b border-indigo-800 font-semibold whitespace-nowrap">
                  תורנות
                </th>
                {activeWeek.map((day, i) => {
                  const isWE = i === 5 || i === 6;
                  const isToday = day !== null && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                  return (
                    <th
                      key={i}
                      className={`px-3 py-1.5 border-x border-indigo-900 font-bold text-center border-b whitespace-nowrap
                        ${isWE ? 'bg-indigo-800 text-indigo-300' : 'bg-indigo-950 text-white'}
                        ${isToday ? 'ring-2 ring-inset ring-yellow-400' : ''}`}
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="text-[10px] font-normal text-indigo-400">{HEB_DAYS[i]}</span>
                        <span className={`text-sm ${isToday ? 'text-yellow-300 font-black' : 'font-bold'}`}>{day ?? '–'}</span>
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
                const divider = meta?.label;

                return (
                  <Fragment key={post.id}>
                    {divider && (
                      <tr>
                        <td
                          colSpan={8}
                          className="bg-indigo-50/50 text-indigo-400 text-[9px] font-bold uppercase tracking-widest py-0.5 px-2 text-right border-y border-indigo-100"
                        >
                          {divider}
                        </td>
                      </tr>
                    )}
                    <tr className="group">
                      <td
                        className={`text-right text-[11px] font-semibold whitespace-nowrap sticky right-0 z-10
                          border-b border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.08)]
                          px-2 py-0.5 text-white ${labelColor}`}
                        title={post.name}
                      >
                        {post.name}
                      </td>

                      {activeWeek.map((day, i) => {
                        const isWE = i === 5 || i === 6;
                        const isActive = post.daysOfWeek.includes(i);

                        if (day === null) {
                          return <td key={i} className="bg-gray-50 border-b border-l border-gray-100" />;
                        }

                        const ids = schedule[day]?.[post.id] ?? [];
                        const names = ids.map(id => residents.find(r => r.id === id)?.name ?? id).join(', ');

                        let cellCls = 'border-b border-l border-gray-100 px-2 py-0.5 text-center whitespace-nowrap transition-colors cursor-pointer ';
                        if (names) {
                          cellCls += isWE
                            ? 'bg-indigo-50 hover:bg-indigo-100 hover:ring-1 hover:ring-inset hover:ring-indigo-400 text-indigo-800 font-semibold'
                            : 'bg-white hover:bg-indigo-50 hover:ring-1 hover:ring-inset hover:ring-indigo-400 text-slate-900 font-semibold';
                        } else if (!isActive || isWE) {
                          cellCls += 'bg-slate-50/70 text-slate-200 hover:bg-indigo-50/40';
                        } else {
                          cellCls += 'bg-rose-50/40 text-rose-200 hover:bg-rose-100/60';
                        }

                        return (
                          <td
                            key={`${post.id}-${day}`}
                            className={cellCls}
                            onClick={(e) => setEditingCell({ day, postId: post.id, anchorEl: e.currentTarget })}
                          >
                            {names && (
                              <span className="leading-none" style={{ fontSize: 12 }} title={names}>
                                {names}
                              </span>
                            )}
                            {!names && (
                              <span className="opacity-0 group-hover:opacity-30 text-slate-400 text-sm leading-none">+</span>
                            )}
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
