import { FiCalendar, FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import { useAppContext } from "./context/AppContext";

const Header = ({ view, onViewChange, onAuthOpen }) => {
  const { isLoggedIn, userName, handleLogout, restaurant } = useAppContext();

  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-mark">MB</div>
        <div>
          <strong>MicroBooker</strong>
          <span>{restaurant?.name || "Restaurant reservations"}</span>
        </div>
      </div>

      <nav className="primary-nav" aria-label="Primary">
        <button
          type="button"
          className={view === "booking" ? "active" : ""}
          onClick={() => onViewChange("booking")}
        >
          <FiCalendar />
          Book
        </button>
        <button
          type="button"
          className={view === "admin" ? "active" : ""}
          onClick={() => onViewChange("admin")}
        >
          <FiSettings />
          Restaurant admin
        </button>
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
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
