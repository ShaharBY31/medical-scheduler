import { useState, useEffect } from 'react';
import ResidentManager from './components/ResidentManager';
import ScheduleGrid from './components/ScheduleGrid';
import ShiftsTable from './components/ShiftsTable';
import StatsTable from './components/StatsTable';
import ValidationPanel from './components/ValidationPanel';
import ControlView from './components/ControlView';
import AdminLogin from './components/AdminLogin';
import { Calendar, Clock, Users, BarChart3, AlertCircle, MonitorCheck, Lock, LockOpen } from 'lucide-react';
import { useSchedulerStore } from './store/useSchedulerStore';

function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'shifts' | 'stats' | 'validation' | 'residents' | 'control'>('schedule');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const { setMonthYear, isAdminMode, exitAdminMode, loadFromServer } = useSchedulerStore();

  useEffect(() => {
    const today = new Date();
    setMonthYear(today.getMonth(), today.getFullYear());
    loadFromServer();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      {showAdminLogin && <AdminLogin onClose={() => setShowAdminLogin(false)} />}

      {/* Top Navbar */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-16 py-3 md:py-0 gap-3 md:gap-0">
            <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Medical Scheduler V2
              </h1>
            </div>

            <nav className="flex items-center space-x-2 space-x-reverse w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar snap-x snap-mandatory">
              <button
                onClick={() => setActiveTab('control')}
                className={`px-4 py-2 font-semibold rounded-md transition-all flex items-center gap-2 border whitespace-nowrap snap-start ${
                  activeTab === 'control'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <MonitorCheck className="w-4 h-4 shrink-0" />
                {'\u05e1\u05d1\u05d9\u05d1\u05ea \u05d1\u05e7\u05e8\u05d4'}
              </button>

              <div className="hidden md:block w-px h-6 bg-gray-300 mx-1 shrink-0" />

              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'schedule' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                {'\u05e1\u05d9\u05d3\u05d5\u05e8 \u05e2\u05d1\u05d5\u05d3\u05d4'}
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'shifts' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                {'\u05ea\u05d5\u05e8\u05e0\u05d5\u05d9\u05d5\u05ea \u05d5\u05e1\u05e1\u05d9\u05d5\u05ea'}
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'stats' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                {'\u05de\u05e2\u05e7\u05d1 \u05de\u05d3\u05d3\u05d9\u05dd'}
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'validation' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {'\u05d1\u05e7\u05e8\u05ea \u05e9\u05d2\u05d9\u05d0\u05d5\u05ea'}
              </button>
              <button
                onClick={() => setActiveTab('residents')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${activeTab === 'residents' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Users className="w-4 h-4 shrink-0" />
                {'\u05e8\u05d5\u05e4\u05d0\u05d9\u05dd \u05d5\u05d4\u05e8\u05e9\u05d0\u05d5\u05ea'}
              </button>

              <div className="hidden md:block w-px h-6 bg-gray-300 mx-1 shrink-0" />

              {/* Admin lock button */}
              {isAdminMode ? (
                <button
                  onClick={exitAdminMode}
                  title="Exit admin mode"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-sm font-medium whitespace-nowrap shrink-0"
                >
                  <LockOpen className="w-4 h-4" />
                  {'\u05de\u05e0\u05d4\u05dc'}
                </button>
              ) : (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  title="Admin login"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-sm whitespace-nowrap shrink-0"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
        activeTab === 'control' ? 'max-w-full' : 'max-w-7xl'
      }`}>
        {activeTab === 'control' && <ControlView />}
        {activeTab === 'schedule' && <ScheduleGrid />}
        {activeTab === 'shifts' && <div className="mt-6"><ShiftsTable /></div>}
        {activeTab === 'stats' && <div className="mt-6"><StatsTable /></div>}
        {activeTab === 'validation' && <div className="mt-6"><ValidationPanel /></div>}
        {activeTab === 'residents' && <ResidentManager />}
      </main>
    </div>
  );
}

export default App;
