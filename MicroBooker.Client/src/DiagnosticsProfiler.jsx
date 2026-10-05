import { Profiler, useEffect, useState } from "react";
import {
  getCurrentProfile,
  readPreviousProfile,
  recordReactCommit,
} from "./diagnostics";

const mb = (value) =>
  typeof value === "number" ? value.toFixed(1) + " MB" : "n/a";

const DiagnosticsPanel = () => {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      forceRender((value) => value + 1);
    }, 500);

    return () => window.clearInterval(id);
  }, []);

  const current = getCurrentProfile();
  const previous = readPreviousProfile();
  const memory = current.memory.at(-1);

  const copyReport = async () => {
    const report = JSON.stringify(
      {
        current,
        previous,
      },
      null,
      2,
    );

    await navigator.clipboard?.writeText(report);
  };

  return (
    <aside className="diagnostics-panel">
      <strong>MicroBooker profiler</strong>
      <span>Heap: {mb(memory?.usedMb)} / {mb(memory?.limitMb)}</span>
      <span>
        React: {current.react.commits} commits · max{" "}
        {current.react.maxDurationMs.toFixed(1)} ms
      </span>
      <span>
        API: {current.requests.inFlight} in flight ·{" "}
        {current.requests.started} started · {current.requests.failed} failed
      </span>
      <span>Long tasks: {current.longTasks.length}</span>
      <span>Errors: {current.errors.length}</span>
      <button type="button" onClick={copyReport}>
        Copy profiler report
      </button>
    </aside>
  );
};

const DiagnosticsProfiler = ({ children }) => {
  const enabled = new URLSearchParams(window.location.search).has("profile");

  return (
    <>
      <Profiler id="MicroBooker" onRender={recordReactCommit}>
        {children}
      </Profiler>
      {enabled && <DiagnosticsPanel />}
    </>
  );
};

export default DiagnosticsProfiler;
