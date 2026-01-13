/**
 * OTP Verification Page
 * User enters the 6-digit OTP received on phone
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;
  const inputRefs = useRef([]);

  // Redirect to login if no phone number
  useEffect(() => {
    if (!phone) {
      navigate('/');
    }
  }, [phone, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    setError('');

    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const deviceId = `web-${navigator.userAgent.slice(0, 50)}-${Date.now()}`;
      const response = await authService.verifyOTP(phone, otpString, deviceId);
      
      const userRole = response.user.role;
      switch (userRole) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'manager':
          navigate('/manager/dashboard');
          break;
        case 'employee':
          navigate('/employee/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError('');
    try {
      const response = await authService.resendOTP(phone);
      console.log('🔐 New OTP:', response.otp);
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-[#1e3a4a] to-gray-900 p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={handleBack} 
          className="flex items-center text-gray-400 hover:text-gray-300 bg-transparent border-none text-base font-medium cursor-pointer mb-10 py-2 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to login
        </button>

        {/* OTP Card */}
        <div className="bg-gray-800/70 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-10">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-50 mb-3">Verify Your Identity</h2>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              Enter the 6-digit code sent to<br/>
              <span className="text-cyan-400 font-semibold">+91 {phone}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-bold bg-gray-900/80 border-2 border-gray-700 text-gray-50 rounded-xl outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-50"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/80 border border-gray-700 rounded-full">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-gray-400 text-sm">
                  Expires in <span className="text-cyan-400 font-bold">{formatTime(timer)}</span>
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-4 text-base font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-600 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/40 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            {/* Resend Link */}
            <div className="text-center mt-5">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending}
                  className="bg-transparent border-none text-sm font-semibold cursor-pointer transition-colors p-0"
                >
                  <span className="text-gray-500">Didn't receive code? </span>
                  <span className="text-cyan-400 hover:text-cyan-300">{resending ? 'Resending...' : 'Resend OTP'}</span>
                </button>
              ) : (
                <p className="text-gray-500 text-sm font-medium m-0">
                  Resend available in {timer}s
                </p>
              )}
            </div>
          </form>

          <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl mt-6">
            <p className="text-xs text-gray-400 my-1 font-medium">
              💡 <strong>Testing:</strong> OTP shown in console
            </p>
            <p className="text-xs text-gray-400 my-1 font-medium">
              🔐 Default: <strong>123456</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
