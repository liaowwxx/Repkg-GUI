import { useState, useEffect, useMemo, useRef } from 'react';
import { FolderOpen, File, Play, Settings, ChevronDown, Check, Image as ImageIcon, Search, Filter, ChevronLeft, ChevronRight, MoreVertical, X, Monitor } from 'lucide-react';
import { useRepkg } from '../hooks/useRepkg';

const ITEMS_PER_PAGE = 32;

function ExtractView() {
  const [inputPath, setInputPath] = useState(() => localStorage.getItem('repkg-inputPath') || '');
  const [outputDir, setOutputDir] = useState(() => localStorage.getItem('repkg-outputDir') || '');
  const [ignoreExts, setIgnoreExts] = useState(() => localStorage.getItem('repkg-ignoreExts') || '');
  const [onlyExts, setOnlyExts] = useState(() => localStorage.getItem('repkg-onlyExts') || '');
  const [convertTex, setConvertTex] = useState(() => localStorage.getItem('repkg-convertTex') === 'true');
  const [noTexConvert, setNoTexConvert] = useState(() => localStorage.getItem('repkg-noTexConvert') === 'true');
  const [overwrite, setOverwrite] = useState(() => localStorage.getItem('repkg-overwrite') === 'true');
  const [debugInfo, setDebugInfo] = useState(() => localStorage.getItem('repkg-debugInfo') === 'true');
  const [recursive, setRecursive] = useState(() => {
    const saved = localStorage.getItem('repkg-recursive');
    return saved === null ? true : saved === 'true';
  });
  const [singleDir, setSingleDir] = useState(() => localStorage.getItem('repkg-singleDir') === 'true');
  const [skipErrors, setSkipErrors] = useState(() => {
    const saved = localStorage.getItem('repkg-skipErrors');
    return saved === null ? true : saved === 'true';
  });
  const [copyProject, setCopyProject] = useState(() => localStorage.getItem('repkg-copyProject') === 'true');
  const [justCopy, setJustCopy] = useState(() => localStorage.getItem('repkg-justCopy') === 'true');
  const [useName, setUseName] = useState(() => localStorage.getItem('repkg-useName') === 'true');
  const [showAdvanced, setShowAdvanced] = useState(() => localStorage.getItem('repkg-showAdvanced') === 'true');
  
  const stopRef = useRef(false);
  const [wallpapers, setWallpapers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isScanning, setIsScanning] = useState(false);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState(null);
  
  // Asset Modal state
  const [assetModal, setAssetModal] = useState(null); // { wp, assets }
  const [isSettingWallpaper, setIsSettingWallpaper] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  
  const { runCommand, stopCommand, output, isRunning, setOutput, setIsRunning } = useRepkg();

  // Sanitize folder name
  const sanitizePath = (name) => {
    return name.replace(/[\\/:*?"<>|]/g, '');
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, ratingFilter]);

  // Persist paths to localStorage
  useEffect(() => {
    localStorage.setItem('repkg-inputPath', inputPath);
  }, [inputPath]);

  useEffect(() => {
    localStorage.setItem('repkg-outputDir', outputDir);
  }, [outputDir]);

  useEffect(() => {
    localStorage.setItem('repkg-ignoreExts', ignoreExts);
  }, [ignoreExts]);

  useEffect(() => {
    localStorage.setItem('repkg-onlyExts', onlyExts);
  }, [onlyExts]);

  useEffect(() => {
    localStorage.setItem('repkg-convertTex', convertTex);
  }, [convertTex]);

  useEffect(() => {
    localStorage.setItem('repkg-noTexConvert', noTexConvert);
  }, [noTexConvert]);

  useEffect(() => {
    localStorage.setItem('repkg-overwrite', overwrite);
  }, [overwrite]);

  useEffect(() => {
    localStorage.setItem('repkg-debugInfo', debugInfo);
  }, [debugInfo]);

  useEffect(() => {
    localStorage.setItem('repkg-recursive', recursive);
  }, [recursive]);

  useEffect(() => {
    localStorage.setItem('repkg-singleDir', singleDir);
  }, [singleDir]);

  useEffect(() => {
    localStorage.setItem('repkg-skipErrors', skipErrors);
  }, [skipErrors]);

  useEffect(() => {
    localStorage.setItem('repkg-copyProject', copyProject);
  }, [copyProject]);

  useEffect(() => {
    localStorage.setItem('repkg-justCopy', justCopy);
  }, [justCopy]);

  useEffect(() => {
    localStorage.setItem('repkg-useName', useName);
  }, [useName]);

  useEffect(() => {
    localStorage.setItem('repkg-showAdvanced', showAdvanced);
  }, [showAdvanced]);

  // Filtered wallpapers
  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter(wp => {
      const matchesSearch = !searchTerm || 
        wp.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        wp.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || wp.type === typeFilter;
      const matchesRating = ratingFilter === 'all' || wp.contentrating === ratingFilter;
      
      return matchesSearch && matchesType && matchesRating;
    });
  }, [wallpapers, searchTerm, typeFilter, ratingFilter]);

  // Unique types and ratings for filters
  const types = useMemo(() => ['all', ...new Set(wallpapers.map(w => w.type))].sort(), [wallpapers]);
  const ratings = useMemo(() => ['all', ...new Set(wallpapers.map(w => w.contentrating))].sort(), [wallpapers]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredWallpapers.length / ITEMS_PER_PAGE);
  const pagedWallpapers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWallpapers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWallpapers, currentPage]);

  useEffect(() => {
    const scanPath = async () => {
      if (inputPath && window.electronAPI?.scanWallpapers) {
        setIsScanning(true);
        setWallpapers([]); // Clear current wallpapers
        setSelectedIds(new Set()); // Reset selection
        
        try {
          // Listen for incremental updates
          const handleNewWallpaper = (wallpaper) => {
            setWallpapers(prev => {
              // Avoid duplicates just in case
              if (prev.some(w => w.id === wallpaper.id)) return prev;
              return [...prev, wallpaper];
            });
          };
          
          window.electronAPI.onWallpaperFound(handleNewWallpaper);
          
          const results = await window.electronAPI.scanWallpapers(inputPath);
          
          // Cleanup listener
          window.electronAPI.removeWallpaperFoundListener();
          
          // Optionally set the final results to ensure consistency
          if (results && results.length > 0) {
            setWallpapers(results);
          }
        } catch (err) {
          console.error('扫描壁纸失败:', err);
          setWallpapers([]);
          window.electronAPI.removeWallpaperFoundListener();
        } finally {
          setIsScanning(false);
        }
      } else {
        setWallpapers([]);
      }
    };
    scanPath();
    
    return () => {
      if (window.electronAPI?.removeWallpaperFoundListener) {
        window.electronAPI.removeWallpaperFoundListener();
      }
    };
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
    if (selectedIds.size === filteredWallpapers.length && filteredWallpapers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWallpapers.map(w => w.id)));
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

  const handleContextMenu = (e, wp) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      wp
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleGlobalClick = () => closeContextMenu();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleOpenFolder = async (wp) => {
    if (window.electronAPI?.openPath) {
      await window.electronAPI.openPath(wp.path);
    }
    closeContextMenu();
  };

  const handleSetAsWallpaper = async (wp) => {
    closeContextMenu();
    
    if (!outputDir) {
      alert('请先选择输出目录，以便创建 cache 文件夹');
      return;
    }

    setIsSettingWallpaper(true);
    try {
      // 1. 获取并确保 cache 目录存在
      const cachePath = await window.electronAPI.getCacheDir(outputDir);
      const wpCachePath = `${cachePath}/${sanitizePath(wp.title || wp.name)}`;
      await window.electronAPI.ensureDir(wpCachePath);

      // 2. 解包到 cache 目录
      if (wp.isPkg) {
        // 优先使用具体的 pkgPath，如果没有则退而求其次使用 wp.path
        const inputPath = wp.pkgPath || wp.path;
        const args = ['extract', '-o', wpCachePath, '-t', '-r', '--overwrite', inputPath];
        const result = await window.electronAPI.runRepkg(args);
        if (result.code !== 0 && result.code !== -1) {
          throw new Error(`解包失败: ${result.stderr}`);
        }
      } else {
        await window.electronAPI.copyWallpaperAssets({
          srcPath: wp.path,
          destDir: wpCachePath
        });
      }

      // 3. 检索最大的 5 个资源
      const assets = await window.electronAPI.getLargestAssets(wpCachePath);
      
      if (assets.length === 0) {
        alert('未在解包目录中找到支持的视频或图片文件');
        return;
      }

      // 4. 弹出选择窗口
      setAssetModal({ wp, assets });
    } catch (err) {
      console.error('设置壁纸流程出错:', err);
      alert(`设置壁纸失败: ${err.message}`);
    } finally {
      setIsSettingWallpaper(false);
    }
  };

  const selectAssetAsWallpaper = async (asset) => {
    try {
      const result = await window.electronAPI.setWallpaper(asset.path);
      if (result.success) {
        alert('壁纸设置成功！');
        setAssetModal(null);
      } else {
        if (result.isVideo) {
          alert(`${result.error}\n文件路径: ${result.path}`);
        } else {
          alert(`设置失败: ${result.error}`);
        }
      }
    } catch (err) {
      alert(`设置壁纸出错: ${err.message}`);
    }
  };

  const handleStop = async () => {
    stopRef.current = true;
    await stopCommand();
  };

  const handleExtract = async () => {
    if (isRunning) {
      await handleStop();
      return;
    }

    if (!inputPath) {
      alert('请输入有效的输入路径');
      return;
    }

    if (justCopy && !outputDir) {
      alert('请先选择输出目录');
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
      setIsRunning(true);
      stopRef.current = false;
      setOutput(''); 
      
      for (const wp of selectedWallpapers) {
        // 检查是否请求了停止
        if (stopRef.current) break;

        const originalName = wp.title || wp.name;
        const displayName = sanitizePath(originalName);
        
        // 先添加一个“执行中”的状态
        setOutput(prev => prev + `${displayName} - ⏳ 正在提取...\n`);
        
        if (justCopy) {
          try {
            const result = await window.electronAPI.copyDirectory({
              srcPath: wp.path,
              destDir: outputDir,
              customName: displayName
            });
            
            setOutput(prev => {
              const lines = prev.trim().split('\n');
              const filtered = lines.filter(l => !l.startsWith(displayName));
              const status = result.success ? '✅ 提取成功' : `❌ 提取失败: ${result.error}`;
              return filtered.join('\n') + (filtered.length > 0 ? '\n' : '') + `${displayName} - ${status}\n`;
            });
          } catch (err) {
            setOutput(prev => {
              const lines = prev.trim().split('\n');
              const filtered = lines.filter(l => !l.startsWith(displayName));
              return filtered.join('\n') + (filtered.length > 0 ? '\n' : '') + `${displayName} - ❌ 提取错误: ${err.message}\n`;
            });
          }
        } else if (wp.isPkg) {
          const targetDir = outputDir ? (singleDir ? outputDir : `${outputDir}/${displayName}`) : `${wp.path}/extracted`;
          const currentArgs = [...commonArgs];
          
          if (!singleDir) {
            const oIndex = currentArgs.indexOf('-o');
            if (oIndex !== -1) {
              currentArgs[oIndex + 1] = targetDir;
            } else {
              currentArgs.push('-o', targetDir);
            }
          }
          
          try {
            const result = await window.electronAPI.runRepkg([...currentArgs, wp.path]);
            setOutput(prev => {
              const lines = prev.trim().split('\n');
              const filtered = lines.filter(l => !l.startsWith(displayName));
              const status = result.code === 0 ? '✅ 提取成功' : (result.code === -1 ? '⏹️ 已停止' : `❌ 提取失败 (代码 ${result.code})`);
              return filtered.join('\n') + (filtered.length > 0 ? '\n' : '') + `${displayName} - ${status}\n`;
            });
            if (result.code === -1) break; // 停止循环
          } catch (err) {
            setOutput(prev => {
              const lines = prev.trim().split('\n');
              const filtered = lines.filter(l => !l.startsWith(displayName));
              return filtered.join('\n') + (filtered.length > 0 ? '\n' : '') + `${displayName} - ❌ 提取错误: ${err.message}\n`;
            });
          }
        } else {
          const targetDir = outputDir ? (singleDir ? outputDir : `${outputDir}/${displayName}`) : `${wp.path}/extracted`;
          
          try {
            const result = await window.electronAPI.copyWallpaperAssets({
              srcPath: wp.path,
              destDir: targetDir
            });
            
            setOutput(prev => {
              const lines = prev.trim().split('\n');
              const filtered = lines.filter(l => !l.startsWith(displayName));
              const status = result.success ? '✅ 提取成功' : `❌ 提取失败: ${result.error}`;
              return filtered.join('\n') + (filtered.length > 0 ? '\n' : '') + `${displayName} - ${status}\n`;
            });
          } catch (err) {
            setOutput(prev => {
              const lines = prev.trim().split('\n');
              const filtered = lines.filter(l => !l.startsWith(displayName));
              return filtered.join('\n') + (filtered.length > 0 ? '\n' : '') + `${displayName} - ❌ 提取错误: ${err.message}\n`;
            });
          }
        }
      }
      setIsRunning(false);
      stopRef.current = false;
    } else {
      await runCommand([...commonArgs, inputPath]);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <div className={`grid grid-cols-1 ${wallpapers.length > 0 ? 'lg:grid-cols-3' : ''} gap-6 h-full overflow-hidden`}>
        {/* Left Side: Wallpaper Gallery */}
        {wallpapers.length > 0 && (
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="card h-full flex flex-col overflow-hidden">
              <div className="flex flex-col gap-4 mb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary-600" />
                    壁纸预览 ({filteredWallpapers.length}/{wallpapers.length})
                  </h2>
                  <button 
                    onClick={selectAll}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {selectedIds.size === filteredWallpapers.length && filteredWallpapers.length > 0 ? '取消全选' : '全选过滤项'}
                  </button>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative col-span-1 sm:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索标题或描述..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-9 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="input-field py-1.5 text-sm"
                    >
                      <option value="all">所有类型</option>
                      {types.filter(t => t !== 'all').map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="input-field py-1.5 text-sm"
                    >
                      <option value="all">所有分级</option>
                      {ratings.filter(r => r !== 'all').map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pagedWallpapers.map((wp) => (
                    <div 
                      key={wp.id}
                      onClick={() => toggleSelect(wp.id)}
                      onContextMenu={(e) => handleContextMenu(e, wp)}
                      className={`
                        relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all animate-fade-in
                        ${selectedIds.has(wp.id) 
                          ? 'border-primary-500 ring-2 ring-primary-200' 
                          : 'border-transparent hover:border-slate-300'
                        }
                      `}
                    >
                      <img 
                        src={wp.preview} 
                        alt={wp.title}
                        loading="lazy"
                        className="w-full aspect-square object-cover bg-slate-100"
                      />
                      
                      {/* Badge for Type/Rating */}
                      <div className="absolute top-0 left-0 flex flex-col gap-1 p-1">
                        <div className="bg-black/50 backdrop-blur-sm text-white text-[9px] px-1 py-0.5 rounded uppercase font-bold">
                          {wp.type}
                        </div>
                        {wp.contentrating !== 'Everyone' && (
                          <div className={`text-white text-[9px] px-1 py-0.5 rounded font-bold ${
                            wp.contentrating === 'Mature' ? 'bg-red-500' : 'bg-amber-500'
                          }`}>
                            {wp.contentrating}
                          </div>
                        )}
                      </div>

                      {/* Non-PKG Badge */}
                      {!wp.isPkg && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold shadow-sm">
                          非PKG
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-xs text-white truncate font-medium" title={wp.title}>
                          {wp.title}
                        </p>
                        {wp.description && (
                          <p className="text-[10px] text-slate-300 truncate" title={wp.description}>
                            {wp.description}
                          </p>
                        )}
                      </div>
                      {selectedIds.has(wp.id) && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-lg z-10">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {filteredWallpapers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Search className="w-12 h-12 mb-2 opacity-20" />
                    <p>没有找到符合条件的壁纸</p>
                  </div>
                )}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <div className="text-sm text-slate-500">
                    第 {currentPage} / {totalPages} 页 (共 {filteredWallpapers.length} 个项目)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              
              {selectedIds.size > 0 && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg flex items-center justify-between shrink-0">
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
        <div className={`${wallpapers.length > 0 ? 'lg:col-span-1' : ''} flex flex-col min-h-0`}>
          <div className="card h-full flex flex-col overflow-hidden">
            <h2 className="text-xl font-semibold mb-4 shrink-0">提取设置</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Input Path */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  输入路径，建议输入壁纸根目录
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
                    <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
                      <input
                        type="checkbox"
                        checked={justCopy}
                        onChange={(e) => setJustCopy(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm">仅原样复制文件夹 (不解包)</span>
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
              </div>
            </div>

            {/* Execute Button */}
            <div className="pt-4 shrink-0 border-t border-slate-100 mt-4">
              <button
                onClick={handleExtract}
                disabled={(!isRunning && selectedIds.size === 0) || (!isRunning && !inputPath)}
                className={`flex items-center gap-2 w-full justify-center py-3 shadow-md rounded-lg font-medium transition-all ${
                  isRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'btn-primary'
                }`}
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    停止提取
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    {selectedIds.size > 0 
                      ? (justCopy ? `复制选中项 (${selectedIds.size})` : `解包选中项 (${selectedIds.size})`) 
                      : (justCopy ? '开始执行复制' : '开始执行提取')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Output Log - Simplified */}
      {output && (
        <div className="card shrink-0">
          <h3 className="text-lg font-medium mb-4 flex items-center justify-between">
            <span>提取进度</span>
            <button 
              onClick={() => setOutput('')}
              className="text-xs text-slate-400 hover:text-slate-600 font-normal"
            >
              清除列表
            </button>
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-40 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-2">
              {output.trim().split('\n').map((line, idx) => {
                const isSuccess = line.includes('✅');
                const isPending = line.includes('⏳');
                const isStopped = line.includes('⏹️');
                const parts = line.split(' - ');
                const name = parts[0];
                const status = parts[1] || '';
                return (
                  <div key={idx} className={`flex items-center justify-between p-2 rounded-md border ${
                    isSuccess ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                    isPending ? 'bg-amber-50 border-amber-100 text-amber-800' :
                    isStopped ? 'bg-slate-100 border-slate-200 text-slate-600' :
                    'bg-red-50 border-red-100 text-red-800'
                  }`}>
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs font-bold">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onOpenFolder={() => handleOpenFolder(contextMenu.wp)}
          onSetAsWallpaper={() => handleSetAsWallpaper(contextMenu.wp)}
        />
      )}

      {/* Asset Selection Modal */}
      {assetModal && (
        <AssetModal 
          wp={assetModal.wp} 
          assets={assetModal.assets} 
          onClose={() => setAssetModal(null)}
          onSelect={selectAssetAsWallpaper}
        />
      )}

      {/* Loading Overlay for Wallpaper Setting */}
      {isSettingWallpaper && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            <p className="text-sm font-medium text-slate-700">正在准备壁纸资源...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ContextMenu({ x, y, onOpenFolder, onSetAsWallpaper }) {
  return (
    <div 
      className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-lg py-1 min-w-[160px] animate-in fade-in zoom-in duration-100"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onOpenFolder}
        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2"
      >
        <FolderOpen className="w-4 h-4" />
        打开壁纸文件夹
      </button>
      <button 
        onClick={onSetAsWallpaper}
        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2"
      >
        <Monitor className="w-4 h-4" />
        设置为桌面壁纸
      </button>
    </div>
  );
}

function AssetModal({ wp, assets, onClose, onSelect }) {
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetUrl = (path) => {
    // 确保路径前缀正确，不产生多余的斜杠
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `repkg-thumb://local${normalizedPath}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900">选择壁纸文件</h3>
            <p className="text-sm text-slate-500 mt-1">从解包的文件中选择一个（按大小排序的前5个）</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-6">
            {assets.map((asset, idx) => (
              <div 
                key={idx}
                className="group flex flex-col md:flex-row gap-6 p-4 border border-slate-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-all"
              >
                {/* Preview Section */}
                <div className="w-full md:w-64 aspect-video bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                  {asset.ext === '.mp4' ? (
                    <video 
                      src={getAssetUrl(asset.path)}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      onMouseOver={e => {
                        const playPromise = e.target.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(error => {
                            console.log("视频播放被拦截或失败:", error);
                          });
                        }
                      }}
                      onMouseOut={e => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                      loop
                    />
                  ) : (
                    <img 
                      src={getAssetUrl(asset.path)}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info Section */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <p className="text-lg font-bold text-slate-900 truncate" title={asset.name}>{asset.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                      {asset.ext.slice(1)}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">{formatSize(asset.size)}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    {asset.ext === '.mp4' ? (
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" /> 鼠标悬停预览视频
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> 高清图像资源
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Section */}
                <div className="flex items-center shrink-0">
                  <button 
                    onClick={() => onSelect(asset)}
                    className="w-full md:w-auto btn-primary py-3 px-8 shadow-lg shadow-primary-200"
                  >
                    应用为壁纸
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <p className="text-xs text-slate-400 italic">缓存文件夹将在退出软件时自动清除</p>
        </div>
      </div>
    </div>
  );
}

export default ExtractView;
