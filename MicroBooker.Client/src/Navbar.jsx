import { links, social } from "./data";
import { useAppContext } from "./context/AppContext";

const Navbar = ({ onAuthToggle, showAuthPanel, authPanel }) => {
  const { isLoggedIn, userName, handleLogout } = useAppContext();

  return (
    <nav className="nav">
      <div className="nav-center">
        <div className="nav-header">
          <h4 className="nav-logo">MicroBooker</h4>
        </div>

        <ul className="nav-links">
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.url}>{link.text}</a>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <ul className="nav-social">
            {social.map((item) => (
              <li key={item.id}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.icon}
                </a>
              </li>
            ))}
          </ul>

          <div className="auth-anchor">
            <button
              type="button"
              className="btn nav-login-btn"
              onClick={isLoggedIn ? handleLogout : onAuthToggle}
            >
              {isLoggedIn ? userName || "Account" : "Login / Register"}
            </button>

            {showAuthPanel && authPanel}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
