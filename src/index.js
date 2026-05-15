import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// =============================================
// ERROR BOUNDARY - Catches crashes and shows
// the error on screen instead of a blank page.
// This is very useful during development!
// =============================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // If hasError is true, we show the error message
    this.state = { hasError: false, error: null };
  }

  // This runs when a child component crashes
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // This logs the error to the console with more details
  componentDidCatch(error, info) {
    console.error("App crashed:", error);
    console.error("Component stack:", info.componentStack);
  }

  render() {
    // If there's an error, show it on screen instead of blank white
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "40px",
          fontFamily: "monospace",
          backgroundColor: "#fff5f5",
          minHeight: "100vh"
        }}>
          <h1 style={{ color: "#c0392b" }}>⚠️ App Crashed</h1>
          <p style={{ color: "#333", marginTop: "10px" }}>
            Something went wrong. Here is the error:
          </p>
          <pre style={{
            background: "#2c2c2c",
            color: "#ff6b6b",
            padding: "20px",
            borderRadius: "8px",
            marginTop: "20px",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <p style={{ color: "#666", marginTop: "20px" }}>
            Check the browser Console (F12) for the full stack trace.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#14b8a6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            🔄 Reload App
          </button>
        </div>
      );
    }

    // If no error, render the app normally
    return this.props.children;
  }
}

// Render the app wrapped in the error boundary
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

