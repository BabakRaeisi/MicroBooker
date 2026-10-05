import { useState } from "react";
import { FiLock, FiUser, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { login, register } from "./services/authApi";
import { useAppContext } from "./context/AppContext";

const emptyRegister = {
  email: "",
  password: "",
  personName: "",
  gender: "Male",
};

const emptyLogin = {
  email: "",
  password: "",
};

const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const normalizeRole = (value) => {
  if (!value) return "";
  const role = String(value).toLowerCase();
  if (role === "partner") return "Partner";
  if (role === "customer") return "Customer";
  return "";
};

const AuthPanel = ({ audience = "customer", onClose }) => {
  const [mode, setMode] = useState("login");
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setIsLoggedIn, setUserName, setCurrentUser } = useAppContext();

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      const expectedRole = audience === "partner" ? "Partner" : "Customer";
      const result = await register({
        ...registerForm,
        email: registerForm.email.trim(),
        personName: registerForm.personName.trim(),
        role: expectedRole,
      });

      const token = result?.Token || result?.token || result?.accessToken || "";
      const payload = token ? decodeJwtPayload(token) : null;
      const id =
        result?.UserID ||
        result?.userId ||
        payload?.sub ||
        payload?.nameid ||
        "";
      const name =
        result?.PersonName ||
        result?.personName ||
        payload?.name ||
        registerForm.personName.trim();
      const email = result?.Email || result?.email || registerForm.email.trim();
      const role = normalizeRole(
        result?.Role || result?.role || payload?.role || expectedRole,
      );

      if (!token || !id || !role) {
        throw new Error(
          "Registration response is missing the JWT, user id, or account role.",
        );
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_id", id);
      localStorage.setItem("user_role", role);

      setIsLoggedIn(true);
      setUserName(name);
      setCurrentUser({ id, name, email, role });

      setRegisterForm(emptyRegister);
      toast.success(
        audience === "partner"
          ? "Partner account created. Set up your restaurant next."
          : "Account created",
      );
      onClose?.();
    } catch (error) {
      toast.error(error.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);

      const result = await login({
        ...loginForm,
        email: loginForm.email.trim(),
      });

      const token = result?.Token || result?.token || result?.accessToken || "";
      const payload = token ? decodeJwtPayload(token) : null;

      const id =
        result?.UserID ||
        result?.userId ||
        payload?.sub ||
        payload?.nameid ||
        payload?.[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] ||
        "";

      const name =
        result?.PersonName ||
        result?.personName ||
        payload?.name ||
        payload?.unique_name ||
        "";

      const email = result?.Email || result?.email || loginForm.email.trim();
      const role = normalizeRole(result?.Role || result?.role || payload?.role);
      const expectedRole = audience === "partner" ? "Partner" : "Customer";

      if (!token || !id || !role) {
        throw new Error(
          "Login response is missing the JWT, user id, or account role.",
        );
      }

      if (role !== expectedRole) {
        throw new Error(
          expectedRole === "Partner"
            ? "This is a customer account. Use a partner account to manage restaurants."
            : "This is a partner account. Use a customer account to make reservations.",
        );
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_id", id);
      localStorage.setItem("user_role", role);

      setIsLoggedIn(true);
      setUserName(name);
      setCurrentUser({ id, name, email, role });

      toast.success("Signed in");
      onClose?.();
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="auth-brand">
          <div className="brand-mark">MB</div>
          <div>
            <span className="eyebrow">
              {audience === "partner" ? "MicroBooker Partners" : "MicroBooker"}
            </span>
            <h2>
              {mode === "login"
                ? audience === "partner"
                  ? "Restaurant owner sign in"
                  : "Sign in to book"
                : audience === "partner"
                  ? "Create a partner account"
                  : "Create your diner account"}
            </h2>
          </div>
        </div>

        {audience === "partner" && mode === "register" && (
          <p className="auth-context-note">
            Create an account for the person who will manage the restaurant.
            You will add the restaurant name and business details after signing in.
          </p>
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="field">
              <span>Email</span>
              <div className="input-with-icon">
                <FiUser />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, email: event.target.value })
                  }
                  placeholder="you@example.com"
                />
              </div>
            </label>
            <label className="field">
              <span>Password</span>
              <div className="input-with-icon">
                <FiLock />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, password: event.target.value })
                  }
                  placeholder="Your password"
                />
              </div>
            </label>
            <button className="primary-button auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label className="field">
              <span>
                {audience === "partner" ? "Your full name" : "Full name"}
              </span>
              <input
                required
                value={registerForm.personName}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    personName: event.target.value,
                  })
                }
                placeholder={
                  audience === "partner"
                    ? "Owner or administrator name"
                    : "Your name"
                }
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, email: event.target.value })
                }
                placeholder="you@example.com"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    password: event.target.value,
                  })
                }
                placeholder="Create a password"
              />
            </label>
            <label className="field">
              <span>Gender</span>
              <select
                value={registerForm.gender}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    gender: event.target.value,
                  })
                }
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <button className="primary-button auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default AuthPanel;
