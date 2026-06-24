import "./globals.css";
import GlobalLoadingOverlay from '@/components/ui/GlobalLoadingOverlay';
import Notification from '@/components/ui/Notification';
import { APP_NAME } from '@/constants/app';

export const metadata = {
  title: `${APP_NAME} — Admin`,
  description: "Parish Property MIS Administration Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <GlobalLoadingOverlay />
        <Notification />
        {children}
      </body>
    </html>
  );
}
