/**
 * Test Page Component
 * Tests backend API connectivity
 */
import { useState } from 'react';
import { healthService } from '../services/healthService';

const TestPage = () => {
  const [apiStatus, setApiStatus] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const healthResponse = await healthService.checkHealth();
      setApiStatus(healthResponse);
      
      const dbResponse = await healthService.checkDatabase();
      setDbStatus(dbResponse);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>GeoStaff - API Connection Test</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={testApiConnection}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {apiStatus && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#e8f5e9',
          border: '1px solid #4CAF50',
          borderRadius: '4px'
        }}>
          <h3>✓ API Status</h3>
          <pre style={{ fontSize: '0.9rem' }}>
            {JSON.stringify(apiStatus, null, 2)}
          </pre>
        </div>
      )}

      {dbStatus && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196F3',
          borderRadius: '4px'
        }}>
          <h3>✓ Database Status</h3>
          <pre style={{ fontSize: '0.9rem' }}>
            {JSON.stringify(dbStatus, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestPage;
