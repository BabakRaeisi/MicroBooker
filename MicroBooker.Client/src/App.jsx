import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./Header";
import BookingView from "./BookingView";
import AdminView from "./AdminView";
import AuthPanel from "./AuthPanel";

const App = () => {
  const [view, setView] = useState("booking");
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="app-shell">
      <Header
        view={view}
        onViewChange={setView}
        onAuthOpen={() => setShowAuth(true)}
      />

      <main className="app-main">
        {view === "booking" ? (
          <BookingView onAuthOpen={() => setShowAuth(true)} />
        ) : (
          <AdminView onAuthOpen={() => setShowAuth(true)} />
        )}
      </main>

      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} />}

      <ToastContainer
        position="bottom-right"
        autoClose={2800}
        newestOnTop
        theme="light"
      />
    </div>
  );
};

export default App;
