import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import '@xterm/xterm/css/xterm.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DeloSpace Crash Boundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: '#0A0908',
          color: '#F1E9DD',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: 24,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>⚡</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#FF8038' }}>
            DeloSpace encountered an unexpected error
          </h1>
          <p style={{ fontSize: 13, color: '#8B7E72', maxWidth: 500, marginBottom: 20, fontFamily: 'monospace' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#1F1A16',
              color: '#F1E9DD',
              border: '1px solid rgba(241,233,221,0.15)',
              padding: '8px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 13
            }}
          >
            Reload Board
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
