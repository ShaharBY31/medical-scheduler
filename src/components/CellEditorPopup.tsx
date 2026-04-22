import { useRef, useEffect } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { X, ArrowRightLeft, UserPlus } from 'lucide-react';
import type { Resident } from '../types';

interface PopoverProps {
  day: number;
  postId: string;
  onClose: () => void;
  anchorEl: HTMLElement;
}

export default function CellEditorPopup({ day, postId, onClose, anchorEl }: PopoverProps) {
  const { schedule, posts, residents, updateDaySchedule } = useSchedulerStore();
  const popupRef = useRef<HTMLDivElement>(null);

  const targetPost = posts.find(p => p.id === postId);
  const currentAssignedIds = schedule[day]?.[postId] || [];
  const currentResidents = residents.filter(r => currentAssignedIds.includes(r.id));

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) && !anchorEl.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorEl]);

  // Position logic relative to anchor
  const rect = anchorEl.getBoundingClientRect();
  const top = rect.bottom + window.scrollY;
  // Try to align right, but keep on screen
  let left = rect.right + window.scrollX - 350; // 350 is approx width
  if (left < 10) left = 10;

  // Categorize All Residents
  const unassigned: Resident[] = [];
  const busyElsewhere: { resident: Resident; busyPostId: string; busyPostName: string }[] = [];

  // Exclude external doctors from non-shifts
  const allowedGroups = targetPost?.allowedGroups || [];

  // Identify who is completely blocked today (Rest or Vacation)
  const restingResidentIds = new Set([
    ...(schedule[day]?.['p_rest'] || []),
    ...(schedule[day]?.['p_vac'] || [])
  ]);

  residents.forEach(r => {
    // Basic filter: must be in allowed groups
    if (!allowedGroups.includes(r.group)) return;

    // Strict filter: If they are resting or on vacation, they CANNOT be swapped into a working station
    if (restingResidentIds.has(r.id)) return;

    // Check where they are today
    let foundPostId = null;
    let foundPostName = '';
    
    // Scan schedule for today
    if (schedule[day]) {
      Object.entries(schedule[day]).forEach(([pId, resIds]) => {
        if (resIds.includes(r.id)) {
          foundPostId = pId;
          const pName = posts.find(p => p.id === pId)?.name || 'לא ידוע';
          foundPostName = pName;
        }
      });
    }

    if (foundPostId) {
      if (foundPostId !== postId) {
        busyElsewhere.push({ resident: r, busyPostId: foundPostId, busyPostName: foundPostName });
      }
    } else {
      unassigned.push(r);
    }
  });

  const handleSelectResident = (newResidentId: string, oldPostIdOfResident?: string) => {
    const updates: Record<string, string[]> = {};
    
    // We are replacing whatever was in targetPost with the new resident
    updates[postId] = [newResidentId];

    // If the new resident was dragged from another post, SWAP or MOVE
    if (oldPostIdOfResident) {
      // Put the current residents into their old post (SWAP)
      updates[oldPostIdOfResident] = currentAssignedIds.length > 0 ? [...currentAssignedIds] : [];
    } else if (currentAssignedIds.length > 0) {
       // If there is no old post, the old residents just become unassigned
       // (They are inherently unassigned because they are removed from updates[postId])
    }

    updateDaySchedule(day, updates);
    onClose();
  };

  const handleRemove = (resId: string) => {
    const updates = { [postId]: currentAssignedIds.filter(id => id !== resId) };
    updateDaySchedule(day, updates);
  };

  return (
    <div 
      ref={popupRef}
      className="absolute z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[400px]"
      style={{ top: `${top + 8}px`, left: `${left}px` }}
      dir="rtl"
    >
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">הקצאה ידנית: {targetPost?.name}</h4>
          <p className="text-xs text-gray-500">יום {day}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto p-2 flex-col flex gap-4">
        {/* Current Assignees */}
        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase mb-2 px-2">משובץ כעת</div>
          {currentResidents.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
              אין שיבוץ לעמדה זו
            </div>
          ) : (
            <div className="space-y-1">
              {currentResidents.map(r => (
                <div key={r.id} className="flex justify-between items-center group bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-blue-900">{r.name}</span>
                    <span className="text-[10px] text-blue-600 font-medium">{r.group}</span>
                  </div>
                  <button 
                    onClick={() => handleRemove(r.id)}
                    className="p-1.5 text-blue-400 hover:text-red-500 hover:bg-white rounded-md transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    title="הסר שיבוץ"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Free Residents */}
        <div>
           <div className="text-[11px] font-bold text-gray-400 uppercase mb-2 px-2 flex justify-between">
              רופאים זמינים
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{unassigned.length}</span>
           </div>
           
           {unassigned.length === 0 ? (
             <div className="px-3 text-xs text-gray-400">אין רופאים פנויים שעומדים בהרשאות התחנה.</div>
           ) : (
             <div className="space-y-1">
                {unassigned.map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => handleSelectResident(r.id)}
                    className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors text-right group"
                  >
                     <div>
                       <div className="text-sm font-medium text-gray-800">{r.name}</div>
                       <div className="text-[10px] text-gray-500">{r.group}</div>
                     </div>
                     <UserPlus className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                  </button>
                ))}
             </div>
           )}
        </div>

        {/* Swap Candidates (Busy) */}
        {busyElsewhere.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-orange-400 uppercase mb-2 px-2 border-t border-gray-100 pt-3">
              מוקצים לעמדה אחרת (החלפה)
            </div>
            <div className="space-y-1">
              {busyElsewhere.map(({ resident, busyPostName, busyPostId }) => (
                <button 
                  key={resident.id} 
                  onClick={() => handleSelectResident(resident.id, busyPostId)}
                  className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-colors text-right group"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{resident.name}</div>
                    <div className="text-[10px] text-orange-600 font-medium">כעת ב: {busyPostName}</div>
                  </div>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
