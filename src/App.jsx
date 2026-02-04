import { useState, useEffect } from 'react';
import { Package, Languages } from 'lucide-react';
import ExtractView from './components/ExtractView';
import { translations } from './utils/i18n';

function App() {
  const [isElectronReady, setIsElectronReady] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('repkg-lang') || 'zh');

  useEffect(() => {
    localStorage.setItem('repkg-lang', lang);
  }, [lang]);

  const t = translations[lang];

  useEffect(() => {
    const checkElectronAPI = async () => {
      if (typeof window !== 'undefined') {
        if (window.electronAPI) {
          try {
            const platformInfo = await window.electronAPI.getPlatform();
            setIsMac(platformInfo.isMac);
          } catch (e) {
            console.error('获取平台信息失败:', e);
          }
          setIsElectronReady(true);
        } else {
          setTimeout(() => {
            if (window.electronAPI) {
              setIsElectronReady(true);
            } else {
              setIsElectronReady(true); 
            }
          }, 500);
        }
      }
    };
    
    checkElectronAPI();
  }, []);

  if (!isElectronReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      {/* Header - Removed max-w to allow full width */}
      <header className="bg-white border-b border-slate-200 shadow-sm drag-region select-none shrink-0">
        <div className={`px-6 py-4 flex items-center justify-between ${isMac ? 'pl-20' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
              <p className="text-sm text-slate-500">v2.4.0</p>
            </div>
          </div>

          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="no-drag p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600"
            title={lang === 'zh' ? 'Switch to English' : '切换至中文'}
          >
            <Languages className="w-5 h-5" />
            <span className="text-sm font-medium uppercase">{lang === 'zh' ? 'EN' : 'ZH'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Removed max-w to allow full width */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full px-6 py-6 overflow-hidden">
          <ExtractView lang={lang} />
        </div>
      </main>
    </div>
  );
}

export default App;
