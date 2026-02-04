import { useState, useEffect, useMemo, useRef } from 'react';
import { FolderOpen, File, Play, Settings, ChevronDown, Check, Image as ImageIcon, Search, Filter, ChevronLeft, ChevronRight, X, Monitor, Heart, Bookmark, Plus, Trash2 } from 'lucide-react';
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
  const [assetModal, setAssetModal] = useState(null); 
  const [isSettingWallpaper, setIsSettingWallpaper] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Collection Modal state
  const [collectionModal, setCollectionModal] = useState({ show: false, ids: [] });

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  
  const { runCommand, stopCommand, output, isRunning, setOutput, setIsRunning } = useRepkg();

  const sanitizePath = (name) => {
    return name.replace(/[\\/:*?"<>|]/g, '');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, ratingFilter, collectionFilter, wallpapers.length]);

  useEffect(() => {
    localStorage.setItem('repkg-inputPath', inputPath);
    localStorage.setItem('repkg-outputDir', outputDir);
    localStorage.setItem('repkg-ignoreExts', ignoreExts);
    localStorage.setItem('repkg-onlyExts', onlyExts);
    localStorage.setItem('repkg-convertTex', convertTex);
    localStorage.setItem('repkg-noTexConvert', noTexConvert);
    localStorage.setItem('repkg-overwrite', overwrite);
    localStorage.setItem('repkg-debugInfo', debugInfo);
    localStorage.setItem('repkg-recursive', recursive);
    localStorage.setItem('repkg-singleDir', singleDir);
    localStorage.setItem('repkg-skipErrors', skipErrors);
    localStorage.setItem('repkg-copyProject', copyProject);
    localStorage.setItem('repkg-justCopy', justCopy);
    localStorage.setItem('repkg-useName', useName);
    localStorage.setItem('repkg-showAdvanced', showAdvanced);
    localStorage.setItem('repkg-collectionFilter', collectionFilter);
  }, [inputPath, outputDir, ignoreExts, onlyExts, convertTex, noTexConvert, overwrite, debugInfo, recursive, singleDir, skipErrors, copyProject, justCopy, useName, showAdvanced, collectionFilter]);

  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter(wp => {
      const matchesSearch = !searchTerm || 
        wp.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        wp.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || wp.type === typeFilter;
      const matchesRating = ratingFilter === 'all' || wp.contentrating === ratingFilter;
      const matchesCollection = collectionFilter === 'all' || (wp.collections && wp.collections.includes(collectionFilter));
      return matchesSearch && matchesType && matchesRating && matchesCollection;
    });
  }, [wallpapers, searchTerm, typeFilter, ratingFilter, collectionFilter]);

  const types = useMemo(() => ['all', ...new Set(wallpapers.map(w => w.type))].sort(), [wallpapers]);
  const ratings = useMemo(() => ['all', ...new Set(wallpapers.map(w => w.contentrating))].sort(), [wallpapers]);
  const allCollections = useMemo(() => {
    const collections = new Set();
    wallpapers.forEach(wp => {
      if (wp.collections) {
        wp.collections.forEach(c => collections.add(c));
      }
    });
    return ['all', ...Array.from(collections).sort()];
  }, [wallpapers]);

  const totalPages = Math.ceil(filteredWallpapers.length / ITEMS_PER_PAGE);
  const pagedWallpapers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWallpapers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWallpapers, currentPage]);

  useEffect(() => {
    const scanPath = async () => {
      if (inputPath && window.electronAPI?.scanWallpapers) {
        setIsScanning(true);
        setWallpapers([]);
        setSelectedIds(new Set());
        
        try {
          const handleNewWallpaper = (wallpaper) => {
            setWallpapers(prev => {
              if (prev.some(w => w.id === wallpaper.id)) return prev;
              return [...prev, wallpaper];
            });
          };
          window.electronAPI.onWallpaperFound(handleNewWallpaper);
          const results = await window.electronAPI.scanWallpapers(inputPath);
          window.electronAPI.removeWallpaperFoundListener();
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
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
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
    const path = await window.electronAPI.selectFile();
    if (path) setInputPath(path);
  };

  const handleSelectFolder = async () => {
    const path = await window.electronAPI.selectFolder();
    if (path) setInputPath(path);
  };

  const handleSelectOutput = async () => {
    const path = await window.electronAPI.selectFolder();
    if (path) setOutputDir(path);
  };

  const handleUpdateCollections = async (wallpaperIds, collectionName, action) => {
    const selectedWallpapers = wallpapers.filter(w => wallpaperIds.includes(w.id));
    const paths = selectedWallpapers.map(w => w.path);
    
    try {
      const results = await window.electronAPI.updateWallpaperCollections({
        wallpaperPaths: paths,
        collectionName,
        action
      });

      // Update local state
      setWallpapers(prev => prev.map(wp => {
        const res = results.find(r => r.path === wp.path);
        if (res && res.success) {
          return { ...wp, collections: res.collections };
        }
        return wp;
      }));
    } catch (err) {
      console.error('更新收藏夹失败:', err);
      alert('操作失败: ' + err.message);
    }
  };

  const handleDeleteCollection = async (collectionName) => {
    if (!collectionName || collectionName === 'all') return;
    if (!confirm(`确定要删除收藏夹 "${collectionName}" 吗？这不会删除壁纸文件。`)) return;

    try {
      const result = await window.electronAPI.deleteCollection({
        rootPath: inputPath,
        collectionName
      });

      if (result.success) {
        // Update local state for all wallpapers
        setWallpapers(prev => prev.map(wp => ({
          ...wp,
          collections: (wp.collections || []).filter(c => c !== collectionName)
        })));
        if (collectionFilter === collectionName) {
          setCollectionFilter('all');
        }
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (err) {
      console.error('删除收藏夹失败:', err);
      alert('操作失败: ' + err.message);
    }
  };

  const handleContextMenu = (e, wp) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, wp });
  };

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleOpenFolder = async (wp) => {
    if (window.electronAPI?.openPath) {
      await window.electronAPI.openPath(wp.path);
    }
  };

  const handleSetAsWallpaper = async (wp) => {
    if (!outputDir) {
      alert('请先选择输出目录，以便创建 cache 文件夹');
      return;
    }
    setIsSettingWallpaper(true);
    try {
      const cachePath = await window.electronAPI.getCacheDir(outputDir);
      const wpCachePath = `${cachePath}/${sanitizePath(wp.title || wp.name)}`;
      await window.electronAPI.ensureDir(wpCachePath);

      if (wp.isPkg) {
        const inputPath = wp.pkgPath || wp.path;
        const args = ['extract', '-o', wpCachePath, '-t', '-r', '--overwrite', inputPath];
        const result = await window.electronAPI.runRepkg(args);
        if (result.code !== 0 && result.code !== -1) {
          throw new Error(`解包失败: ${result.stderr}`);
        }
      } else {
        await window.electronAPI.copyWallpaperAssets({ srcPath: wp.path, destDir: wpCachePath });
      }

      const assets = await window.electronAPI.getLargestAssets(wpCachePath);
      if (assets.length === 0) {
        alert('未在解包目录中找到支持的视频或图片文件');
        return;
      }
      setAssetModal({ wp, assets });
    } catch (err) {
      console.error('设置壁纸流程出错:', err);
      alert(`设置壁纸失败: ${err.message}`);
    } finally {
      setIsSettingWallpaper(false);
    }
  };

  const selectAssetAsWallpaper = async (asset, options = {}) => {
    try {
      const result = await window.electronAPI.setWallpaper(asset.path, options);
      if (result.success) {
        alert('壁纸设置成功！');
        setAssetModal(null);
      } else {
        alert(`设置失败: ${result.error}`);
      }
    } catch (err) {
      alert(`设置壁纸出错: ${err.message}`);
    }
  };

  const handleExtract = async () => {
    if (isRunning) {
      stopRef.current = true;
      await stopCommand();
      return;
    }
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
      setIsRunning(true);
      stopRef.current = false;
      setOutput(''); 
      for (const wp of selectedWallpapers) {
        if (stopRef.current) break;
        const displayName = sanitizePath(wp.title || wp.name);
        setOutput(prev => prev + `${displayName} - ⏳ 正在提取...\n`);
        if (justCopy) {
          const result = await window.electronAPI.copyDirectory({ srcPath: wp.path, destDir: outputDir, customName: displayName });
          setOutput(prev => prev.replace(`${displayName} - ⏳ 正在提取...\n`, `${displayName} - ${result.success ? '✅ 提取成功' : '❌ 失败'}\n`));
        } else if (wp.isPkg) {
          const targetDir = outputDir ? (singleDir ? outputDir : `${outputDir}/${displayName}`) : `${wp.path}/extracted`;
          const currentArgs = [...commonArgs];
          const oIdx = currentArgs.indexOf('-o');
          if (!singleDir) {
            if (oIdx !== -1) currentArgs[oIdx + 1] = targetDir;
            else currentArgs.push('-o', targetDir);
          }
          const result = await window.electronAPI.runRepkg([...currentArgs, wp.path]);
          setOutput(prev => prev.replace(`${displayName} - ⏳ 正在提取...\n`, `${displayName} - ${result.code === 0 ? '✅ 提取成功' : '❌ 失败'}\n`));
        }
      }
      setIsRunning(false);
    } else {
      await runCommand([...commonArgs, inputPath]);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full w-full overflow-hidden">
      <div className={`grid grid-cols-1 ${wallpapers.length > 0 ? 'lg:grid-cols-4' : ''} gap-4 h-full w-full min-h-0`}>
        {/* Left Side: Wallpaper Gallery - Expanded to col-span-3 for more space */}
        {wallpapers.length > 0 && (
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="card h-full flex flex-col overflow-hidden">
              <div className="flex flex-col gap-3 mb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary-600" />
                    壁纸预览 ({filteredWallpapers.length})
                  </h2>
                  <button onClick={selectAll} className="text-xs font-bold text-primary-600 hover:text-primary-700">
                    {selectedIds.size === filteredWallpapers.length && filteredWallpapers.length > 0 ? '取消全选' : '全选过滤项'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="text" placeholder="搜索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-9 py-1 text-xs" />
                  </div>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field py-1 text-xs">
                    <option value="all">所有类型</option>
                    {types.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="input-field py-1 text-xs">
                    <option value="all">所有分级</option>
                    {ratings.filter(r => r !== 'all').map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="flex gap-1">
                    <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="input-field py-1 text-xs flex-1">
                      <option value="all">所有收藏夹</option>
                      {allCollections.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {collectionFilter !== 'all' && (
                      <button onClick={() => handleDeleteCollection(collectionFilter)} title="删除当前收藏夹" className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar relative">
                {selectedIds.size > 0 && (
                  <div className="sticky top-0 z-20 bg-primary-600 text-white p-2 mb-3 rounded-lg flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold">已选择 {selectedIds.size} 项</span>
                      <div className="h-4 w-px bg-white/30" />
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => {
                          setCollectionModal({ show: true, ids: Array.from(selectedIds) });
                        }} className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">
                          <Plus className="w-3 h-3" /> 新建收藏
                        </button>
                        {allCollections.filter(c => c !== 'all').length > 0 && (
                          <div className="relative group/menu">
                            <button className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">
                              <Bookmark className="w-3 h-3" /> 加入收藏 <ChevronDown className="w-3 h-3" />
                            </button>
                            <div className="absolute top-full left-0 mt-1 hidden group-hover/menu:block bg-white border border-slate-200 shadow-xl rounded-lg py-1 min-w-[120px] text-slate-700">
                              {allCollections.filter(c => c !== 'all').map(c => (
                                <button key={c} onClick={() => handleUpdateCollections(Array.from(selectedIds), c, 'add')} className="w-full text-left px-3 py-1.5 text-[10px] hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2">
                                  <Bookmark className="w-3 h-3" /> {c}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {collectionFilter !== 'all' && (
                          <button onClick={() => handleUpdateCollections(Array.from(selectedIds), collectionFilter, 'remove')} className="flex items-center gap-1 text-[10px] bg-red-500/80 hover:bg-red-500 px-2 py-1 rounded transition-colors">
                            <X className="w-3 h-3" /> 移出收藏
                          </button>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-white/20 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                  {pagedWallpapers.map((wp) => (
                    <div key={wp.id} onClick={() => toggleSelect(wp.id)} onContextMenu={(e) => handleContextMenu(e, wp)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedIds.has(wp.id) ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent hover:border-slate-300'}`}>
                      <img src={wp.preview} alt={wp.title} loading="lazy" className="w-full aspect-square object-cover bg-slate-50" />
                      <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                        <div className="bg-black/40 backdrop-blur-sm text-white text-[8px] px-1 py-0.5 rounded uppercase font-bold">{wp.type}</div>
                        {wp.collections && wp.collections.length > 0 && (
                          <div className="bg-primary-600/80 backdrop-blur-sm text-white text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5 font-bold">
                            <Heart className="w-2 h-2 fill-white" /> {wp.collections.length}
                          </div>
                        )}
                      </div>
                      {!wp.isPkg && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] px-1 py-0.5 rounded-bl-md font-bold">非PKG</div>}
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1.5 transform translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-[10px] text-white truncate font-medium">{wp.title}</p>
                      </div>
                      {selectedIds.has(wp.id) && <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center shadow-lg z-10"><Check className="w-3 h-3 text-white" /></div>}
                    </div>
                  ))}
                </div>
              </div>
              
              {totalPages > 1 && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between shrink-0">
                  <div className="text-[10px] text-slate-400">第 {currentPage}/{totalPages} 页</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded border border-slate-100 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded border border-slate-100 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Side: Settings */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <div className="card h-full flex flex-col overflow-hidden">
            <h2 className="text-base font-bold mb-3 shrink-0">提取设置</h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">输入路径</label>
                <input type="text" value={inputPath} onChange={(e) => setInputPath(e.target.value)} placeholder="PKG目录" className="input-field w-full py-1.5 text-xs mb-2" />
                <div className="flex gap-2">
                  <button onClick={handleSelectFile} className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1"><File className="w-3.5 h-3.5" />文件</button>
                  <button onClick={handleSelectFolder} className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1"><FolderOpen className="w-3.5 h-3.5" />目录</button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" />输出设置</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">输出目录</label>
                      <div className="flex gap-1.5">
                        <input type="text" value={outputDir} onChange={(e) => setOutputDir(e.target.value)} className="input-field flex-1 py-1.5 text-xs" />
                        <button onClick={handleSelectOutput} className="btn-secondary py-1 text-xs px-2">选择</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">忽略扩展名</label>
                      <input type="text" value={ignoreExts} onChange={(e) => setIgnoreExts(e.target.value)} className="input-field py-1.5 text-xs" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50">
                  <h3 className="text-xs font-bold text-slate-700 mb-2">选项</h3>
                  <div className="space-y-1.5">
                    {[
                      { label: 'TEX 转图像', state: convertTex, set: setConvertTex },
                      { label: '覆盖现有文件', state: overwrite, set: setOverwrite },
                      { label: '仅原样复制', state: justCopy, set: setJustCopy }
                    ].map(opt => (
                      <label key={opt.label} className="flex items-center gap-2 cursor-pointer py-0.5">
                        <input type="checkbox" checked={opt.state} onChange={e => opt.set(e.target.checked)} className="w-3.5 h-3.5 text-primary-600 rounded" />
                        <span className="text-xs text-slate-600">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /> 高级选项
                  </button>
                  {showAdvanced && (
                    <div className="mt-2 space-y-1.5 p-2 bg-slate-50 rounded-md">
                      {[
                        { label: '递归搜索 (-r)', state: recursive, set: setRecursive },
                        { label: '单一目录 (-s)', state: singleDir, set: setSingleDir },
                        { label: '使用项目名称 (-n)', state: useName, set: setUseName }
                      ].map(opt => (
                        <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={opt.state} onChange={e => opt.set(e.target.checked)} className="w-3 h-3 text-primary-600 rounded" />
                          <span className="text-[10px] text-slate-500">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 shrink-0 border-t border-slate-100 mt-3">
              <button onClick={handleExtract} disabled={(!isRunning && selectedIds.size === 0 && !inputPath)}
                className={`flex items-center gap-2 w-full justify-center py-2.5 shadow-sm rounded-lg text-sm font-bold transition-all ${isRunning ? 'bg-red-500 text-white' : 'btn-primary'}`}>
                {isRunning ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />停止</> : <><Play className="w-4 h-4" />{selectedIds.size > 0 ? `解包 (${selectedIds.size})` : '执行'}</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {output && (
        <div className="card shrink-0 py-2 px-4 border-t-4 border-primary-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">提取进度</span>
            <button onClick={() => setOutput('')} className="text-[10px] text-slate-400 hover:text-slate-600">清除</button>
          </div>
          <div className="max-h-24 overflow-y-auto custom-scrollbar text-[10px] space-y-1">
            {output.trim().split('\n').map((line, idx) => {
              const isSuccess = line.includes('✅');
              const parts = line.split(' - ');
              return (
                <div key={idx} className={`flex items-center justify-between p-1.5 rounded ${isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
                  <span className="truncate flex-1">{parts[0]}</span>
                  <span className="font-bold shrink-0 ml-2">{parts[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} wp={contextMenu.wp} allCollections={allCollections} onOpenFolder={() => handleOpenFolder(contextMenu.wp)} onSetAsWallpaper={() => handleSetAsWallpaper(contextMenu.wp)} onUpdateCollections={handleUpdateCollections} onOpenNewCollection={() => setCollectionModal({ show: true, ids: [contextMenu.wp.id] })} />}
      {assetModal && <AssetModal wp={assetModal.wp} assets={assetModal.assets} onClose={() => setAssetModal(null)} onSelect={selectAssetAsWallpaper} />}
      {collectionModal.show && (
        <NewCollectionModal 
          onClose={() => setCollectionModal({ show: false, ids: [] })} 
          onConfirm={(name) => {
            handleUpdateCollections(collectionModal.ids, name, 'add');
            setCollectionModal({ show: false, ids: [] });
          }} 
        />
      )}
      {isSettingWallpaper && <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex items-center justify-center"><div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div><p className="text-sm font-medium text-slate-700">正在准备壁纸资源...</p></div></div>}
    </div>
  );
}

function ContextMenu({ x, y, wp, allCollections, onOpenFolder, onSetAsWallpaper, onUpdateCollections, onOpenNewCollection }) {
  const [showCollections, setShowCollections] = useState(false);
  
  return (
    <div className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-lg py-1 min-w-[180px] animate-in fade-in zoom-in duration-100" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
      <button onClick={onOpenFolder} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2"><FolderOpen className="w-4 h-4" />打开壁纸文件夹</button>
      <button onClick={onSetAsWallpaper} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2"><Monitor className="w-4 h-4" />设置为桌面壁纸</button>
      
      <div className="h-px bg-slate-100 my-1" />
      
      <div className="relative">
        <button 
          onMouseEnter={() => setShowCollections(true)}
          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2"><Bookmark className="w-4 h-4" />加入收藏夹</div>
          <ChevronRight className="w-3 h-3" />
        </button>
        
        {showCollections && (
          <div 
            className="absolute left-full top-0 ml-0.5 bg-white border border-slate-200 shadow-xl rounded-lg py-1 min-w-[160px]"
            onMouseLeave={() => setShowCollections(false)}
          >
            <button 
              onClick={onOpenNewCollection}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 新建收藏夹...
            </button>
            
            {allCollections.filter(c => c !== 'all').length > 0 && <div className="h-px bg-slate-100 my-1" />}
            
            {allCollections.filter(c => c !== 'all').map(c => {
              const isInCollection = wp.collections && wp.collections.includes(c);
              return (
                <button 
                  key={c}
                  onClick={() => onUpdateCollections([wp.id], c, isInCollection ? 'remove' : 'add')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className={`w-4 h-4 ${isInCollection ? 'fill-primary-500 text-primary-500' : ''}`} />
                    {c}
                  </div>
                  {isInCollection && <Check className="w-3 h-3 text-primary-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetModal({ wp, assets, onClose, onSelect }) {
  const [isMuted, setIsMuted] = useState(true);
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const getAssetUrl = (path) => {
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
            <p className="text-sm text-slate-500 mt-1">从解包的文件中选择一个</p>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isMuted} 
                onChange={(e) => setIsMuted(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" 
              />
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">静音播放视频</span>
            </label>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-6">
            {assets.map((asset, idx) => (
              <div key={idx} className="group flex flex-col md:flex-row gap-6 p-4 border border-slate-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-all">
                <div className="w-full md:w-64 aspect-video bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                  {asset.ext === '.mp4' ? <video src={getAssetUrl(asset.path)} className="w-full h-full object-cover" muted preload="metadata" onMouseOver={e => e.target.play()} onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }} loop /> : <img src={getAssetUrl(asset.path)} alt={asset.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <p className="text-lg font-bold text-slate-900 truncate">{asset.name}</p>
                  <div className="flex items-center gap-3 mt-2"><span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{asset.ext.slice(1)}</span><span className="text-sm text-slate-500 font-medium">{formatSize(asset.size)}</span></div>
                </div>
                <div className="flex items-center shrink-0"><button onClick={() => onSelect(asset, { isMuted })} className="w-full md:w-auto btn-primary py-3 px-8 shadow-lg">应用为壁纸</button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0"><p className="text-xs text-slate-400 italic">缓存文件夹将在退出软件时自动清除</p></div>
      </div>
    </div>
  );
}

function NewCollectionModal({ onClose, onConfirm }) {
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">新建收藏夹</h3>
          <input 
            autoFocus
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="收藏夹名称..." 
            className="input-field mb-6"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2">取消</button>
            <button type="submit" disabled={!name.trim()} className="btn-primary flex-1 py-2">确定</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExtractView;
