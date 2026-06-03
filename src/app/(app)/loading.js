import AppLoader from '@/components/ui/AppLoader';

export default function Loading() {
  return (
    <AppLoader
      label="Loading page"
      hint="Bringing in the next view"
      className="py-10"
    />
  );
}
