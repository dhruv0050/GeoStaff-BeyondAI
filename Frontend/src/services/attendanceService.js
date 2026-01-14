/**
 * Attendance Service
 * API methods for attendance check-in/check-out operations
 */
import api from './api';

class AttendanceService {
  /**
   * Check in with geolocation
   */
  async checkIn(latitude, longitude, accuracy, workStatus, deviceId, photoUrl = null, notes = null) {
    const response = await api.post('/attendance/check-in', {
      location: {
        latitude,
        longitude,
        accuracy,
      },
      device_id: deviceId,
      work_status: workStatus,
      photo_url: photoUrl,
      notes: notes,
    });
    
    return response.data;
  }

  /**
   * Check out with geolocation
   */
  async checkOut(latitude, longitude, accuracy, deviceId, notes = null) {
    const response = await api.post('/attendance/check-out', {
      location: {
        latitude,
        longitude,
        accuracy,
      },
      device_id: deviceId,
      notes: notes,
    });
    
    return response.data;
  }

  /**
   * Get today's attendance status
   */
  async getTodayAttendance() {
    const response = await api.get('/attendance/today');
    return response.data;
  }

  /**
   * Get attendance history
   */
  async getAttendanceHistory(page = 1, pageSize = 50, startDate = null, endDate = null) {
    const params = { page, page_size: pageSize };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await api.get('/attendance/history', { params });
    return response.data;
  }

  /**
   * Get recent attendance (last N days)
   */
  async getRecentAttendance(days = 7) {
    const response = await api.get('/attendance/recent', {
      params: { days },
    });
    return response.data;
  }

  /**
   * Get monthly summary
   */
  async getMonthlySummary(year, month) {
    const response = await api.get('/attendance/monthly-summary', {
      params: { year, month },
    });
    return response.data;
  }

  /**
   * Export attendance data
   */
  async exportAttendance(format = 'excel', startDate = null, endDate = null) {
    const params = { format };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await api.get('/attendance/export', {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  }

  /**
   * Get current geolocation
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Generate or retrieve device ID
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
      // Generate a unique device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Capture photo from camera
   */
  async capturePhoto() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use rear camera on mobile
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          // Convert to base64 for now (in production, upload to storage service)
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  }
}

export const attendanceService = new AttendanceService();
