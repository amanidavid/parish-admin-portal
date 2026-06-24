import AppLoader from '@/components/ui/AppLoader';
import { APP_NAME } from '@/constants/app';

export default function Loading() {
  return (
    <AppLoader
      fullscreen
      size="lg"
      label={`Loading ${APP_NAME}`}
      hint="Preparing the administration portal"
      className="bg-slate-50"
    />
  );
}
