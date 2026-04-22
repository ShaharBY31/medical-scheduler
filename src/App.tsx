import { useState } from 'react';
import ResidentManager from './components/ResidentManager';
import ScheduleGrid from './components/ScheduleGrid';
import ShiftsTable from './components/ShiftsTable';
import StatsTable from './components/StatsTable';
import ValidationPanel from './components/ValidationPanel';
import { Calendar, Clock, Users, BarChart3, AlertCircle } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'shifts' | 'stats' | 'validation' | 'residents'>('schedule');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      {/* Top Navbar */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Medical Scheduler V2
              </h1>
            </div>
            
            <nav className="flex space-x-4 space-x-reverse">
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Calendar className="w-4 h-4" />
                סידור עבודה
              </button>
              <button 
                onClick={() => setActiveTab('shifts')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'shifts' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Clock className="w-4 h-4" />
                תורנויות וססיות
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'stats' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <BarChart3 className="w-4 h-4" />
                מעקב מדדים
              </button>
              <button 
                onClick={() => setActiveTab('validation')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'validation' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <AlertCircle className="w-4 h-4" />
                בקרת שגיאות
              </button>
              <button 
                onClick={() => setActiveTab('residents')}
                className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'residents' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Users className="w-4 h-4" />
                רופאים והרשאות
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
