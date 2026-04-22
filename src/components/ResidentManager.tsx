import { useState } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { UserPlus, Edit2, Trash2, Check, X } from 'lucide-react';
import type { ResidentGroup, Resident } from '../types';

export default function ResidentManager() {
  const { residents, addResident, updateResident, deleteResident } = useSchedulerStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [group, setGroup] = useState<ResidentGroup>('זוטר');
  const [startDate, setStartDate] = useState('');

  const groups: ResidentGroup[] = ['זוטר', 'מיון', 'בכיר', 'תורן חוץ'];

  const resetForm = () => {
    setName('');
    setGroup('זוטר');
    setStartDate('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    if (editingId) {
      updateResident(editingId, { name, group, startDate });
    } else {
      addResident({
        id: `res_${Date.now()}`,
        name,
        group,
        startDate,
        maxShiftsPerMonth: group === 'זוטר' ? 6 : 8
      });
    }
    resetForm();
  };

  const startEdit = (r: Resident) => {
    setEditingId(r.id);
    setName(r.name);
    setGroup(r.group);
    setStartDate(r.startDate);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') resetForm();
  };

  const handleRowBlur = (e: React.FocusEvent) => {
    // If focus moves outside the table row, automatically save
    if (!e.currentTarget.contains(e.relatedTarget)) {
      // Don't auto-save if we're adding a new user and didn't type a name
      if (isAdding && !name.trim()) {
        resetForm();
      } else {
        handleSave();
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ניהול רופאים</h2>
          <p className="text-sm text-gray-500 mt-1">הוסף, ערוך ומחק את רשימת הרופאים ותפקידיהם</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          הוסף רופא
        </button>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-12">#</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">שם הרופא</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">קבוצה / תפקיד</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">תאריך התחלה (ותק)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isAdding && (
              <tr className="bg-blue-50/50" onBlur={handleRowBlur}>
                <td className="px-6 py-4 text-gray-400 font-mono text-sm">+</td>
                <td className="px-6 py-4">
                  <input autoFocus type="text" placeholder="שם מלא..." onKeyDown={handleKeyDown} value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </td>
                <td className="px-6 py-4">
                  <select onKeyDown={handleKeyDown} value={group} onChange={(e) => setGroup(e.target.value as ResidentGroup)} className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 bg-white outline-none">
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input type="date" onKeyDown={handleKeyDown} value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 outline-none" />
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={handleSave} className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors" title="שמור"><Check className="w-4 h-4" /></button>
                  <button onClick={resetForm} className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="בטל"><X className="w-4 h-4" /></button>
                </td>
              </tr>
            )}
            
            {residents.length === 0 && !isAdding && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                  אין רופאים במערכת. לחץ על "הוסף רופא" כדי להתחיל.
                </td>
              </tr>
            )}

            {[...residents].sort((a, b) => {
               const groupOrder = { 'זוטר': 1, 'מיון': 2, 'בכיר': 3, 'תורן חוץ': 4 };
               return groupOrder[a.group] - groupOrder[b.group];
            }).map((r, index) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors" onBlur={editingId === r.id ? handleRowBlur : undefined}>
                {editingId === r.id ? (
                  <>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">{index + 1}</td>
                    <td className="px-6 py-4">
                      <input autoFocus type="text" onKeyDown={handleKeyDown} value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 outline-none" />
                    </td>
                    <td className="px-6 py-4">
                      <select onKeyDown={handleKeyDown} value={group} onChange={(e) => setGroup(e.target.value as ResidentGroup)} className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 bg-white outline-none">
                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input type="date" onKeyDown={handleKeyDown} value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 outline-none" />
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={handleSave} className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={resetForm} className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${r.group === 'זוטר' ? 'bg-blue-50 text-blue-700 border-blue-200' : r.group === 'מיון' ? 'bg-orange-50 text-orange-700 border-orange-200' : r.group === 'בכיר' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {r.group}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.startDate || 'לא צוין'}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => startEdit(r)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="ערוך">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteResident(r.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="מחק">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
