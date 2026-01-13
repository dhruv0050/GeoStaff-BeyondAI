/**
 * Dashboard Pages for Different Roles
 * Deep dark aesthetic with modern UI using Tailwind CSS
 */
import { authService } from '../services/authService';

export const EmployeeDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0f0f0f] border-b border-neutral-800/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-neutral-50">GeoStaff</span>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-sm font-bold text-neutral-100">{user.name}</p>
              <p className="text-xs text-neutral-500 font-medium">{user.phone}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-neutral-100 text-sm font-semibold border border-neutral-800 hover:border-neutral-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-neutral-50 mb-3 tracking-tight">Welcome back, {user.name}! 👋</h1>
          <p className="text-neutral-400 font-medium">Track your attendance seamlessly with location intelligence</p>
        </div>

        {/* Info Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {/* Status Card */}
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wide">STATUS</h3>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-br from-green-500/15 to-green-600/5 text-green-400 border border-green-500/20">
                Present
              </span>
            </div>
            <p className="text-2xl font-bold text-neutral-50 mb-1">On Time</p>
            <p className="text-xs text-neutral-500 font-medium">Checked in at 09:02 AM</p>
          </div>

          {/* Location Card */}
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wide">LOCATION</h3>
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
              </div>
            </div>
            <p className="text-lg font-bold text-neutral-50 mb-1">Tech Park Office</p>
            <p className="text-xs text-neutral-500 font-medium">Sector 62, Noida</p>
          </div>

          {/* Shift Card */}
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wide">SHIFT</h3>
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <p className="text-lg font-bold text-neutral-50 mb-1">09:00 - 18:00</p>
            <p className="text-xs text-neutral-500 font-medium">9 hours shift</p>
          </div>
        </div>

        {/* Main Action Card */}
        <div className="bg-[#141414]/70 backdrop-blur-xl border-2 border-neutral-800/50 rounded-3xl p-12 mb-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-50 mb-4">Mark Your Attendance</h2>
            <p className="text-neutral-400 mb-10 font-medium">You are within the authorized geo-fenced area</p>

            {/* Location Status */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm text-green-400 font-bold uppercase tracking-wider">LOCATION VERIFIED</span>
            </div>

            {/* Check-In Button */}
            <button className="inline-flex items-center justify-center gap-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-16 py-6 rounded-2xl shadow-2xl shadow-purple-500/30 active:scale-95 text-lg mb-6 transition-all duration-200 relative overflow-hidden group">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              CHECK IN NOW
            </button>

            <div className="flex items-center justify-center gap-2 text-neutral-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs font-semibold">2:34 PM • Tuesday, January 13, 2026</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xl font-bold text-neutral-200 mb-5">Recent Activity</h3>
          <div className="bg-[#141414]/70 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden">
            {/* Activity Item 1 */}
            <div className="p-6 flex items-center justify-between hover:bg-neutral-900/50 border-b border-neutral-800/50 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-100 mb-1">Checked In</p>
                  <p className="text-xs text-neutral-500 font-medium">Today at 09:02 AM</p>
                </div>
              </div>
              <span className="text-xs text-neutral-500 font-semibold px-3 py-1.5 bg-neutral-900 rounded-lg">Tech Park Office</span>
            </div>

            {/* Activity Item 2 */}
            <div className="p-6 flex items-center justify-between hover:bg-neutral-900/50 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl flex items-center justify-center border border-red-500/20">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-100 mb-1">Checked Out</p>
                  <p className="text-xs text-neutral-500 font-medium">Yesterday at 06:15 PM</p>
                </div>
              </div>
              <span className="text-xs text-neutral-500 font-semibold px-3 py-1.5 bg-neutral-900 rounded-lg">Tech Park Office</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const ManagerDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0f0f0f] border-b border-neutral-800/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-neutral-50">GeoStaff</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-sm font-bold text-neutral-100">{user.name}</p>
              <p className="text-xs text-neutral-500 font-medium">{user.phone}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-neutral-100 text-sm font-semibold border border-neutral-800 hover:border-neutral-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-neutral-50 mb-3 tracking-tight">Manager Dashboard</h1>
          <p className="text-neutral-400 font-medium">Welcome, {user.name}!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300">
            <h2 className="text-2xl font-bold text-neutral-50 mb-3">👥 Team Attendance</h2>
            <p className="text-neutral-400">Coming soon in Phase 7</p>
          </div>
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300">
            <h2 className="text-2xl font-bold text-neutral-50 mb-3">✅ Approve Requests</h2>
            <p className="text-neutral-400">Coming soon in Phase 8</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0f0f0f] border-b border-neutral-800/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-neutral-50">GeoStaff</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-sm font-bold text-neutral-100">{user.name}</p>
              <p className="text-xs text-neutral-500 font-medium">{user.phone}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-neutral-100 text-sm font-semibold border border-neutral-800 hover:border-neutral-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-neutral-50 mb-3 tracking-tight">Admin Dashboard</h1>
          <p className="text-neutral-400 font-medium">Welcome, {user.name}!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300">
            <h2 className="text-2xl font-bold text-neutral-50 mb-3">📍 Manage Locations</h2>
            <p className="text-neutral-400">Coming soon in Phase 4</p>
          </div>
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300">
            <h2 className="text-2xl font-bold text-neutral-50 mb-3">👥 Manage Employees</h2>
            <p className="text-neutral-400">Coming soon in Phase 5</p>
          </div>
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300">
            <h2 className="text-2xl font-bold text-neutral-50 mb-3">📊 Reports & Analytics</h2>
            <p className="text-neutral-400">Coming soon in Phase 7</p>
          </div>
        </div>
      </main>
    </div>
  );
};
