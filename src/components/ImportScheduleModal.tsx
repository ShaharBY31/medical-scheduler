import { useState } from 'react';
import { X, Upload, Link as LinkIcon, FileSpreadsheet } from 'lucide-react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { parseScheduleCSV } from '../utils/csvParser';
import { parseExcelSchedule } from '../utils/excelParser';

interface Props {
  onClose: () => void;
}

export default function ImportScheduleModal({ onClose }: Props) {
  const { posts, residents, schedule, setSchedule } = useSchedulerStore();
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('link');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLinkSubmit = async () => {
    if (!url) return;
    setLoading(true);
    setError('');

    try {
      // Basic Google Sheets URL parser
      let fetchUrl = url;
      if (url.includes('docs.google.com/spreadsheets/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = url.match(/gid=([0-9]+)/);
        if (match) {
          const sheetId = match[1];
          const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';
          fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('שגיאה בגישה לקובץ. ייתכן והוא לא מוגדר כציבורי.');
      
      const csvText = await response.text();
      const newScheduleData = parseScheduleCSV(csvText, posts, residents);
      
      // Merge with existing schedule instead of overwriting (to support importing week-by-week tabs)
      const mergedSchedule = { ...schedule };
      Object.keys(newScheduleData).forEach((dayStr) => {
         const dayNum = parseInt(dayStr, 10);
         mergedSchedule[dayNum] = { ...mergedSchedule[dayNum], ...newScheduleData[dayNum] };
      });
      
      setSchedule(mergedSchedule);
      onClose();
    } catch (err: any) {
      setError(err.message || 'שגיאה בלתי ניתנת לפיענוח, נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    const reader = new FileReader();
    
    // Support for multiple formats
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const newScheduleData = parseExcelSchedule(arrayBuffer, posts, residents);
          
          const mergedSchedule = { ...schedule };
          Object.keys(newScheduleData).forEach((dayStr) => {
             const dayNum = parseInt(dayStr, 10);
             mergedSchedule[dayNum] = { ...mergedSchedule[dayNum], ...newScheduleData[dayNum] };
          });
  
          setSchedule(mergedSchedule);
          onClose();
        } catch (err: any) {
          setError('שגיאה בקריאת קובץ האקסל. ודא שהתבנית תקינה.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const newScheduleData = parseScheduleCSV(csvText, posts, residents);
          
          const mergedSchedule = { ...schedule };
          Object.keys(newScheduleData).forEach((dayStr) => {
             const dayNum = parseInt(dayStr, 10);
             mergedSchedule[dayNum] = { ...mergedSchedule[dayNum], ...newScheduleData[dayNum] };
          });

          setSchedule(mergedSchedule);
          onClose();
        } catch (err: any) {
          setError('שגיאה בקריאת קובץ CSV.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" dir="rtl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">ייבוא סידור קיים</h2>
              <p className="text-sm text-gray-500">טען משבצות עבודה מ-Excel או Google Sheets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex space-x-2 space-x-reverse mb-6">
            <button 
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'link' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <LinkIcon className="w-4 h-4 inline-block ml-2" />
              מקישור חיצוני (Google)
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'upload' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Upload className="w-4 h-4 inline-block ml-2" />
              העלאת קובץ מגוב
            </button>
          </div>

          {activeTab === 'link' ? (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
                 <h4 className="font-bold text-orange-800 text-sm mb-1">הערה חשובה:</h4>
                 <p className="text-sm text-orange-700">ייבוא מהקישור ישאב <b>אך ורק</b> את הלשונית (השבוע) שמופיעה בלינק! אם הקובץ שלך מחולק לשבועות נפרדים בגוגל שיטס, עדיף לך להוריד את הקובץ כ-Excel ולהעלות אותו בטאב השני כדי לסרוק את כל השבועות במכה אחת.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">הדבק קישור משותף ל-Google Sheets</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full text-left bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  dir="ltr"
                />
              </div>
              <button 
                onClick={handleLinkSubmit}
                disabled={!url || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'מייבא נתונים...' : 'הפעל ייבוא לסידור הנוכחי'}
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <input 
                type="file" 
                id="file-upload" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
                className="hidden" 
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">העלה קובץ Excel.xlsx</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  המערכת שלנו יודעת לקרוא פנימה את <b>כל</b> הלשוניות של השבועות בבת אחת. מורידים מגוגל שיטס <code>File -&gt; Download -&gt; Excel</code> וגוררים לכאן!
                </p>
              </label>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
