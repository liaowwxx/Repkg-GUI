import { useState } from 'react';
import { Play, BookOpen } from 'lucide-react';
import { useRepkg } from '../hooks/useRepkg';

function HelpView() {
  const [helpType, setHelpType] = useState('general');

  const { runCommand, output, isRunning } = useRepkg();

  const handleGetHelp = async () => {
    const args = ['help'];
    if (helpType === 'extract') {
      args.push('extract');
    } else if (helpType === 'info') {
      args.push('info');
    }
    await runCommand(args);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          帮助文档
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            查看帮助详情
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="helpType"
                value="general"
                checked={helpType === 'general'}
                onChange={(e) => setHelpType(e.target.value)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span>通用帮助</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="helpType"
                value="extract"
                checked={helpType === 'extract'}
                onChange={(e) => setHelpType(e.target.value)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span>Extract 帮助</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="helpType"
                value="info"
                checked={helpType === 'info'}
                onChange={(e) => setHelpType(e.target.value)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span>Info 帮助</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleGetHelp}
          disabled={isRunning}
          className="btn-primary flex items-center gap-2 w-full justify-center"
        >
          <Play className="w-5 h-5" />
          {isRunning ? '执行中...' : '获取帮助'}
        </button>
      </div>

      {/* Output Log */}
      {output && (
        <div className="card">
          <h3 className="text-lg font-medium mb-4">帮助信息</h3>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpView;
