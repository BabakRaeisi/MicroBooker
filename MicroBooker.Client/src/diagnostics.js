const CURRENT_KEY = "microbooker_profile_current";
const PREVIOUS_KEY = "microbooker_profile_previous";
const MAX_ITEMS = 50;

const trim = (items) => {
  if (items.length > MAX_ITEMS) {
    items.splice(0, items.length - MAX_ITEMS);
  }
};

const memorySnapshot = () => {
  const memory = performance?.memory;
  if (!memory) return null;

  return {
    usedMb: Math.round((memory.usedJSHeapSize / 1024 / 1024) * 10) / 10,
    totalMb: Math.round((memory.totalJSHeapSize / 1024 / 1024) * 10) / 10,
    limitMb: Math.round((memory.jsHeapSizeLimit / 1024 / 1024) * 10) / 10,
  };
};

const freshState = () => ({
  sessionId: crypto?.randomUUID?.() || String(Date.now()),
  startedAt: new Date().toISOString(),
  heartbeatAt: new Date().toISOString(),
  path: window.location.pathname,
  userAgent: navigator.userAgent,
  react: {
    commits: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
    lastPhase: null,
  },
  requests: {
    started: 0,
    completed: 0,
    failed: 0,
    inFlight: 0,
    maxInFlight: 0,
    recent: [],
  },
  longTasks: [],
  memory: [],
  errors: [],
});

let state = freshState();
let heartbeatId = null;
let longTaskObserver = null;

const persist = () => {
  try {
    state.heartbeatAt = new Date().toISOString();
    state.path = window.location.pathname;
    localStorage.setItem(CURRENT_KEY, JSON.stringify(state));
  } catch {
    // Diagnostics must never break the application.
  }
};

export const initDiagnostics = () => {
  try {
    const previous = localStorage.getItem(CURRENT_KEY);
    if (previous) localStorage.setItem(PREVIOUS_KEY, previous);
  } catch {
    // Ignore storage failures.
  }

  state = freshState();
  persist();

  heartbeatId = window.setInterval(() => {
    const memory = memorySnapshot();
    if (memory) {
      state.memory.push({
        at: new Date().toISOString(),
        ...memory,
      });
      trim(state.memory);
    }
    persist();
  }, 1000);

  if ("PerformanceObserver" in window) {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.longTasks.push({
            at: new Date().toISOString(),
            durationMs: Math.round(entry.duration * 10) / 10,
          });
        }
        trim(state.longTasks);
      });
      longTaskObserver.observe({ type: "longtask", buffered: true });
    } catch {
      // Long task observation is optional.
    }
  }

  window.addEventListener("error", (event) => {
    state.errors.push({
      at: new Date().toISOString(),
      type: "error",
      message: event.message,
      stack: event.error?.stack || null,
    });
    trim(state.errors);
    persist();
  });

  window.addEventListener("unhandledrejection", (event) => {
    state.errors.push({
      at: new Date().toISOString(),
      type: "unhandledrejection",
      message: String(event.reason?.message || event.reason || "Unknown rejection"),
      stack: event.reason?.stack || null,
    });
    trim(state.errors);
    persist();
  });

  window.microbookerProfileReport = () => ({
    current: state,
    previous: readPreviousProfile(),
  });

  return () => {
    if (heartbeatId) window.clearInterval(heartbeatId);
    longTaskObserver?.disconnect();
  };
};

export const recordReactCommit = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  state.react.commits += 1;
  state.react.totalDurationMs += actualDuration;
  state.react.maxDurationMs = Math.max(
    state.react.maxDurationMs,
    actualDuration,
  );
  state.react.lastPhase = phase;
  state.react.lastCommit = {
    id,
    actualDurationMs: Math.round(actualDuration * 100) / 100,
    baseDurationMs: Math.round(baseDuration * 100) / 100,
    startTimeMs: Math.round(startTime * 100) / 100,
    commitTimeMs: Math.round(commitTime * 100) / 100,
  };
};

export const requestStarted = (method, url) => {
  const id = crypto?.randomUUID?.() || String(Date.now() + Math.random());
  state.requests.started += 1;
  state.requests.inFlight += 1;
  state.requests.maxInFlight = Math.max(
    state.requests.maxInFlight,
    state.requests.inFlight,
  );

  state.requests.recent.push({
    id,
    method: String(method || "GET").toUpperCase(),
    url: String(url || ""),
    startedAt: new Date().toISOString(),
    status: "pending",
  });
  trim(state.requests.recent);

  return id;
};

export const requestFinished = (id, status, error = null) => {
  state.requests.completed += 1;
  state.requests.inFlight = Math.max(0, state.requests.inFlight - 1);
  if (error || Number(status) >= 400) state.requests.failed += 1;

  const request = state.requests.recent.find((item) => item.id === id);
  if (request) {
    request.finishedAt = new Date().toISOString();
    request.status = status ?? "error";
    request.error = error ? String(error?.message || error) : null;
  }

  persist();
};

export const getCurrentProfile = () => state;

export const readPreviousProfile = () => {
  try {
    const raw = localStorage.getItem(PREVIOUS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
