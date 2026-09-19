import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { AuthAlertWrapper } from '@/components/AuthAlertWrapper'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: "Reviewly",
  description: "AI-powered study review app",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LoadingProvider>
          <AuthProvider>
            <AuthAlertWrapper>
              {children}
              <Toaster position="top-center" />
            </AuthAlertWrapper>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
