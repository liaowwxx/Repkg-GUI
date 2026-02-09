import { useState, useEffect, useMemo, useRef } from 'react';
import { FolderOpen, File, Play, Settings, ChevronDown, Check, Image as ImageIcon, Search, Filter, ChevronLeft, ChevronRight, X, Monitor, Heart, Bookmark, Plus, Trash2 } from 'lucide-react';
import { useRepkg } from '../hooks/useRepkg';
import { translations } from '../utils/i18n';

const ITEMS_PER_PAGE = 32;

function ExtractView({ lang }) {
  const t = translations[lang];
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
  const [taggerModelPath, setTaggerModelPath] = useState(() => localStorage.getItem('repkg-taggerModelPath') || '');
  const [isTaggerRunning, setIsTaggerRunning] = useState(false);
  const [taggerProgress, setTaggerProgress] = useState('');
  
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
  const [searchText, setSearchText] = useState('');       // 标题/描述搜索
  const [searchTags, setSearchTags] = useState('');       // 标签搜索（逗号分隔）
  const [typeFilter, setTypeFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [allTagNames, setAllTagNames] = useState([]);
  const [tagSuggestionsOpen, setTagSuggestionsOpen] = useState(false);
  const [tagSuggestionIndex, setTagSuggestionIndex] = useState(0);
  const searchInputRef = useRef(null);
  const tagSuggestionsRef = useRef(null);
  
  const { runCommand, stopCommand, output, isRunning, setOutput, setIsRunning } = useRepkg();

  // 从模型目录加载标签列表（用于搜索待选）
  useEffect(() => {
    if (!taggerModelPath?.trim() || !window.electronAPI?.getTaggerTags) {
      setAllTagNames([]);
      return;
    }
    let cancelled = false;
    window.electronAPI.getTaggerTags(taggerModelPath.trim()).then((names) => {
      if (!cancelled && Array.isArray(names)) setAllTagNames(names);
    });
    return () => { cancelled = true; };
  }, [taggerModelPath]);

  const sanitizePath = (name) => {
    return name.replace(/[\\/:*?"<>|]/g, '');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, searchTags, typeFilter, ratingFilter, collectionFilter, wallpapers.length]);

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
    localStorage.setItem('repkg-taggerModelPath', taggerModelPath);
  }, [inputPath, outputDir, ignoreExts, onlyExts, convertTex, noTexConvert, overwrite, debugInfo, recursive, singleDir, skipErrors, copyProject, justCopy, useName, showAdvanced, collectionFilter, taggerModelPath]);

  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter(wp => {
      const text = searchText?.trim() || '';
      const tagList = Array.isArray(wp.preview_tagger) ? wp.preview_tagger : (typeof wp.preview_tagger === 'string' ? wp.preview_tagger.split(',').map(s => s.trim()).filter(Boolean) : []);
      const wpTagSet = new Set(tagList.map(t => t.toLowerCase()));
      const matchesText = !text ||
        wp.title?.toLowerCase().includes(text.toLowerCase()) ||
        wp.description?.toLowerCase().includes(text.toLowerCase());
      const tagsRaw = searchTags?.trim() || '';
      const requiredTags = tagsRaw ? tagsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
      const matchesTags = requiredTags.length === 0 || requiredTags.every(tag => wpTagSet.has(tag.toLowerCase()));
      const matchesType = typeFilter === 'all' || wp.type === typeFilter;
      const matchesRating = ratingFilter === 'all' || wp.contentrating === ratingFilter;
      const matchesCollection = collectionFilter === 'all' || (wp.collections && wp.collections.includes(collectionFilter));
      return matchesText && matchesTags && matchesType && matchesRating && matchesCollection;
    });
  }, [wallpapers, searchText, searchTags, typeFilter, ratingFilter, collectionFilter]);

  // 当前输入“段”（最后一个逗号后的部分），用于待选匹配
  const searchTagToken = useMemo(() => {
    const parts = (searchTags || '').split(',');
    return (parts[parts.length - 1] || '').trim();
  }, [searchTags]);

  // 待选标签：以当前 token 开头的标签，最多 20 条
  const tagSuggestions = useMemo(() => {
    if (!searchTagToken || allTagNames.length === 0) return [];
    const lower = searchTagToken.toLowerCase();
    return allTagNames.filter(tag => tag.toLowerCase().startsWith(lower)).slice(0, 20);
  }, [allTagNames, searchTagToken]);

  const applyTagSuggestion = (tag) => {
    const parts = (searchTags || '').split(',');
    parts[parts.length - 1] = tag;
    const joined = parts.map(p => p.trim()).filter(Boolean).join(', ');
    setSearchTags(joined ? joined + ', ' : tag + ', ');
    setTagSuggestionsOpen(false);
    setTagSuggestionIndex(0);
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e) => {
    if (!tagSuggestionsOpen || tagSuggestions.length === 0) {
      if (e.key === 'Escape') setTagSuggestionsOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTagSuggestionIndex(i => Math.min(i + 1, tagSuggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setTagSuggestionIndex(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const sel = tagSuggestions[tagSuggestionIndex];
      if (sel) applyTagSuggestion(sel);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setTagSuggestionsOpen(false);
    }
  };

  // 标签输入变化时：有匹配则打开待选并重置选中下标
  const handleSearchTagsChange = (e) => {
    const v = e.target.value;
    setSearchTags(v);
    const parts = (v || '').split(',');
    const token = (parts[parts.length - 1] || '').trim();
    if (token && allTagNames.some(t => t.toLowerCase().startsWith(token.toLowerCase()))) {
      setTagSuggestionsOpen(true);
      setTagSuggestionIndex(0);
    } else {
      setTagSuggestionsOpen(false);
    }
  };

  useEffect(() => {
    setTagSuggestionIndex(0);
  }, [tagSuggestions.length]);

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

  const handleSelectTaggerModel = async () => {
    const path = await window.electronAPI.selectTaggerModel();
    if (path) setTaggerModelPath(path);
  };

  const handleGenerateTags = async () => {
    if (!taggerModelPath?.trim()) {
      alert(lang === 'zh' ? '请先选择打标签模型目录（含 model.onnx 和 selected_tags.csv）' : 'Please select the tagger model directory first (with model.onnx and selected_tags.csv)');
      return;
    }
    const paths = selectedIds.size > 0
      ? wallpapers.filter(w => selectedIds.has(w.id)).map(w => w.path)
      : filteredWallpapers.map(w => w.path);
    if (paths.length === 0) {
      alert(lang === 'zh' ? '没有可处理的壁纸' : 'No wallpapers to process');
      return;
    }
    setIsTaggerRunning(true);
    setTaggerProgress('');
    const progressHandler = ({ current, total, name, error }) => {
      const msg = error
        ? `${current}/${total}: ${name} - ${error}`
        : t.taggerProgress.replace('{current}', current).replace('{total}', total).replace('{name}', name);
      setTaggerProgress(msg);
    };
    window.electronAPI.onTaggerProgress(progressHandler);
    try {
      const res = await window.electronAPI.runPreviewTagger({
        modelDir: taggerModelPath.trim(),
        wallpaperPaths: paths,
        threshold: 0.35,
      });
      window.electronAPI.removeTaggerProgressListener();
      if (res.ok) {
        const resultsMap = new Map((res.results || []).map(r => [r.path, r]));
        setWallpapers(prev => prev.map(wp => {
          const r = resultsMap.get(wp.path);
          if (r && r.success && r.tags) return { ...wp, preview_tagger: r.tags };
          return wp;
        }));
        setTaggerProgress(t.taggerDone);
        setTimeout(() => setTaggerProgress(''), 2000);
      } else {
        setTaggerProgress(t.taggerError + ': ' + (res.error || ''));
        alert((res.error) || t.taggerError);
      }
    } catch (err) {
      window.electronAPI.removeTaggerProgressListener();
      setTaggerProgress(t.taggerError + ': ' + (err.message || err));
      alert(t.taggerError + ': ' + (err.message || err));
    } finally {
      setIsTaggerRunning(false);
    }
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
      alert(`${t.operationFailed}: ${err.message}`);
    }
  };

  const handleDeleteCollection = async (collectionName) => {
    if (!collectionName || collectionName === 'all') return;
    if (!confirm(t.deleteCollectionConfirm.replace('{name}', collectionName))) return;

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
      alert(t.selectOutputDirFirst);
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
          throw new Error(`${t.extractFailed}: ${result.stderr}`);
        }
      } else {
        await window.electronAPI.copyWallpaperAssets({ srcPath: wp.path, destDir: wpCachePath });
      }

      const assets = await window.electronAPI.getLargestAssets(wpCachePath);
      if (assets.length === 0) {
        alert(t.noAssetsFound);
        return;
      }
      setAssetModal({ wp, assets });
    } catch (err) {
      console.error('设置壁纸流程出错:', err);
      alert(`${t.operationFailed}: ${err.message}`);
    } finally {
      setIsSettingWallpaper(false);
    }
  };

  const selectAssetAsWallpaper = async (asset, options = {}) => {
    try {
      const result = await window.electronAPI.setWallpaper(asset.path, options);
      if (result.success) {
        alert(t.setWallpaperSuccess);
        setAssetModal(null);
      } else {
        alert(`${t.setWallpaperFailed}: ${result.error}`);
      }
    } catch (err) {
      alert(`${t.operationFailed}: ${err.message}`);
    }
  };

  const handleExtract = async () => {
    if (isRunning) {
      stopRef.current = true;
      await stopCommand();
      return;
    }
    if (!inputPath) {
      alert(t.invalidInputPath);
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
        setOutput(prev => prev + `${displayName} - ⏳ ${lang === 'zh' ? '正在提取...' : 'Extracting...'}\n`);
        if (justCopy) {
          const result = await window.electronAPI.copyDirectory({ srcPath: wp.path, destDir: outputDir, customName: displayName });
          setOutput(prev => prev.replace(`${displayName} - ⏳ ${lang === 'zh' ? '正在提取...' : 'Extracting...'}\n`, `${displayName} - ${result.success ? (lang === 'zh' ? '✅ 提取成功' : '✅ Success') : (lang === 'zh' ? '❌ 失败' : '❌ Failed')}\n`));
        } else if (wp.isPkg) {
          const targetDir = outputDir ? (singleDir ? outputDir : `${outputDir}/${displayName}`) : `${wp.path}/extracted`;
          const currentArgs = [...commonArgs];
          const oIdx = currentArgs.indexOf('-o');
          if (!singleDir) {
            if (oIdx !== -1) currentArgs[oIdx + 1] = targetDir;
            else currentArgs.push('-o', targetDir);
          }
          const result = await window.electronAPI.runRepkg([...currentArgs, wp.path]);
          setOutput(prev => prev.replace(`${displayName} - ⏳ ${lang === 'zh' ? '正在提取...' : 'Extracting...'}\n`, `${displayName} - ${result.code === 0 ? (lang === 'zh' ? '✅ 提取成功' : '✅ Success') : (lang === 'zh' ? '❌ 失败' : '❌ Failed')}\n`));
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
                    {t.wallpaperPreview} ({filteredWallpapers.length})
                  </h2>
                  <button onClick={selectAll} className="text-xs font-bold text-primary-600 hover:text-primary-700">
                    {selectedIds.size === filteredWallpapers.length && filteredWallpapers.length > 0 ? t.deselectAll : t.selectAll}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
                    <input
                      type="text"
                      placeholder={t.searchTextPlaceholder}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="input-field pl-9 py-1 text-xs w-full"
                    />
                  </div>
                  <div className="relative" ref={tagSuggestionsRef}>
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={t.searchTagsPlaceholder}
                      value={searchTags}
                      onChange={handleSearchTagsChange}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => searchTagToken && tagSuggestions.length > 0 && setTagSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setTagSuggestionsOpen(false), 150)}
                      className="input-field pl-9 py-1 text-xs w-full"
                    />
                    {tagSuggestionsOpen && tagSuggestions.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-slate-200 shadow-lg rounded-lg py-1 max-h-48 overflow-y-auto z-50 custom-scrollbar">
                        {tagSuggestions.map((tag, i) => (
                          <li key={tag}>
                            <button
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); applyTagSuggestion(tag); }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-primary-50 ${i === tagSuggestionIndex ? 'bg-primary-100 text-primary-800' : 'text-slate-700'}`}
                            >
                              {tag}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field py-1 text-xs">
                    <option value="all">{t.allTypes}</option>
                    {types.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="input-field py-1 text-xs">
                    <option value="all">{t.allRatings}</option>
                    {ratings.filter(r => r !== 'all').map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="flex gap-1">
                    <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="input-field py-1 text-xs flex-1">
                      <option value="all">{t.allCollections}</option>
                      {allCollections.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {collectionFilter !== 'all' && (
                      <button onClick={() => handleDeleteCollection(collectionFilter)} title={lang === 'zh' ? '删除当前收藏夹' : 'Delete current collection'} className="p-1 text-red-500 hover:bg-red-50 rounded">
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
                      <span className="text-xs font-bold">{t.itemsSelected.replace('{count}', selectedIds.size)}</span>
                      <div className="h-4 w-px bg-white/30" />
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => {
                          setCollectionModal({ show: true, ids: Array.from(selectedIds) });
                        }} className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">
                          <Plus className="w-3 h-3" /> {t.newCollectionAction}
                        </button>
                        {allCollections.filter(c => c !== 'all').length > 0 && (
                          <div className="relative group/menu">
                            <button className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">
                              <Bookmark className="w-3 h-3" /> {t.addCollectionAction} <ChevronDown className="w-3 h-3" />
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
                            <X className="w-3 h-3" /> {t.removeFromCollection}
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
                      {!wp.isPkg && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] px-1 py-0.5 rounded-bl-md font-bold">{lang === 'zh' ? '非PKG' : 'Non-PKG'}</div>}
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
                  <div className="text-[10px] text-slate-400">{t.pageInfo.replace('{current}', currentPage).replace('{total}', totalPages)}</div>
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
            <h2 className="text-base font-bold mb-3 shrink-0">{t.extractSettings}</h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t.inputPath}</label>
                <input type="text" value={inputPath} onChange={(e) => setInputPath(e.target.value)} placeholder={lang === 'zh' ? "PKG目录" : "PKG Directory"} className="input-field w-full py-1.5 text-xs mb-2" />
                <div className="flex gap-2">
                  <button onClick={handleSelectFile} className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1"><File className="w-3.5 h-3.5" />{t.file}</button>
                  <button onClick={handleSelectFolder} className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1"><FolderOpen className="w-3.5 h-3.5" />{t.directory}</button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" />{t.outputSettings}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">{t.outputDir}</label>
                      <div className="flex gap-1.5">
                        <input type="text" value={outputDir} onChange={(e) => setOutputDir(e.target.value)} className="input-field flex-1 py-1.5 text-xs" />
                        <button onClick={handleSelectOutput} className="btn-secondary py-1 text-xs px-2">{t.select}</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">{t.ignoreExts}</label>
                      <input type="text" value={ignoreExts} onChange={(e) => setIgnoreExts(e.target.value)} className="input-field py-1.5 text-xs" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50">
                  <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" />{t.tagSearch}</h3>
                  <div className="space-y-2 mb-3">
                    <label className="block text-[10px] text-slate-400">{t.taggerModelPath}</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={taggerModelPath}
                        onChange={(e) => setTaggerModelPath(e.target.value)}
                        placeholder={t.taggerModelPathPlaceholder}
                        className="input-field flex-1 py-1.5 text-xs"
                      />
                      <button type="button" onClick={handleSelectTaggerModel} className="btn-secondary py-1 text-xs px-2">{t.select}</button>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateTags}
                      disabled={isTaggerRunning || wallpapers.length === 0}
                      className="w-full py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isTaggerRunning ? t.generatingTags : t.generateTags}
                    </button>
                    {taggerProgress && <p className="text-[10px] text-slate-500 truncate" title={taggerProgress}>{taggerProgress}</p>}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50">
                  <h3 className="text-xs font-bold text-slate-700 mb-2">{t.options}</h3>
                  <div className="space-y-1.5">
                    {[
                      { label: t.convertTex, state: convertTex, set: setConvertTex },
                      { label: t.overwrite, state: overwrite, set: setOverwrite },
                      { label: t.justCopy, state: justCopy, set: setJustCopy }
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
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /> {t.advancedOptions}
                  </button>
                  {showAdvanced && (
                    <div className="mt-2 space-y-1.5 p-2 bg-slate-50 rounded-md">
                      {[
                        { label: t.recursive, state: recursive, set: setRecursive },
                        { label: t.singleDir, state: singleDir, set: setSingleDir },
                        { label: t.useName, state: useName, set: setUseName }
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
                {isRunning ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.stop}</> : <><Play className="w-4 h-4" />{selectedIds.size > 0 ? `${t.extract} (${selectedIds.size})` : t.execute}</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {output && (
        <div className="card shrink-0 py-2 px-4 border-t-4 border-primary-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.progress}</span>
            <button onClick={() => setOutput('')} className="text-[10px] text-slate-400 hover:text-slate-600">{t.clear}</button>
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

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} wp={contextMenu.wp} allCollections={allCollections} onOpenFolder={() => handleOpenFolder(contextMenu.wp)} onSetAsWallpaper={() => handleSetAsWallpaper(contextMenu.wp)} onUpdateCollections={handleUpdateCollections} onOpenNewCollection={() => setCollectionModal({ show: true, ids: [contextMenu.wp.id] })} lang={lang} />}
      {assetModal && <AssetModal wp={assetModal.wp} assets={assetModal.assets} onClose={() => setAssetModal(null)} onSelect={selectAssetAsWallpaper} lang={lang} />}
      {collectionModal.show && (
        <NewCollectionModal 
          onClose={() => setCollectionModal({ show: false, ids: [] })} 
          onConfirm={(name) => {
            handleUpdateCollections(collectionModal.ids, name, 'add');
            setCollectionModal({ show: false, ids: [] });
          }} 
          lang={lang}
        />
      )}
      {isSettingWallpaper && <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex items-center justify-center"><div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div><p className="text-sm font-medium text-slate-700">{t.preparingResources}</p></div></div>}
    </div>
  );
}

function ContextMenu({ x, y, wp, allCollections, onOpenFolder, onSetAsWallpaper, onUpdateCollections, onOpenNewCollection, lang }) {
  const t = translations[lang];
  const [showCollections, setShowCollections] = useState(false);
  
  return (
    <div className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-lg py-1 min-w-[180px] animate-in fade-in zoom-in duration-100" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
      <button onClick={onOpenFolder} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2"><FolderOpen className="w-4 h-4" />{t.openFolder}</button>
      <button onClick={onSetAsWallpaper} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2"><Monitor className="w-4 h-4" />{t.setAsWallpaper}</button>
      
      <div className="h-px bg-slate-100 my-1" />
      
      <div className="relative">
        <button 
          onMouseEnter={() => setShowCollections(true)}
          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2"><Bookmark className="w-4 h-4" />{t.addToCollection}</div>
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
              <Plus className="w-4 h-4" /> {t.newCollection}
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

function AssetModal({ wp, assets, onClose, onSelect, lang }) {
  const t = translations[lang];
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
            <h3 className="text-xl font-bold text-slate-900">{t.selectWallpaperFile}</h3>
            <p className="text-sm text-slate-500 mt-1">{t.chooseOneAsset}</p>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isMuted} 
                onChange={(e) => setIsMuted(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" 
              />
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{t.muteVideo}</span>
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
                <div className="flex items-center shrink-0"><button onClick={() => onSelect(asset, { isMuted })} className="w-full md:w-auto btn-primary py-3 px-8 shadow-lg">{t.applyAsWallpaper}</button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0"><p className="text-xs text-slate-400 italic">{t.cacheWarning}</p></div>
      </div>
    </div>
  );
}

function NewCollectionModal({ onClose, onConfirm, lang }) {
  const t = translations[lang];
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
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t.newCollectionAction}</h3>
          <input 
            autoFocus
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder={`${t.newCollection}...`} 
            className="input-field mb-6"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2">{t.cancel}</button>
            <button type="submit" disabled={!name.trim()} className="btn-primary flex-1 py-2">{t.confirm}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExtractView;
