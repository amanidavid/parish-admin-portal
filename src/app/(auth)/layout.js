export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <img
          src="/image/admin.png"
          alt="Admin portal illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* subtle gradient overlay so the image blends into the page if it has transparent edges */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 to-gray-900/60" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-extrabold text-sm select-none">
            Z
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">ZABA</span>
        </div>
        <div className="w-full max-w-[420px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
