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

    // Skip backend "send-otp" and go directly to OTP entry
    navigate('/verify-otp', { state: { phone } });
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 rounded-2xl blur-2xl opacity-30"></div>
              <div className="relative w-16 h-16 bg-[#2e5c6e] rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3 tracking-tight">GeoStaff</h1>
          <p className="text-sm text-gray-600 font-medium">Location-powered attendance, simplified</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-lg p-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-8">Welcome back</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-700 tracking-wide">Phone Number</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter your phone number"
                  className="w-full pl-16 pr-5 py-4 text-base bg-gray-50 border border-gray-300 rounded-xl text-gray-800 outline-none transition-all font-medium placeholder:text-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-50"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full py-4 text-base font-bold text-white bg-[#2e5c6e] hover:bg-[#3a7080] rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Continue'}
            </button>

            <p className="text-center text-gray-600 text-xs mt-8 font-medium">
              Protected by enterprise-grade security
            </p>

            <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl mt-2">
              <p className="text-xs text-gray-700 my-1 font-medium">
                🔐 Default: <strong>123456</strong>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
