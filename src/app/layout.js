import "./globals.css";
import GlobalLoadingOverlay from '@/components/ui/GlobalLoadingOverlay';
import Notification from '@/components/ui/Notification';

export const metadata = {
  title: "Parish MIS — Admin",
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
