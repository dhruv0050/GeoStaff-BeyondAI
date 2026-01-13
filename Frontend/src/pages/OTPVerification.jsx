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
    <div style={styles.container}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        {/* Back Button */}
        <button onClick={handleBack} style={styles.backButton}>
          <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to login
        </button>

        {/* OTP Card */}
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={styles.iconWrapper}>
              <div style={styles.iconBg}>
                <svg style={{ width: '40px', height: '40px', color: '#a78bfa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
            </div>
            <h2 style={styles.title}>Verify Your Identity</h2>
            <p style={styles.subtitle}>
              Enter the 6-digit code sent to<br/>
              <span style={{ color: '#a78bfa', fontWeight: '600' }}>+91 {phone}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* OTP Input Boxes */}
            <div style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={styles.otpInput}
                  disabled={loading}
                />
              ))}
            </div>

            {/* Timer */}
            <div style={styles.timerContainer}>
              <div style={styles.timerBadge}>
                <svg style={{ width: '16px', height: '16px', color: '#a78bfa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span style={{ color: '#a3a3a3', fontSize: '0.875rem' }}>
                  Expires in <span style={{ color: '#a78bfa', fontWeight: '700' }}>{formatTime(timer)}</span>
                </span>
              </div>
            </div>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              style={{
                ...styles.button,
                opacity: loading || otp.join('').length !== 6 ? 0.6 : 1,
                cursor: loading || otp.join('').length !== 6 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            {/* Resend Link */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending}
                  style={styles.resendButton}
                >
                  <span style={{ color: '#737373' }}>Didn't receive code? </span>
                  <span style={{ color: '#a78bfa' }}>{resending ? 'Resending...' : 'Resend OTP'}</span>
                </button>
              ) : (
                <p style={{ color: '#737373', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                  Resend available in {timer}s
                </p>
              )}
            </div>
          </form>

          <div style={styles.info}>
            <p style={styles.infoText}>
              💡 <strong>Testing:</strong> OTP shown in console
            </p>
            <p style={styles.infoText}>
              🔐 Default: <strong>123456</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
    padding: '1.5rem'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    color: '#a3a3a3',
    background: 'transparent',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '2.5rem',
    padding: '0.5rem 0',
    transition: 'color 0.2s'
  },
  card: {
    background: 'rgba(20, 20, 20, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    padding: '2.5rem'
  },
  iconWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  iconBg: {
    width: '80px',
    height: '80px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: '0.75rem'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#a3a3a3',
    lineHeight: '1.5',
    fontWeight: '500'
  },
  otpContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '2rem'
  },
  otpInput: {
    width: '3.5rem',
    height: '3.5rem',
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: '700',
    background: '#1f1f1f',
    border: '2px solid #262626',
    color: '#fafafa',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s'
  },
  timerContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem'
  },
  timerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: '#171717',
    border: '1px solid #262626',
    borderRadius: '999px'
  },
  button: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '700',
    color: 'white',
    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 30px rgba(167, 139, 250, 0.3)'
  },
  error: {
    padding: '0.875rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    color: '#f87171',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '1rem'
  },
  resendButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.2s',
    padding: 0
  },
  info: {
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    padding: '1rem',
    borderRadius: '12px',
    marginTop: '1.5rem'
  },
  infoText: {
    fontSize: '0.8rem',
    color: '#a3a3a3',
    margin: '0.25rem 0',
    fontWeight: '500'
  }
};

export default OTPVerification;
