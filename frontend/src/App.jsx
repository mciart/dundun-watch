import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StatusPage from './pages/StatusPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import WebsiteSettingsPage from './pages/WebsiteSettingsPage';
import IncidentsPage from './pages/IncidentsPage';
import NotFoundPage from './pages/NotFoundPage';
import { getToken, api } from './utils/api';
import { HistoryProvider } from './context/HistoryContext';

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
  const loginPath = `/${adminPath}/login`;

  return (
    <HistoryProvider>
    <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
        <Route path="/" element={<StatusPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        {/* 动态登录路径 */}
        <Route path={loginPath} element={<LoginPage adminPath={adminPath} />} />
        {/* 禁止直接访问 /login，重定向到首页 */}
        <Route path="/login" element={<Navigate to="/" replace />} />
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
    </BrowserRouter>
    </HistoryProvider>
  );
}

export default App;
