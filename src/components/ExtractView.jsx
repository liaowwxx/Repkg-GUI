import { useState, useEffect } from 'react';
import { FolderOpen, File, Play, Settings, ChevronDown, Check, Image as ImageIcon } from 'lucide-react';
import { useRepkg } from '../hooks/useRepkg';

function ExtractView() {
  const [inputPath, setInputPath] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [ignoreExts, setIgnoreExts] = useState('');
  const [onlyExts, setOnlyExts] = useState('');
  const [convertTex, setConvertTex] = useState(false);
  const [noTexConvert, setNoTexConvert] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [debugInfo, setDebugInfo] = useState(false);
  const [recursive, setRecursive] = useState(true);
  const [singleDir, setSingleDir] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);
  const [copyProject, setCopyProject] = useState(false);
  const [useName, setUseName] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [wallpapers, setWallpapers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isScanning, setIsScanning] = useState(false);
  
  const { runCommand, output, isRunning, setOutput, setIsRunning } = useRepkg();

  useEffect(() => {
    const scanPath = async () => {
      if (inputPath && window.electronAPI?.scanWallpapers) {
        setIsScanning(true);
        try {
          const results = await window.electronAPI.scanWallpapers(inputPath);
          setWallpapers(results);
          setSelectedIds(new Set()); // Reset selection when path changes
        } catch (err) {
          console.error('扫描壁纸失败:', err);
          setWallpapers([]);
        } finally {
          setIsScanning(false);
        }
      } else {
        setWallpapers([]);
      }
    };
    scanPath();
  }, [inputPath]);

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === wallpapers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(wallpapers.map(w => w.id)));
    }
  };

  const handleSelectFile = async () => {
    if (!window.electronAPI) {
      alert('文件选择功能仅在 Electron 环境中可用');
      return;
    }
    const path = await window.electronAPI.selectFile();
    if (path) setInputPath(path);
  };

  const handleSelectFolder = async () => {
    if (!window.electronAPI) {
      alert('文件夹选择功能仅在 Electron 环境中可用');
      return;
    }
    const path = await window.electronAPI.selectFolder();
    if (path) setInputPath(path);
  };

  const handleSelectOutput = async () => {
    if (!window.electronAPI) {
      alert('文件夹选择功能仅在 Electron 环境中可用');
      return;
    }
    const path = await window.electronAPI.selectFolder();
    if (path) setOutputDir(path);
  };

  const handleExtract = async () => {
    if (!inputPath) {
      alert('请输入有效的输入路径');
      return;
    }

    const commonArgs = ['extract'];
    if (outputDir) commonArgs.push('-o', outputDir);
    if (ignoreExts) commonArgs.push('-i', ignoreExts);
    if (onlyExts) commonArgs.push('-e', onlyExts);
    if (debugInfo) commonArgs.push('-d');
    if (convertTex) commonArgs.push('-t');
    if (singleDir) commonArgs.push('-s');
    if (recursive) commonArgs.push('-r');
    if (copyProject) commonArgs.push('-c');
    if (useName) commonArgs.push('-n');
    if (noTexConvert) commonArgs.push('--no-tex-convert');
    if (overwrite) commonArgs.push('--overwrite');

    if (selectedIds.size > 0) {
      const selectedWallpapers = wallpapers.filter(w => selectedIds.has(w.id));
      let isFirst = true;
      setIsRunning(true);
      
      for (const wp of selectedWallpapers) {
        if (wp.isPkg) {
          await runCommand([...commonArgs, wp.path], isFirst);
        } else {
          if (isFirst) setOutput('');
          
          const targetDir = outputDir ? (singleDir ? outputDir : `${outputDir}/${wp.name}`) : `${wp.path}/extracted`;
          
          setOutput(prev => prev + `\n[非 PKG 壁纸] 正在复制资源: ${wp.name}...`);
          
          try {
            const result = await window.electronAPI.copyWallpaperAssets({
              srcPath: wp.path,
              destDir: targetDir
            });
            
            if (result.success) {
              setOutput(prev => prev + `\n✅ 成功复制 ${result.copiedCount} 个资源文件到: ${targetDir}`);
            } else {
              setOutput(prev => prev + `\n❌ 复制失败: ${result.error}`);
            }
          } catch (err) {
            setOutput(prev => prev + `\n❌ 发生错误: ${err.message}`);
          }
        }
        isFirst = false;
      }
      setIsRunning(false);
    } else {
      await runCommand([...commonArgs, inputPath]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={`grid grid-cols-1 ${wallpapers.length > 0 ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Left Side: Wallpaper Gallery */}
        {wallpapers.length > 0 && (
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="card h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary-600" />
                  壁纸预览 ({wallpapers.length})
                </h2>
                <button 
                  onClick={selectAll}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {selectedIds.size === wallpapers.length ? '取消全选' : '全选'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '600px' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {wallpapers.map((wp) => (
                    <div 
                      key={wp.id}
                      onClick={() => toggleSelect(wp.id)}
                      className={`
                        relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                        ${selectedIds.has(wp.id) 
                          ? 'border-primary-500 ring-2 ring-primary-200' 
                          : 'border-transparent hover:border-slate-300'
                        }
                      `}
                    >
                      <img 
                        src={wp.preview} 
                        alt={wp.name}
                        className="w-full aspect-square object-cover bg-slate-100"
                      />
                      
                      {/* Non-PKG Badge */}
                      {!wp.isPkg && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold shadow-sm">
                          非PKG
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-xs text-white truncate" title={wp.name}>
                          {wp.name}
                        </p>
                      </div>
                      {selectedIds.has(wp.id) && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-lg z-10">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedIds.size > 0 && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-primary-700">
                    已选择 {selectedIds.size} 个项目
                  </span>
                  <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    清除选择
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Side: Settings */}
        <div className={wallpapers.length > 0 ? 'lg:col-span-1' : ''}>
          <div className="card sticky top-6">
            <h2 className="text-xl font-semibold mb-4">提取设置</h2>
            
            {/* Input Path */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                输入路径
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={inputPath}
                  onChange={(e) => setInputPath(e.target.value)}
                  placeholder="PKG/TEX 文件或目录"
                  className="input-field w-full"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectFile}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <File className="w-4 h-4" />
                    文件
                  </button>
                  <button
                    onClick={handleSelectFolder}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    目录
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Output Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  输出设置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      输出目录 (-o)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={outputDir}
                        onChange={(e) => setOutputDir(e.target.value)}
                        placeholder="选择输出目录"
                        className="input-field flex-1"
                      />
                      <button
                        onClick={handleSelectOutput}
                        className="btn-secondary whitespace-nowrap"
                      >
                        选择
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      忽略扩展名 (-i)
                    </label>
                    <input
                      type="text"
                      value={ignoreExts}
                      onChange={(e) => setIgnoreExts(e.target.value)}
                      placeholder="txt,log"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Conversion Options */}
              <div>
                <h3 className="text-lg font-medium mb-3">选项</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={convertTex}
                      onChange={(e) => setConvertTex(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm">TEX 转图像 (-t)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={overwrite}
                      onChange={(e) => setOverwrite(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm">覆盖现有文件</span>
                  </label>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  />
                  高级选项
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-2 p-3 bg-slate-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recursive}
                        onChange={(e) => setRecursive(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm">递归搜索 (-r)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={singleDir}
                        onChange={(e) => setSingleDir(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm">单一目录 (-s)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useName}
                        onChange={(e) => setUseName(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm">使用项目名称 (-n)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Execute Button */}
              <div className="pt-2">
                <button
                  onClick={handleExtract}
                  disabled={isRunning || !inputPath}
                  className="btn-primary flex items-center gap-2 w-full justify-center py-3 shadow-md"
                >
                  <Play className="w-5 h-5" />
                  {isRunning ? '执行中...' : selectedIds.size > 0 ? `解包选中项 (${selectedIds.size})` : '开始执行提取'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Output Log */}
      {output && (
        <div className="card">
          <h3 className="text-lg font-medium mb-4">输出日志</h3>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96 custom-scrollbar">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExtractView;
