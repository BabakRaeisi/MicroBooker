import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Tables from "./Tables";
import AuthPanel from "./AuthPanel";

const App = () => {
  const [showAuthPanel, setShowAuthPanel] = useState(false);

  return (
    <main>
      <Navbar
        onAuthToggle={() => setShowAuthPanel((v) => !v)}
        showAuthPanel={showAuthPanel}
        authPanel={<AuthPanel onClose={() => setShowAuthPanel(false)} />}
      />
      <Sidebar />
      <Tables />
      <ToastContainer position="top-right" autoClose={2500} />
    </main>
  );
};

export default App;
