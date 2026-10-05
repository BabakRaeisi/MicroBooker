import { useEffect, useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./Header";
import CustomerHome from "./CustomerHome";
import BookingView from "./BookingView";
import AdminView from "./AdminView";
import AuthPanel from "./AuthPanel";

const App = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [authAudience, setAuthAudience] = useState(null);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restaurantId = useMemo(() => {
    const match = path.match(/^\/restaurant\/([0-9a-f-]{36})$/i);
    return match?.[1] || "";
  }, [path]);

  const isPartnerPortal = path.startsWith("/admin");

  return (
    <div className="app-shell">
      <Header
        portal={isPartnerPortal ? "partner" : "customer"}
        onNavigate={navigate}
        onAuthOpen={() =>
          setAuthAudience(isPartnerPortal ? "partner" : "customer")
        }
      />

      <main className="app-main">
        {isPartnerPortal ? (
          <AdminView
            onAuthOpen={() => setAuthAudience("partner")}
            onViewRestaurant={(id) => navigate("/restaurant/" + id)}
          />
        ) : restaurantId ? (
          <BookingView
            restaurantId={restaurantId}
            onBack={() => navigate("/")}
            onAuthOpen={() => setAuthAudience("customer")}
          />
        ) : (
          <CustomerHome
            onOpenRestaurant={(id) => navigate("/restaurant/" + id)}
          />
        )}
      </main>

      {authAudience && (
        <AuthPanel
          audience={authAudience}
          onClose={() => setAuthAudience(null)}
        />
      )}

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
