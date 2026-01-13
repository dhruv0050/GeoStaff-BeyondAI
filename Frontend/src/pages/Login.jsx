/**
 * Login Page
 * User enters phone number to receive OTP
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate phone number
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendOTP(phone);
      
      // Show OTP in console for testing (MVP only)
      console.log('🔐 OTP:', response.otp);
      
      // Navigate to OTP verification page
      navigate('/verify-otp', { state: { phone } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove non-digit characters
    const cleaned = value.replace(/\D/g, '');
    // Limit to 10 digits
    return cleaned.slice(0, 10);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  return (
    <div style={styles.container}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        {/* Brand Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoGlow}></div>
              <div style={styles.logo}>
                <svg style={{ width: '36px', height: '36px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
            </div>
          </div>
          <h1 style={styles.title}>GeoStaff</h1>
          <p style={styles.subtitle}>Location-powered attendance, simplified</p>
        </div>

        {/* Login Card */}
        <div style={styles.card}>
          <h2 style={styles.formTitle}>Welcome back</h2>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <div style={styles.inputWrapper}>
                <span style={styles.countryCode}>+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter your phone number"
                  style={styles.input}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              style={{
                ...styles.button,
                opacity: loading || phone.length < 10 ? 0.6 : 1,
                cursor: loading || phone.length < 10 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <p style={styles.footer}>
              Protected by enterprise-grade security
            </p>

            <div style={styles.info}>
              <p style={styles.infoText}>
                💡 <strong>Testing:</strong> OTP shown in console
              </p>
              <p style={styles.infoText}>
                🔐 Default: <strong>123456</strong>
              </p>
            </div>
          </form>
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
  card: {
    background: 'rgba(20, 20, 20, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  logoWrapper: {
    position: 'relative'
  },
  logoGlow: {
    position: 'absolute',
    inset: 0,
    background: '#8b5cf6',
    borderRadius: '16px',
    filter: 'blur(40px)',
    opacity: 0.5
  },
  logo: {
    position: 'relative',
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4)'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#fafafa',
    margin: '0 0 0.75rem 0',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#a3a3a3',
    margin: 0,
    fontWeight: '500'
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: '2rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#d4d4d4',
    letterSpacing: '0.01em'
  },
  inputWrapper: {
    position: 'relative'
  },
  countryCode: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#a3a3a3',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  input: {
    width: '100%',
    paddingLeft: '64px',
    paddingRight: '20px',
    paddingTop: '1rem',
    paddingBottom: '1rem',
    fontSize: '1rem',
    background: '#171717',
    border: '1px solid #262626',
    borderRadius: '12px',
    color: '#fafafa',
    outline: 'none',
    transition: 'all 0.2s',
    fontWeight: '500'
  },
  inputFocus: {
    border: '1px solid #8b5cf6',
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)'
  },
  button: {
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '700',
    color: 'white',
    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 30px rgba(167, 139, 250, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  },
  buttonActive: {
    transform: 'scale(0.98)'
  },
  error: {
    padding: '0.875rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    color: '#f87171',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  info: {
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    padding: '1rem',
    borderRadius: '12px',
    marginTop: '0.5rem'
  },
  infoText: {
    fontSize: '0.8rem',
    color: '#a3a3a3',
    margin: '0.25rem 0',
    fontWeight: '500'
  },
  footer: {
    textAlign: 'center',
    color: '#737373',
    fontSize: '0.75rem',
    marginTop: '2rem',
    fontWeight: '500'
  }
};

export default Login;
