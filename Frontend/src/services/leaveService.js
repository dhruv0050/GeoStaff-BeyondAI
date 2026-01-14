/**
 * Leave Management Service
 * API methods for leave operations
 */
import api from './api';

class LeaveService {
  /**
   * Apply for leave
   */
  async applyLeave(leaveType, startDate, endDate, reason) {
    const response = await api.post('/leave/apply', {
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
    });
    return response.data;
  }

  /**
   * Get leave balance
   */
  async getLeaveBalance(year = null) {
    const params = year ? { year } : {};
    const response = await api.get('/leave/balance', { params });
    return response.data;
  }

  /**
   * Get leave history
   */
  async getLeaveHistory(page = 1, pageSize = 50, statusFilter = null) {
    const params = { page, page_size: pageSize };
    if (statusFilter) {
      params.status_filter = statusFilter;
    }
    const response = await api.get('/leave/history', { params });
    return response.data;
  }

  /**
   * Cancel leave request
   */
  async cancelLeave(requestId) {
    const response = await api.post(`/leave/cancel/${requestId}`);
    return response.data;
  }

  /**
   * Get pending leave count
   */
  async getPendingCount() {
    const response = await api.get('/leave/pending-count');
    return response.data;
  }

  /**
   * Format leave type for display
   */
  formatLeaveType(type) {
    const types = {
      casual: 'Casual Leave',
      sick: 'Sick Leave',
      earned: 'Earned Leave',
    };
    return types[type] || type;
  }

  /**
   * Format leave status for display
   */
  formatLeaveStatus(status) {
    const statuses = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return statuses[status] || status;
  }

  /**
   * Get status color
   */
  getStatusColor(status) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-teal-100 text-teal-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  /**
   * Calculate leave days (excluding weekends)
   */
  calculateLeaveDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;
    
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Count only weekdays (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }
}

export const leaveService = new LeaveService();
