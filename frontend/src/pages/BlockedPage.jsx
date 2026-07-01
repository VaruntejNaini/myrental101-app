export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md mx-auto select-none">

        {/* Blocked Icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Outer glow ring */}
          <div className="absolute w-36 h-36 rounded-full bg-red-50 border border-red-100 animate-pulse" />
          {/* Inner circle */}
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 flex items-center justify-center shadow-xl shadow-red-100">
            {/* SVG ban/block icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-black tracking-tight text-red-600 mb-3">
          Access Restricted
        </h1>

        {/* Divider */}
        <div className="w-12 h-0.5 bg-gradient-to-r from-red-300 to-red-500 mx-auto mb-5 rounded-full" />

        {/* Body text */}
        <p className="text-red-500 text-sm font-medium leading-relaxed mb-1">
          You are not allowed to access this site.
        </p>
        <p className="text-red-400 text-sm leading-relaxed mb-8">
          Your account has been blocked by an administrator.
        </p>

        {/* Contact card */}
        <div className="inline-block bg-red-50 border border-red-100 rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-2">
            Contact Support
          </p>
          <a
            href="mailto:varuncode7@gmail.com"
            className="text-red-600 font-bold text-sm hover:text-red-700 transition-colors underline underline-offset-2 decoration-red-300"
          >
            varuncode7@gmail.com
          </a>
          <p className="text-[11px] text-red-300 mt-2">
            Please reach out to resolve this issue.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-red-200 mt-8 font-medium tracking-wide uppercase">
          Error Code: 403 — Account Suspended
        </p>
      </div>
    </div>
  );
}
