import { useMemo, useState, Fragment, useEffect } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const SECTION_BREAKS: Record<string, string> = {
  'p_dept':   'מחלקה ומיון',
  'p_or1':    'חדרי ניתוח',
  'p_ds1':    'אשפוז יום',
  'p_cl1':    'מרפאות',
  'p_ex1':    'חוץ',
  'p_bahir':  'תורנויות',
  'p_sess_b': 'ססיות',
  'p_rest':   'מעקב',
};

const SHIFT_ORDER = ['p_bahir', 'p_miyun', 'p_hazi', 'p_sess_b', 'p_sess_z', 'p_rest', 'p_vac'];

const HEB_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const ROW_LABEL: Record<string, string> = {
  'dept':     'bg-slate-700 text-white',
  'or':       'bg-indigo-700 text-white',
  'dayhosp':  'bg-teal-700 text-white',
  'clinic':   'bg-sky-700 text-white',
  'external': 'bg-orange-700 text-white',
  'shift':    'bg-rose-800 text-white',
  'tracking': 'bg-gray-600 text-white',
  'default':  'bg-gray-100 text-gray-700',
};

function rowCategory(post: { id: string; type: string }): string {
  if (['p_rest', 'p_vac'].includes(post.id)) return 'tracking';
  if (['shift', 'session'].includes(post.type)) return 'shift';
  if (['p_dept', 'p_er1', 'p_er2'].includes(post.id)) return 'dept';
  if (post.id.startsWith('p_or')) return 'or';
  if (post.id.startsWith('p_ds')) return 'dayhosp';
  if (post.id.startsWith('p_cl')) return 'clinic';
  if (post.id.startsWith('p_ex')) return 'external';
  return 'default';
}

export default function ControlView() {
  const { schedule, month, year, posts, residents } = useSchedulerStore();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const hasSchedule = Object.keys(schedule).length > 0;

  // Build weeks array (Sun-Sat)
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

  const [weekIdx, setWeekIdx] = useState(initialWeek);
  
  // Update weekIdx if initialWeek changes
  useEffect(() => {
    setWeekIdx(initialWeek);
  }, [initialWeek]);

  const activeWeek = weeks[weekIdx] ?? [];

  // Sort posts
  const stationPosts = useMemo(() => [...posts].sort((a, b) => {
    const isAS = ['shift', 'session'].includes(a.type) || ['p_rest', 'p_vac'].includes(a.id);
    const isBS = ['shift', 'session'].includes(b.type) || ['p_rest', 'p_vac'].includes(b.id);
    if (isAS && !isBS) return 1;
    if (!isAS && isBS) return -1;
    if (isAS && isBS) {
      const ai = SHIFT_ORDER.indexOf(a.id), bi = SHIFT_ORDER.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return 0;
  }).filter(p => p.daysOfWeek.length > 0 || ['p_rest', 'p_vac'].includes(p.id)), [posts]);

  const monthLabel = new Date(year, month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  if (!hasSchedule) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-600 mb-1">אין סידור פעיל לחודש זה</h3>
        <p className="text-sm text-gray-400">עבור ל"סידור עבודה" וחולל סידור כדי להציגו כאן.</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-3">
      {/* Month title — centered */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">{monthLabel}</h2>
        <p className="text-xs text-gray-400 mt-0.5">סביבת בקרה · קריאה בלבד</p>
      </div>

      {/* Big centered week nav */}
      <div className="flex items-center sm:justify-center gap-2 overflow-x-auto pb-2 px-1 hide-scrollbar snap-x">
        <button
          onClick={() => setWeekIdx(i => Math.max(0, i - 1))}
          disabled={weekIdx === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-25 transition-colors sticky right-0 bg-white/80 backdrop-blur-sm z-10 shrink-0"
          title="שבוע קודם"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        {weeks.map((week, i) => {
          const first = week.find(d => d !== null);
          const last = [...week].reverse().find(d => d !== null);
          return (
            <button
              key={i}
              onClick={() => setWeekIdx(i)}
              className={`flex flex-col items-center px-4 sm:px-5 py-2 rounded-xl font-bold transition-all shrink-0 snap-center ${
                i === weekIdx
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm sm:text-base leading-tight">שבוע {i + 1}</span>
              <span className={`text-[10px] sm:text-[11px] font-normal leading-tight ${
                i === weekIdx ? 'text-indigo-200' : 'text-gray-400'
              }`}>{first}–{last}</span>
            </button>
          );
        })}

        <button
          onClick={() => setWeekIdx(i => Math.min(weeks.length - 1, i + 1))}
          disabled={weekIdx === weeks.length - 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-25 transition-colors sticky left-0 bg-white/80 backdrop-blur-sm z-10 shrink-0"
          title="שבוע הבא"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Table — auto-sized like Excel: each column = content width, centered */}
      <div className="flex justify-center">
      <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-x-auto">
          <table className="border-collapse" style={{ fontSize: '12.5px', tableLayout: 'auto', width: 'auto' }}>
            <thead>
              <tr>
                {/* Sticky row label — narrow */}
                <th
                  className="bg-slate-900 text-slate-300 text-right px-2 py-1.5 sticky right-0 z-10 border-b border-slate-700 font-semibold whitespace-nowrap"
                >
                  תחנה
                </th>
                {activeWeek.map((day, i) => {
                  const isWE = i === 5 || i === 6;
                  const isToday =
                    day !== null &&
                    new Date().getDate() === day &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;
                  return (
                    <th
                      key={i}
                      className={`px-3 py-1.5 border-x border-slate-800 font-bold text-center border-b whitespace-nowrap
                        ${isWE ? 'bg-slate-600 text-slate-200' : 'bg-slate-900 text-white'}
                        ${isToday ? 'ring-2 ring-inset ring-yellow-400' : ''}`}
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="text-[10px] font-normal text-slate-400">{HEB_DAYS[i]}</span>
                        <span className={`text-sm ${isToday ? 'text-yellow-300 font-black' : 'font-bold'}`}>{day ?? '–'}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {stationPosts.map((post) => {
                const cat = rowCategory(post);
                const labelCls = ROW_LABEL[cat] ?? ROW_LABEL['default'];
                const divider = SECTION_BREAKS[post.id];

                return (
                  <Fragment key={post.id}>
                    {divider && (
                      <tr>
                        <td
                          colSpan={8}
                          className="bg-gray-50 text-gray-400 text-[9px] font-bold uppercase tracking-widest py-0.5 px-2 text-right border-y border-gray-200"
                        >
                          {divider}
                        </td>
                      </tr>
                    )}
                    <tr className="group">
                      {/* Row label — shrinks to text */}
                      <td
                        className={`text-right text-[11px] font-semibold whitespace-nowrap sticky right-0 z-10
                          border-b border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.08)]
                          px-2 py-0.5 ${labelCls}`}
                        title={post.name}
                      >
                        {post.name}
                      </td>

                      {activeWeek.map((day, i) => {
                        const isWE = i === 5 || i === 6;
                        const isActive = post.daysOfWeek.includes(i);

                        if (day === null) {
                          return (
                            <td key={i} className="bg-gray-50 border-b border-l border-gray-100" />
                          );
                        }

                        const ids = schedule[day]?.[post.id] ?? [];
                        const names = ids
                          .map(id => residents.find(r => r.id === id)?.name ?? id)
                          .join(', ');

                        let cellCls = 'border-b border-l border-gray-100 px-2 py-0.5 text-center whitespace-nowrap ';
                        if (names) {
                          cellCls += isWE
                            ? 'bg-slate-100 text-slate-800 font-semibold'
                            : 'bg-white text-slate-900 font-semibold';
                        } else if (!isActive || isWE) {
                          cellCls += 'bg-slate-50/70 text-slate-200';
                        } else {
                          cellCls += 'bg-rose-50/40 text-rose-200';
                        }

                        return (
                          <td key={`${post.id}-${day}`} className={cellCls}>
                            {names && (
                              <span
                                className="leading-none"
                                style={{ fontSize: 12 }}
                                title={names}
                              >
                                {names}
                              </span>
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
    </div>
  );
}
