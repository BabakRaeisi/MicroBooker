import "@vitejs/plugin-react/preamble";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import ErrorBoundary from "./ErrorBoundary";

const rootElement = document.getElementById("root");

const showStartupError = (error) => {
  console.error("MicroBooker startup error:", error);

  if (rootElement) {
    rootElement.innerHTML = `
      <main style="padding:2rem;font-family:system-ui">
        <h2>MicroBooker failed to start</h2>
        <pre style="white-space:pre-wrap;margin-top:1rem"></pre>
      </main>
    `;

    const pre = rootElement.querySelector("pre");
    if (pre) {
      pre.textContent = String(error?.stack || error);
    }
  }
};

try {
  const [{ default: App }, { AppProvider }] = await Promise.all([
    import("./App"),
    import("./context/AppContext"),
  ]);

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AppProvider>
          <App />
        </AppProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
} catch (error) {
  showStartupError(error);
}
