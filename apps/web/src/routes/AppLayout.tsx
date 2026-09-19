import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { useMe } from '../lib/auth';

export function AppLayout() {
  const { data: user, isPending } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/auth', { replace: true });
    }
  }, [isPending, user, navigate]);

  if (isPending) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner-lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isReviewPage = location.pathname.includes('/review/');
  const hideSidebar = isReviewPage;
  const collapsedSidebar = sidebarCollapsed && !isReviewPage;

  return (
    <div
      className={`app-layout ${hideSidebar ? 'sidebar-hidden' : ''} ${collapsedSidebar ? 'sidebar-collapsed' : ''}`}
    >
      {!isReviewPage && (
        <Navbar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((previous) => !previous)}
        />
      )}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
