import { useState, useEffect } from 'react';
import { FolderOpen, File, Play, Settings, ChevronDown } from 'lucide-react';
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
  
  const { runCommand, output, isRunning } = useRepkg();

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

    const args = ['extract'];
    if (outputDir) args.push('-o', outputDir);
    if (ignoreExts) args.push('-i', ignoreExts);
    if (onlyExts) args.push('-e', onlyExts);
    if (debugInfo) args.push('-d');
    if (convertTex) args.push('-t');
    if (singleDir) args.push('-s');
    if (recursive) args.push('-r');
    if (copyProject) args.push('-c');
    if (useName) args.push('-n');
    if (noTexConvert) args.push('--no-tex-convert');
    if (overwrite) args.push('--overwrite');
    args.push(inputPath);

    await runCommand(args);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">文件提取 (Extract)</h2>
        
        {/* Input Path */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            输入路径
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              placeholder="PKG/TEX 文件路径或包含这些文件的目录路径"
              className="input-field flex-1"
            />
            <button
              onClick={handleSelectFile}
              className="btn-secondary flex items-center gap-2"
            >
              <File className="w-4 h-4" />
              文件
            </button>
            <button
              onClick={handleSelectFolder}
              className="btn-secondary flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              目录
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Output Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              输出设置
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="btn-secondary"
                  >
                    选择
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  忽略扩展名 (-i)
                </label>
                <input
                  type="text"
                  value={ignoreExts}
                  onChange={(e) => setIgnoreExts(e.target.value)}
                  placeholder="例如: txt,log (用逗号分隔)"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  仅提取扩展名 (-e)
                </label>
                <input
                  type="text"
                  value={onlyExts}
                  onChange={(e) => setOnlyExts(e.target.value)}
                  placeholder="例如: tex,json"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Conversion Options */}
          <div>
            <h3 className="text-lg font-medium mb-4">转换选项</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={convertTex}
                  onChange={(e) => setConvertTex(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">将 TEX 转换为图像 (-t)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noTexConvert}
                  onChange={(e) => setNoTexConvert(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">禁止 TEX 转换 (--no-tex-convert)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">覆盖现有文件 (--overwrite)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mt-6">
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
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debugInfo}
                    onChange={(e) => setDebugInfo(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">打印调试信息 (-d)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recursive}
                    onChange={(e) => setRecursive(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">递归搜索目录 (-r)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={singleDir}
                    onChange={(e) => setSingleDir(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">放入单一目录 (-s)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipErrors}
                    onChange={(e) => setSkipErrors(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">批量容错模式</span>
                </label>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyProject}
                    onChange={(e) => setCopyProject(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">复制项目文件 (-c)</span>
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
            </div>
          )}
        </div>

        {/* Execute Button */}
        <div className="mt-6">
          <button
            onClick={handleExtract}
            disabled={isRunning || !inputPath}
            className="btn-primary flex items-center gap-2 w-full justify-center"
          >
            <Play className="w-5 h-5" />
            {isRunning ? '执行中...' : '开始执行提取'}
          </button>
        </div>
      </div>

      {/* Output Log */}
      {output && (
        <div className="card">
          <h3 className="text-lg font-medium mb-4">输出日志</h3>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExtractView;
