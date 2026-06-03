import AppLoader from '@/components/ui/AppLoader';

export default function Loading() {
  return (
    <AppLoader
      fullscreen
      size="lg"
      label="Loading Parish MIS"
      hint="Preparing the administration portal"
      className="bg-slate-50"
    />
  );
}
