import { useState, useEffect } from 'react';
import ControlView from './components/ControlView';
import ResidentManager from './components/ResidentManager';
import ScheduleGrid from './components/ScheduleGrid';
import ShiftsTable from './components/ShiftsTable';
import StatsTable from './components/StatsTable';
import ValidationPanel from './components/ValidationPanel';
import { Calendar, Clock, Users, BarChart3, AlertCircle } from 'lucide-react';
import { useSchedulerStore } from './store/useSchedulerStore';

const isAdminDomain = window.location.hostname.startsWith('admin.');

function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'shifts' | 'stats' | 'validation' | 'residents' | 'control'>('schedule');
  const { setMonthYear, isAdminMode, loadFromServer, setAdminMode } = useSchedulerStore();

  useEffect(() => {
    const today = new Date();
    setMonthYear(today.getMonth(), today.getFullYear());
    loadFromServer();
    if (isAdminDomain && !isAdminMode) {
      setAdminMode('Caduceus2024');
    }
  }, []);

  if (!isAdminDomain) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                סידור אורתופדיה קפלן
              </h1>
            </div>
          </div>
        </header>
        <main className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
          <ControlView />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-16 py-3 md:py-0 gap-3 md:gap-0">
            <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                סידור אורתופדיה קפלן
              </h1>
            </div>

            <nav className="flex items-center space-x-2 space-x-reverse w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar snap-x snap-mandatory">

                            <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'schedule' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                {'סידור עבודה'}
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'shifts' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                {'תורנויות וססיות'}
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'stats' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                {'מעקב מדדים'}
              </button>

              {isAdminMode && (
                <>
                  <button
                    onClick={() => setActiveTab('validation')}
                    className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'validation' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {'בקרת שגיאות'}
                  </button>
                  <button
                    onClick={() => setActiveTab('residents')}
                    className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'residents' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    {'רופאים והרשאות'}
                  </button>

                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
        activeTab === 'control' ? 'max-w-full' : 'max-w-7xl'
      }`}>
        {activeTab === 'schedule' && <ScheduleGrid />}
        {activeTab === 'shifts' && <div className="mt-6"><ShiftsTable /></div>}
        {activeTab === 'stats' && <div className="mt-6"><StatsTable /></div>}
        {activeTab === 'validation' && isAdminMode && <div className="mt-6"><ValidationPanel /></div>}
        {activeTab === 'residents' && isAdminMode && <ResidentManager />}
      </main>
    </div>
  );
}

export default App;
