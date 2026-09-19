import { createBrowserRouter } from 'react-router';
import { AppLayout } from './routes/AppLayout';
import { AuthPage } from './routes/AuthPage';
import { DashboardPage } from './routes/DashboardPage';
import { LandingPage } from './routes/LandingPage';
import { ModuleCreatePage } from './routes/ModuleCreatePage';
import { ModuleDetailPage } from './routes/ModuleDetailPage';
import { Placeholder } from './routes/Placeholder';
import { ReviewPage } from './routes/ReviewPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/auth', element: <AuthPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/modules/create', element: <ModuleCreatePage /> },
      { path: '/modules/:id', element: <ModuleDetailPage /> },
      { path: '/profile', element: <Placeholder title="Profile" /> },
      { path: '/analytics', element: <Placeholder title="Analytics" /> },
      { path: '/review/:moduleId/:mode', element: <ReviewPage /> },
    ],
  },
]);
