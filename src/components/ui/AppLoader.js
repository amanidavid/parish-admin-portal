function SpinnerCore({ size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-14 h-14' : size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';

  return (
    <div className={`relative ${sizeClass}`} aria-hidden="true">
      <div className="app-loader-ring" />
      <div className="app-loader-ring app-loader-ring-secondary" />
      <div className="app-loader-core">
        <div className="app-loader-core-dot" />
      </div>
      <span className="app-loader-orb app-loader-orb-orange" />
      <span className="app-loader-orb app-loader-orb-cyan" />
    </div>
  );
}

export default function AppLoader({
  label = 'Loading',
  hint = 'Please wait while we prepare your workspace',
  fullscreen = false,
  size = 'md',
  className = '',
}) {
  const containerClass = fullscreen
    ? 'min-h-screen w-full'
    : 'min-h-[320px] w-full';

  return (
    <div
      className={[
        'flex items-center justify-center',
        containerClass,
        className,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="app-loader-shell">
        <SpinnerCore size={size} />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
      </div>
    </div>
  );
}
