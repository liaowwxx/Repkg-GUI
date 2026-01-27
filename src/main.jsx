import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// 确保 root 元素存在
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('找不到 root 元素！');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">错误: 找不到 root 元素</div>';
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
