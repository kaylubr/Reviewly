import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: "Reviewly",
  description: "AI-powered study review app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LoadingProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
