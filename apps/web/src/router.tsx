import { createBrowserRouter } from 'react-router';
import { AppLayout } from './routes/AppLayout';
import { AuthPage } from './routes/AuthPage';
import { LandingPage } from './routes/LandingPage';
import { Placeholder } from './routes/Placeholder';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/auth', element: <AuthPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <Placeholder title="Dashboard" /> },
      { path: '/profile', element: <Placeholder title="Profile" /> },
      { path: '/analytics', element: <Placeholder title="Analytics" /> },
      { path: '/modules/create', element: <Placeholder title="Create a module" /> },
      { path: '/modules/:id', element: <Placeholder title="Module" /> },
      { path: '/review/:moduleId/:mode', element: <Placeholder title="Review" /> },
    ],
  },
]);
