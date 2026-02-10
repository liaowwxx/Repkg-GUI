import { useState } from 'react';
import { FolderOpen, File, Play, Search } from 'lucide-react';
import { useRepkg } from '../hooks/useRepkg';
import { translations } from '../utils/i18n';

function InfoView({ lang }) {
  const t = translations[lang];
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
      alert(t.electronOnly);
      return;
    }
    const path = await window.electronAPI.selectFile();
    if (path) setInfoPath(path);
  };

  const handleSelectFolder = async () => {
    if (!window.electronAPI) {
      alert(t.electronOnly);
      return;
    }
    const path = await window.electronAPI.selectFolder();
    if (path) setInfoPath(path);
  };

  const handleGetInfo = async () => {
    if (!infoPath) {
      alert(t.invalidInputPath);
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
        <h2 className="text-xl font-semibold mb-4">{t.viewInfo}</h2>

        {/* Input Path */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t.inputPath}
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
              {t.file}
            </button>
            <button
              onClick={handleSelectFolder}
              className="btn-secondary flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              {t.directory}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sort Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              {t.sortSettings}
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortEnabled}
                  onChange={(e) => setSortEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">{t.enableSort}</span>
              </label>
              {sortEnabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.sortBy}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-field"
                  >
                    <option value="name">{t.sortName}</option>
                    <option value="extension">{t.sortExtension}</option>
                    <option value="size">{t.sortSize}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">{t.displaySettings}</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printEntries}
                  onChange={(e) => setPrintEntries(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">{t.printEntries}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={texInfo}
                  onChange={(e) => setTexInfo(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">{t.texInfo}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Filter and Specific Info */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">{t.filterInfo}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.projectInfoFields}
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
                {t.titleFilter}
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
            {isRunning ? t.executing : t.getInfo}
          </button>
        </div>
      </div>

      {/* Output Log */}
      {output && (
        <div className="card">
          <h3 className="text-lg font-medium mb-4">{t.outputLog}</h3>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoView;
