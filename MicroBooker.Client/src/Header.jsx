import {
  FiArrowLeft,
  FiHome,
  FiLogOut,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { useAppContext } from "./context/AppContext";

const Header = ({ portal, onNavigate, onAuthOpen }) => {
  const { isLoggedIn, userName, handleLogout } = useAppContext();
  const isPartner = portal === "partner";

  return (
    <header className={"app-header " + (isPartner ? "partner-header" : "")}>
      <button
        type="button"
        className="brand-button"
        onClick={() => onNavigate(isPartner ? "/admin" : "/")}
      >
        <div className="brand-mark">MB</div>
        <div className="brand-copy">
          <strong>{isPartner ? "MicroBooker Partners" : "MicroBooker"}</strong>
          <span>
            {isPartner
              ? "Restaurant management"
              : "Discover restaurants. Book a table."}
          </span>
        </div>
      </button>

      <nav className="portal-nav" aria-label="Primary">
        {isPartner ? (
          <button type="button" onClick={() => onNavigate("/")}>
            <FiArrowLeft />
            Back to MicroBooker
          </button>
        ) : (
          <>
            <button type="button" onClick={() => onNavigate("/")}>
              <FiHome />
              Explore
            </button>
            <button type="button" onClick={() => onNavigate("/admin")}>
              <FiSettings />
              Restaurant partners
            </button>
          </>
        )}
      </nav>

      <div className="account-actions">
        {isLoggedIn ? (
          <>
            <div className="signed-in-user">
              <FiUser />
              <span>{userName || "Signed in"}</span>
            </div>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              <FiLogOut />
              Sign out
            </button>
          </>
        ) : (
          <button type="button" className="primary-button" onClick={onAuthOpen}>
            <FiUser />
            {isPartner ? "Partner sign in" : "Sign in"}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
