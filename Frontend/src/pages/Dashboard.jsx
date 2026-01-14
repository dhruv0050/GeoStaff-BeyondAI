/**
 * Dashboard Pages for Different Roles
 * Modern sidebar layout with teal/blue theme and light content area
 */
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import AttendanceWidget from '../components/AttendanceWidget';

// Attendance History Tab Component
const AttendanceHistoryTab = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [startDate, endDate, records]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAttendanceHistory(1, 100);
      setRecords(data.records || []);
      setFilteredRecords(data.records || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];
    
    if (startDate) {
      filtered = filtered.filter(r => 
        new Date(r.timestamp) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59);
      filtered = filtered.filter(r => 
        new Date(r.timestamp) <= endDateTime
      );
    }
    
    setFilteredRecords(filtered);
  };

  const handleExport = async (format) => {
    try {
      await attendanceService.exportAttendance(
        format,
        startDate || null,
        endDate || null
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  const groupByDate = () => {
    const grouped = {};
    filteredRecords.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { checkIn: null, checkOut: null };
      }
      if (record.type === 'check-in') {
        grouped[date].checkIn = record;
      } else {
        grouped[date].checkOut = record;
      }
    });
    return grouped;
  };

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    const hours = (new Date(checkOut.timestamp) - new Date(checkIn.timestamp)) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getDayAttendance = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    const grouped = groupByDate();
    return grouped[dateStr];
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance History</h1>
        <p className="text-gray-600">View and export your attendance records</p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              Clear Filters
            </button>
          )}

          <div className="flex-1"></div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                viewMode === 'calendar' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-all"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-In</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-Out</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(groupByDate()).map(([date, data]) => {
                    const hours = calculateHours(data.checkIn, data.checkOut);
                    return (
                      <tr key={date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {data.checkIn ? new Date(data.checkIn.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata'
                          }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {data.checkOut ? new Date(data.checkOut.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata'
                          }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                          {hours ? `${hours}h` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            data.checkIn && data.checkOut ? 'bg-teal-100 text-teal-700' :
                            data.checkIn ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {data.checkIn && data.checkOut ? 'Complete' :
                             data.checkIn ? 'Checked In' :
                             'No Record'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {data.checkIn ? (
                            <span className="text-xs">
                              {data.checkIn.location.latitude.toFixed(4)}, {data.checkIn.location.longitude.toFixed(4)}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">No attendance records found</div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h3 className="text-xl font-bold text-gray-800">
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
            
            {getCalendarDays().map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }
              
              const attendance = getDayAttendance(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const hasCheckIn = attendance?.checkIn;
              const hasCheckOut = attendance?.checkOut;
              
              return (
                <div
                  key={index}
                  className={`aspect-square p-2 border rounded-lg flex flex-col items-center justify-center text-sm ${
                    isToday ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={`font-semibold ${isToday ? 'text-teal-700' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </span>
                  {hasCheckIn && (
                    <div className={`w-2 h-2 rounded-full mt-1 ${
                      hasCheckOut ? 'bg-teal-500' : 'bg-blue-500'
                    }`}></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-600">No Record</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Leave Management Tab Component
const LeaveManagementTab = () => {
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  
  // Form state
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    loadLeaveData();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const days = leaveService.calculateLeaveDays(startDate, endDate);
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, endDate]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      const [balance, history] = await Promise.all([
        leaveService.getLeaveBalance(),
        leaveService.getLeaveHistory(1, 50)
      ]);
      setLeaveBalance(balance);
      setLeaveHistory(history.requests || []);
    } catch (error) {
      console.error('Failed to load leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate || !reason.trim()) {
      setError('Please fill all required fields');
      return;
    }

    if (calculatedDays <= 0) {
      setError('Invalid date range');
      return;
    }

    try {
      setSubmitting(true);
      await leaveService.applyLeave(leaveType, startDate, endDate, reason);
      
      // Reset form
      setShowApplyForm(false);
      setLeaveType('casual');
      setStartDate('');
      setEndDate('');
      setReason('');
      setCalculatedDays(0);
      
      // Reload data
      await loadLeaveData();
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to apply leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      await leaveService.cancelLeave(requestId);
      await loadLeaveData();
    } catch (error) {
      alert('Failed to cancel leave request');
    }
  };

  const getAvailableBalance = () => {
    if (!leaveBalance) return 0;
    switch (leaveType) {
      case 'casual': return leaveBalance.casual_balance;
      case 'sick': return leaveBalance.sick_balance;
      case 'earned': return leaveBalance.earned_balance;
      default: return 0;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Leave Management</h1>
        <p className="text-gray-600">Apply for leave and manage your requests</p>
      </div>

      {/* Leave Balance Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium opacity-90">Total Balance</span>
                <svg className="w-6 h-6 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-4xl font-bold">{leaveBalance?.total_balance || 0}</p>
              <p className="text-sm opacity-75 mt-1">of 30 days</p>
            </div>

            {/* Casual Leave */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">Casual Leave</span>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{leaveBalance?.casual_balance || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Used: {leaveBalance?.used_casual || 0}</p>
            </div>

            {/* Sick Leave */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">Sick Leave</span>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{leaveBalance?.sick_balance || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Used: {leaveBalance?.used_sick || 0}</p>
            </div>

            {/* Earned Leave */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">Earned Leave</span>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{leaveBalance?.earned_balance || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Used: {leaveBalance?.used_earned || 0}</p>
            </div>
          </div>

          {/* Apply Leave Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowApplyForm(!showApplyForm)}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              {showApplyForm ? 'Cancel' : 'Apply for Leave'}
            </button>
          </div>

          {/* Apply Leave Form */}
          {showApplyForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">New Leave Request</h3>
              
              <form onSubmit={handleApplyLeave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="earned">Earned Leave</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Available: {getAvailableBalance()} days</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                    <div className="px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl">
                      <p className="text-lg font-bold text-teal-700">
                        {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                      </p>
                      <p className="text-xs text-gray-600">Excluding weekends</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows="3"
                    placeholder="Please provide a brief reason for your leave request..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  ></textarea>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting || calculatedDays <= 0}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Leave History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Leave History</h3>
            </div>

            {leaveHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No leave requests yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaveHistory.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {leaveService.formatLeaveType(leave.leave_type)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                          {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                          {leave.days}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${leaveService.getStatusColor(leave.status)}`}>
                            {leaveService.formatLeaveStatus(leave.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {(leave.status === 'pending' || leave.status === 'approved') && (
                            <button
                              onClick={() => handleCancelLeave(leave.id)}
                              className="text-sm font-semibold text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Employee Dashboard Component
export const EmployeeDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendanceData, setAttendanceData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      
      // Load recent activity (last 7 days)
      const recentData = await attendanceService.getRecentAttendance(7);
      setRecentActivity(recentData.records || []);
      
      // Load monthly summary
      const summaryData = await attendanceService.getMonthlySummary(
        now.getFullYear(),
        now.getMonth() + 1
      );
      setMonthlySummary(summaryData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  const handleAttendanceChange = (data) => {
    setAttendanceData(data);
    // Reload dashboard data after attendance change
    loadDashboardData();
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
            </svg>
            Attendance
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-teal-500/30 text-white'
                : 'text-teal-100 hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            History
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'leaves'
                ? 'bg-teal-500/30 text-white'
                : 'text-teal-100 hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Leaves
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
              {/* Today's Status */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    attendanceData?.status === 'checked-in' ? 'bg-teal-500' :
                    attendanceData?.status === 'checked-out' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Today's Status</p>
                    <p className="text-lg font-bold text-gray-800">
                      {attendanceData?.status === 'checked-in' ? 'Working' :
                       attendanceData?.status === 'checked-out' ? 'Completed' :
                       'Not Started'}
                    </p>
                    {attendanceData?.hours_worked && (
                      <p className="text-xs text-gray-500 mt-1">{attendanceData.hours_worked.toFixed(1)}h worked</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Present */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">This Month</p>
                    <p className="text-2xl font-bold text-gray-800">{monthlySummary?.present_days || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">days present</p>
                  </div>
                </div>
              </div>

              {/* Monthly Absent */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Absent Days</p>
                    <p className="text-2xl font-bold text-gray-800">{monthlySummary?.absent_days || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">this month</p>
                  </div>
                </div>
              </div>

              {/* Working Days */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Working Days</p>
                    <p className="text-2xl font-bold text-gray-800">{monthlySummary?.working_days || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">in {new Date().toLocaleDateString('en-US', { month: 'short' })}</p>
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
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="text-sm font-semibold text-teal-600 hover:text-teal-700"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Loading...
                      </div>
                    ) : recentActivity.length > 0 ? (
                      recentActivity.slice(0, 5).map((day, index) => (
                        <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            day.status === 'present' ? 'bg-teal-100' : 'bg-gray-100'
                          }`}>
                            {day.status === 'present' ? (
                              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {day.status === 'present' ? (
                                day.check_in ? (
                                  <>
                                    {new Date(day.check_in.timestamp).toLocaleTimeString('en-IN', { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      timeZone: 'Asia/Kolkata'
                                    })}
                                    {day.check_out && ` - ${new Date(day.check_out.timestamp).toLocaleTimeString('en-IN', { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      timeZone: 'Asia/Kolkata'
                                    })}`}
                                  </>
                                ) : 'Present'
                              ) : 'Absent'}
                            </p>
                            {day.hours_worked && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded">
                                  {day.hours_worked.toFixed(1)}h
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No activity in the last 7 days
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

        {/* History Tab */}
        {activeTab === 'history' && (
          <AttendanceHistoryTab />
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <LeaveManagementTab />
        )}

        {/* Other Tabs - Placeholders */}
        {activeTab === 'approvals' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Approvals</h1>
              <p className="text-gray-600">Leave approvals and regularization requests</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-gray-600">Manager Approvals</p>
              <p className="text-sm text-gray-500 mt-2">Leave approval workflow will be available for managers</p>
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
