export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #7c2d12 50%, #ea580c 100%)' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">Parish MIS</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            <span className="text-orange-200 text-xs font-medium">Administration Portal</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Platform control<br />at your fingertips
          </h2>
          <p className="text-orange-100/80 text-base leading-relaxed">
            Manage workspaces, billing profiles, subscriptions and platform health from one secure portal.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { icon: '�️', label: 'Workspace Management', desc: 'Provision, monitor and control tenant workspaces' },
            { icon: '�', label: 'Billing & Subscriptions', desc: 'Manage billing profiles, rules and pricing tiers' },
            { icon: '📊', label: 'Platform Insights', desc: 'Operational data across all active workspaces' },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
              <span className="text-xl">{f.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-orange-200/70 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">Parish MIS Admin</span>
        </div>
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
