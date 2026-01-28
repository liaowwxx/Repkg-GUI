import { useState, useEffect } from 'react';
import { Package, Info, HelpCircle } from 'lucide-react';
import ExtractView from './components/ExtractView';
import InfoView from './components/InfoView';
import HelpView from './components/HelpView';

function App() {
  const [activeTab, setActiveTab] = useState('extract');
  const [isElectronReady, setIsElectronReady] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // 检查 electronAPI 是否可用
    const checkElectronAPI = async () => {
      if (typeof window !== 'undefined') {
        if (window.electronAPI) {
          console.log('✅ electronAPI 已加载:', Object.keys(window.electronAPI));
          try {
            const platformInfo = await window.electronAPI.getPlatform();
            setIsMac(platformInfo.isMac);
          } catch (e) {
            console.error('获取平台信息失败:', e);
          }
          setIsElectronReady(true);
        } else {
          console.warn('⚠️ electronAPI 未找到，某些功能可能不可用');
          // 延迟一下再检查，因为 preload 脚本可能还没加载完成
          setTimeout(() => {
            if (window.electronAPI) {
              console.log('✅ electronAPI 延迟加载成功');
              setIsElectronReady(true);
            } else {
              console.error('❌ electronAPI 仍然不可用');
              setIsElectronReady(true); // 仍然允许运行，但功能受限
            }
          }, 500);
        }
      }
    };
    
    checkElectronAPI();
  }, []);

  const tabs = [
    { id: 'extract', label: '提取 (Extract)', icon: Package },
    { id: 'info', label: '信息 (Info)', icon: Info },
    { id: 'help', label: '帮助 (Help)', icon: HelpCircle },
  ];

  if (!isElectronReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm drag-region select-none">
        <div className={`max-w-7xl mx-auto px-6 py-4 ${isMac ? 'pl-20' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">RePKG WebUI</h1>
              <p className="text-sm text-slate-500">测试版v2.1.0</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium transition-colors duration-200
                    border-b-2
                    ${
                      activeTab === tab.id
                        ? 'text-primary-600 border-primary-600 bg-primary-50'
                        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'extract' && <ExtractView />}
        {activeTab === 'info' && <InfoView />}
        {activeTab === 'help' && <HelpView />}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-slate-500">
        Built with Electron & React for RePKG
      </footer>
    </div>
  );
}

export default App;
