import { useState } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { Play, Settings2, DownloadCloud, Trash2 } from 'lucide-react';
import StationsTable from './StationsTable';
import UnassignedOverview from './UnassignedOverview';
import ImportScheduleModal from './ImportScheduleModal';

export default function ScheduleGrid() {
  const { schedule, month, year, runGenerator, residents, setMonthYear } = useSchedulerStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleGenerate = () => {
    runGenerator({
      preventConsecutiveShifts: true,
      enforcePostShiftRest: true,
      month,
      year
    });
  };

  const hasSchedule = Object.keys(schedule).length > 0;

  // Format YYYY-MM for HTML date input
  const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            סידור תורנויות - 
            <input 
              type="month" 
              value={monthString}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m] = e.target.value.split('-');
                  setMonthYear(parseInt(m) - 1, parseInt(y));
                }
              }}
              className="text-lg border-b-2 font-bold text-blue-600 border-blue-200 focus:border-blue-600 outline-none transition-colors pb-0.5" 
            />
          </h2>
          <p className="text-sm text-gray-500 mt-2">נהל את התורנויות וההקצאות לחודש הנבחר</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg font-medium transition-colors border border-emerald-200 text-sm whitespace-nowrap flex"
          >
            <DownloadCloud className="w-4 h-4 shrink-0" />
            ייבוא
          </button>
          
          <button 
            onClick={() => {
               if (window.confirm('האם אתה בטוח שברצונך למחוק את כל הסידור לחודש זה?')) {
                 useSchedulerStore.getState().setSchedule({});
               }
            }}
            className="flex-1 sm:flex-none items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg font-medium transition-colors border border-red-200 text-sm whitespace-nowrap flex"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            איפוס
          </button>
          <button className="flex-1 sm:flex-none items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-sm whitespace-nowrap flex">
            <Settings2 className="w-4 h-4 shrink-0" />
            הגדרות
          </button>
          <button 
            onClick={handleGenerate}
            disabled={residents.length === 0}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm ${residents.length === 0 ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <Play className="w-4 h-4 shrink-0" />
            חולל סידור
          </button>
        </div>
      </div>

      {!hasSchedule ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-6 h-6 ml-1" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">אין סידור פעיל</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {residents.length === 0 
              ? 'על מנת להתחיל, אנא עבור ללשונית "רופאים והרשאות" והוסף רופאים למערכת.' 
              : 'לחץ על "חולל סידור אוטומטי" כדי להתחיל בתהליך השיבוץ החכם.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <StationsTable />
          <UnassignedOverview />
        </div>
      )}

      {isImportModalOpen && (
        <ImportScheduleModal onClose={() => setIsImportModalOpen(false)} />
      )}
    </div>
  );
}
