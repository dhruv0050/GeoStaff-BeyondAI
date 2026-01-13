/**
 * Attendance Component
 * Check-in/Check-out with mandatory photo capture via camera
 */
import { useState, useEffect, useRef } from 'react';
import { attendanceService } from '../services/attendanceService';

const AttendanceWidget = ({ onAttendanceChange }) => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [location, setLocation] = useState(null);
  const [workStatus, setWorkStatus] = useState('office');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch today's attendance status
  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await attendanceService.getTodayAttendance();
      console.log('Attendance data received:', data);
      setTodayAttendance(data);
      
      // Notify parent component
      if (onAttendanceChange) {
        onAttendanceChange(data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setError('Failed to load attendance data. Please try again.');
      // Retry after 2 seconds
      setTimeout(() => {
        fetchTodayAttendance();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const fetchLocation = async () => {
    try {
      const loc = await attendanceService.getCurrentLocation();
      setLocation(loc);
      setError('');
    } catch (err) {
      console.error('Location error:', err);
      setError('Unable to get your location. Please enable location services.');
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    fetchLocation();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  // Capture photo from camera
  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      // Convert canvas to blob and create data URL
      canvasRef.current.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedPhoto(reader.result);
          stopCamera();
          setShowCameraModal(false);
        };
        reader.readAsDataURL(blob);
      });
    }
  };

  // Open camera modal
  const openCameraModal = async () => {
    setShowCameraModal(true);
    setCameraActive(false);
    
    // Small delay to ensure modal renders and video element is in DOM
    setTimeout(async () => {
      try {
        setError('');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            setCameraActive(true);
          }).catch(err => {
            console.error('Play error:', err);
          });
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Unable to access camera. Please enable camera permissions.');
        setShowCameraModal(false);
        setCameraActive(false);
      }
    }, 100);
  };

  // Close camera modal
  const closeCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null);
    openCameraModal();
  };

  // Calculate hours worked
  const calculateHoursWorked = () => {
    if (!todayAttendance?.check_in) return '0.0';
    
    const checkInTime = new Date(todayAttendance.check_in.timestamp);
    const currentTime = todayAttendance.check_out 
      ? new Date(todayAttendance.check_out.timestamp)
      : new Date();
    
    const hours = (currentTime - checkInTime) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  const canCheckIn = todayAttendance?.status === 'not-started';
  const canCheckOut = todayAttendance?.status === 'checked-in';
  const isCheckedOut = todayAttendance?.status === 'checked-out';

  // Handle check-in
  const handleCheckIn = async () => {
    if (!location) {
      setError('Location not available. Please enable location services.');
      return;
    }

    if (!capturedPhoto) {
      setError('Photo is required. Please capture a photo.');
      return;
    }

    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const deviceId = attendanceService.getDeviceId();
      const response = await attendanceService.checkIn(
        location.latitude,
        location.longitude,
        location.accuracy,
        workStatus,
        deviceId,
        capturedPhoto,
        notes || null
      );

      setSuccess(response.message);
      setCapturedPhoto(null);
      setNotes('');
      
      // Wait a moment then refresh attendance data
      setTimeout(() => {
        fetchTodayAttendance();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!location) {
      setError('Location not available. Please enable location services.');
      return;
    }

    if (!capturedPhoto) {
      setError('Photo is required. Please capture a photo.');
      return;
    }

    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const deviceId = attendanceService.getDeviceId();
      const response = await attendanceService.checkOut(
        location.latitude,
        location.longitude,
        location.accuracy,
        deviceId,
        notes || null
      );

      setSuccess(response.message);
      setCapturedPhoto(null);
      setNotes('');
      
      // Wait a moment then refresh attendance data
      setTimeout(() => {
        fetchTodayAttendance();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Attendance Status</h3>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isCheckedOut 
              ? 'bg-gray-100 text-gray-700'
              : canCheckOut
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {isCheckedOut ? 'Checked Out' : canCheckOut ? 'Checked In' : 'Not Started'}
          </span>
        </div>

        {/* Hours Worked & Check-in Time */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Hours Worked</p>
            <p className="text-3xl font-bold text-teal-700">{calculateHoursWorked()}</p>
          </div>
          
          {todayAttendance?.check_in && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Check-in Time</p>
              <p className="text-xl font-bold text-gray-800">
                {new Date(todayAttendance.check_in.timestamp).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'Asia/Kolkata'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Location Info */}
        {location && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Location Captured</p>
                <p className="text-xs text-blue-700 mt-1">
                  Lat: {location.latitude.toFixed(6)} | Lng: {location.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-blue-700">Accuracy: ±{location.accuracy?.toFixed(0)}m</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Check-in Controls */}
        {canCheckIn && (
          <div className="space-y-4">
            {/* Work Status Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Work Location</label>
              <div className="grid grid-cols-3 gap-3">
                {['office', 'site', 'remote'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setWorkStatus(status)}
                    className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                      workStatus === status
                        ? 'bg-teal-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Capture - Mandatory */}
            <div>
              {capturedPhoto ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border-2 border-green-400 bg-green-50">
                    <img src={capturedPhoto} alt="Captured" className="w-full h-auto" />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Photo Captured
                    </div>
                  </div>
                  <button
                    onClick={retakePhoto}
                    className="w-full text-sm font-semibold text-teal-600 hover:text-teal-700 py-2 border border-teal-600 rounded-xl hover:bg-teal-50"
                  >
                    Retake Photo
                  </button>
                </div>
              ) : (
                <button
                  onClick={openCameraModal}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Capture Photo (Required)
                </button>
              )}
            </div>

            {/* Notes */}
            <div>
              <input
                type="text"
                placeholder="Add notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            {/* Check-in Button */}
            <button
              onClick={handleCheckIn}
              disabled={actionLoading || !location || !capturedPhoto}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {actionLoading ? 'Checking In...' : 'Check In'}
            </button>
          </div>
        )}

        {/* Check-out Controls */}
        {canCheckOut && (
          <div className="space-y-4">
            {/* Photo Capture - Mandatory */}
            <div>
              {capturedPhoto ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border-2 border-green-400 bg-green-50">
                    <img src={capturedPhoto} alt="Captured" className="w-full h-auto" />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Photo Captured
                    </div>
                  </div>
                  <button
                    onClick={retakePhoto}
                    className="w-full text-sm font-semibold text-teal-600 hover:text-teal-700 py-2 border border-teal-600 rounded-xl hover:bg-teal-50"
                  >
                    Retake Photo
                  </button>
                </div>
              ) : (
                <button
                  onClick={openCameraModal}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Capture Photo (Required)
                </button>
              )}
            </div>

            {/* Notes */}
            <div>
              <input
                type="text"
                placeholder="Add notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            {/* Check-out Button */}
            <button
              onClick={handleCheckOut}
              disabled={actionLoading || !location || !capturedPhoto}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {actionLoading ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>
        )}

        {/* Already Checked Out */}
        {isCheckedOut && (
          <div className="text-center py-4">
            <p className="text-gray-600">
              You have completed your work for today. Total hours: <strong>{todayAttendance.hours_worked?.toFixed(1)}h</strong>
            </p>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-teal-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Capture Photo</h3>
              <button
                onClick={closeCameraModal}
                className="text-white hover:bg-teal-700 p-1 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
            {/* Camera Feed */}
            <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 3v4a1 1 0 001 1h1m-6 0a9 9 0 0118 0m0 0a9 9 0 01-18 0m6-9a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1V3z"/>
                    </svg>
                    <p className="text-gray-600 font-semibold">Starting Camera...</p>
                  </div>
                </div>
              )}
            </div>

              {/* Hidden Canvas */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Capture Button */}
              <button
                onClick={handleCapturePhoto}
                disabled={!cameraActive}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                📸 Capture Photo
              </button>

              {/* Cancel Button */}
              <button
                onClick={closeCameraModal}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceWidget;
