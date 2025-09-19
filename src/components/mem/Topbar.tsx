"use client";

export default function Topbar() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo thumbnail - far left */}
          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            <img 
              src="/api/logo/thumb?v=3" 
              alt="AM I HUMAN" 
              className="w-full h-full object-contain"
            />
          </div>
          {/* Welcome message - left side */}
          <div className="text-sm text-slate-600">
            Welcome, <span className="font-medium text-slate-800">Member</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Profile icon - right side */}
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <span className="text-slate-600 text-sm">👤</span>
          </div>
        </div>
      </div>
    </header>
  );
}
