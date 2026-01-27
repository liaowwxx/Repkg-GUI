import { useState } from 'react';
import { FolderOpen, File, Play, Search } from 'lucide-react';
import { useRepkg } from '../hooks/useRepkg';

function InfoView() {
  const [infoPath, setInfoPath] = useState('');
  const [sortEnabled, setSortEnabled] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [printEntries, setPrintEntries] = useState(false);
  const [texInfo, setTexInfo] = useState(false);
  const [projectInfo, setProjectInfo] = useState('');
  const [titleFilter, setTitleFilter] = useState('');

  const { runCommand, output, isRunning } = useRepkg();

  const handleSelectFile = async () => {
    if (!window.electronAPI) {
      alert('文件选择功能仅在 Electron 环境中可用');
      return;
    }
    const path = await window.electronAPI.selectFile();
    if (path) setInfoPath(path);
  };

  const handleSelectFolder = async () => {
    if (!window.electronAPI) {
      alert('文件夹选择功能仅在 Electron 环境中可用');
      return;
    }
    const path = await window.electronAPI.selectFolder();
    if (path) setInfoPath(path);
  };

  const handleGetInfo = async () => {
    if (!infoPath) {
      alert('请输入有效的输入路径');
      return;
    }

    const args = ['info'];
    if (sortEnabled) args.push('-s');
    if (sortBy) args.push('-b', sortBy);
    if (texInfo) args.push('-t');
    if (projectInfo) args.push('-p', projectInfo);
    if (printEntries) args.push('-e');
    if (titleFilter) args.push('--title-filter', titleFilter);
    args.push(infoPath);

    await runCommand(args);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">查看信息 (Info)</h2>

        {/* Input Path */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            输入路径
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={infoPath}
              onChange={(e) => setInfoPath(e.target.value)}
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
          {/* Sort Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              排序设置
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortEnabled}
                  onChange={(e) => setSortEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">启用排序 (-s)</span>
              </label>
              {sortEnabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    排序方式 (-b)
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-field"
                  >
                    <option value="name">名称</option>
                    <option value="extension">扩展名</option>
                    <option value="size">大小</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">显示设置</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printEntries}
                  onChange={(e) => setPrintEntries(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">打印包内条目 (-e)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={texInfo}
                  onChange={(e) => setTexInfo(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">查看 TEX 详细信息 (-t)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Filter and Specific Info */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">过滤与特定信息</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                项目信息字段 (-p)
              </label>
              <input
                type="text"
                value={projectInfo}
                onChange={(e) => setProjectInfo(e.target.value)}
                placeholder="例如: *, title, description (逗号分隔)"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                标题过滤 (--title-filter)
              </label>
              <input
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                placeholder="仅显示匹配标题的项"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Execute Button */}
        <div className="mt-6">
          <button
            onClick={handleGetInfo}
            disabled={isRunning || !infoPath}
            className="btn-primary flex items-center gap-2 w-full justify-center"
          >
            <Play className="w-5 h-5" />
            {isRunning ? '执行中...' : '获取信息'}
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

export default InfoView;
