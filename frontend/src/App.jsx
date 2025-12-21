import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StatusPage from './pages/StatusPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import WebsiteSettingsPage from './pages/WebsiteSettingsPage';
import IncidentsPage from './pages/IncidentsPage';
import NotFoundPage from './pages/NotFoundPage';
import { getToken, api } from './utils/api';
import { HistoryProvider } from './context/HistoryContext';

// 路由组件 - 无页面切换动画，更快响应
function AppRoutes({ adminPath, loginPath }) {
  return (
    <Routes>
      <Route path="/" element={<StatusPage />} />
      <Route path="/incidents" element={<IncidentsPage />} />
      {/* 动态登录路径 */}
      <Route path={loginPath} element={<LoginPage adminPath={adminPath} />} />
      {/* 禁止直接访问 /console，重定向到首页 */}
      <Route path="/console" element={<Navigate to="/" replace />} />
      <Route 
        path={`/${adminPath}`}
            element={
              getToken() ? (
                <AdminPage />
              ) : (
                <Navigate to={loginPath} replace />
              )
            } 
          />
          <Route 
            path="/settings" 
            element={
              getToken() ? (
                <SettingsPage />
              ) : (
                <Navigate to={loginPath} replace />
              )
            } 
          />
          <Route 
            path="/website-settings" 
            element={
              getToken() ? (
                <WebsiteSettingsPage />
              ) : (
                <Navigate to={loginPath} replace />
              )
            } 
          />
          {/* 404 - 所有未匹配的路径 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
  );
}

function App() {
  const [adminPath, setAdminPath] = useState('admin');
  const [pathLoaded, setPathLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 动态更新状态栏颜色
    const updateThemeColor = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const themeColor = isDarkMode ? '#0d0d0d' : '#ffffff';
      let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.content = themeColor;
    };
    
    updateThemeColor();
    
    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateThemeColor();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api.getAdminPath()
      .then(data => {
        if (data.path) {
          setAdminPath(data.path);
        }
      })
      .catch(() => {})
      .finally(() => setPathLoaded(true));
  }, []);

  if (!pathLoaded) {
    return null;
  }

  // 登录路径也使用动态路径
  const loginPath = `/${adminPath}/console`;

  return (
    <HistoryProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppRoutes adminPath={adminPath} loginPath={loginPath} />
      </BrowserRouter>
    </HistoryProvider>
  );
}

export default App;
