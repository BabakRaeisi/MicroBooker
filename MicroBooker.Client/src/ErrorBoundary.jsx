import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("MicroBooker render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
          <h2>MicroBooker failed to render</h2>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
