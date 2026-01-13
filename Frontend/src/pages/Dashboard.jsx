/**
 * Dashboard Pages for Different Roles
 * Modern sidebar layout with teal/blue theme and light content area
 */
import { useState } from 'react';
import { authService } from '../services/authService';
import AttendanceWidget from '../components/AttendanceWidget';

export const EmployeeDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendanceData, setAttendanceData] = useState(null);

  const handleLogout = () => {
    authService.logout();
  };

  const handleAttendanceChange = (data) => {
    setAttendanceData(data);
  };

  const formatDate = () => {
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2e5c6e] text-white flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-400/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">GeoStaff</h1>
              <p className="text-xs text-teal-200">Workforce T&A</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-teal-500/30 text-white'
                : 'text-teal-100 hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'attendance'
                ? 'bg-teal-500/30 text-white'
                : 'text-teal-100 hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Attendance
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'approvals'
                ? 'bg-teal-500/30 text-white'
                : 'text-teal-100 hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Approvals
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-teal-500/30 text-white'
                : 'text-teal-100 hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Settings
          </button>
        </nav>

        {/* User Profile & Sign Out */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-teal-400/30 flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-teal-200 truncate">Employee</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-teal-100 hover:bg-white/10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search employees, locations..."
                className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full"></span>
              </button>
              <span className="text-sm text-gray-600">{formatDate()}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your workforce overview for today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Employees */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#2e5c6e] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">1</p>
                    <p className="text-sm text-gray-600">You</p>
                  </div>
                </div>
              </div>

              {/* Present Today */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{attendanceData?.status === 'checked-in' || attendanceData?.status === 'checked-out' ? '1' : '0'}</p>
                    <p className="text-sm text-gray-600">Present Today</p>
                    {attendanceData?.status === 'checked-in' || attendanceData?.status === 'checked-out' ? (
                      <p className="text-xs text-teal-600 font-semibold mt-1">+3.2% vs yesterday</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Late Arrivals */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">0</p>
                    <p className="text-sm text-gray-600">Late Arrivals</p>
                    <p className="text-xs text-red-600 font-semibold mt-1">Within grace period: 0</p>
                  </div>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">0</p>
                    <p className="text-sm text-gray-600">Pending Approvals</p>
                    <p className="text-xs text-gray-500 mt-1">0 leave, 0 regularization</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Attendance Widget - Takes 2 columns */}
              <div className="lg:col-span-2">
                <AttendanceWidget onAttendanceChange={handleAttendanceChange} />
              </div>

              {/* Recent Activity - Takes 1 column */}
              <div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                    <button className="text-sm font-semibold text-teal-600 hover:text-teal-700">
                      View All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {attendanceData?.check_in && (
                      <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{attendanceData.check_in.work_status.charAt(0).toUpperCase() + attendanceData.check_in.work_status.slice(1)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded">On-Time</span>
                            <span className="text-xs text-gray-400">
                              {new Date(attendanceData.check_in.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!attendanceData?.check_in && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No activity yet today
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance</h1>
              <p className="text-gray-600">Mark your attendance and view history</p>
            </div>
            <AttendanceWidget onAttendanceChange={handleAttendanceChange} />
          </div>
        )}

        {/* Other Tabs - Placeholders */}
        {activeTab === 'approvals' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Approvals</h1>
              <p className="text-gray-600">View and manage your approval requests</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-600">Coming soon in Phase 4 - Leave Management</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
              <p className="text-gray-600">Manage your preferences and account settings</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-600">Coming soon</p>
            </div>
          </div>
        )}
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Manager Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name}!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">👥 Team Attendance</h2>
            <p className="text-gray-600">Coming soon in Phase 7</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">✅ Approve Requests</h2>
            <p className="text-gray-600">Coming soon in Phase 8</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name}!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">📍 Manage Locations</h2>
            <p className="text-gray-600">Coming soon in Phase 4</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">👥 Manage Employees</h2>
            <p className="text-gray-600">Coming soon in Phase 5</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">📊 Reports & Analytics</h2>
            <p className="text-gray-600">Coming soon in Phase 7</p>
          </div>
        </div>
      </div>
    </div>
  );
};
