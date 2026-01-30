import { useState, useEffect, useCallback } from 'react';

export function useRepkg() {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      console.warn('electronAPI 不可用');
      return;
    }

    const handleOutput = (data) => {
      // 过滤掉冗长的详细日志，只保留状态或由于是流式输出，这里我们可以选择不更新到 UI
      // 除非是特定的状态行
    };

    window.electronAPI.onRepkgOutput(handleOutput);

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeRepkgOutputListener();
      }
    };
  }, []);

  const runCommand = useCallback(async (args, shouldClear = true) => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setOutput('错误: electronAPI 不可用。请确保在 Electron 环境中运行。');
      return;
    }

    if (shouldClear) setOutput('');
    setIsRunning(true);

    try {
      const result = await window.electronAPI.runRepkg(args);
      if (result.stderr) {
        setOutput((prev) => prev + result.stderr);
      }
      if (result.code !== 0) {
        setOutput((prev) => prev + `\n命令执行失败，退出代码: ${result.code}`);
      } else {
        setOutput((prev) => prev + '\n✅ 命令执行成功');
      }
    } catch (error) {
      setOutput((prev) => prev + `\n发生错误: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const stopCommand = useCallback(async () => {
    if (window.electronAPI?.stopRepkg) {
      await window.electronAPI.stopRepkg();
      setIsRunning(false);
    }
  }, []);

  return {
    runCommand,
    stopCommand,
    output,
    setOutput,
    isRunning,
    setIsRunning,
  };
}
