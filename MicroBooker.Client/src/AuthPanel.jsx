import { useState } from "react";
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

const AuthPanel = ({ onClose }) => {
  const [mode, setMode] = useState("login");
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setIsLoggedIn, setUserName, setCurrentUser } = useAppContext();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await register({
        ...registerForm,
        email: registerForm.email.trim(),
        personName: registerForm.personName.trim(),
      });
      toast.success("Registered successfully");
      setRegisterForm(emptyRegister);
      setMode("login");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const result = await login({
        ...loginForm,
        email: loginForm.email.trim(),
      });

      const token = result?.token || result?.accessToken || "";
      const payload = token ? decodeJwtPayload(token) : null;

      const user = result?.data?.user ?? result?.user ?? result ?? {};
      const id =
        user?.id ||
        user?.userId ||
        user?.customerId ||
        payload?.sub ||
        payload?.nameid ||
        payload?.[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] ||
        "";
      const name =
        user?.personName ||
        user?.userName ||
        user?.name ||
        payload?.unique_name ||
        "";
      const email = user?.email || payload?.email || loginForm.email.trim();

      if (!id) {
        toast.error(
          "Login succeeded but user id is missing in response/token.",
        );
        return;
      }

      if (token) localStorage.setItem("access_token", token);
      localStorage.setItem("user_name", name || "");
      localStorage.setItem("user_id", id);

      setIsLoggedIn(true);
      setUserName(name || "");
      setCurrentUser({ id, name: name || "", email });

      toast.success("Logged in successfully");
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-panel auth-panel-floating">
      <div className="auth-panel-header">
        <button
          type="button"
          className={`auth-toggle ${mode === "login" ? "active" : ""}`}
          onClick={() => setMode("login")}
        >
          Login
        </button>

        <button
          type="button"
          className={`auth-toggle ${mode === "register" ? "active" : ""}`}
          onClick={() => setMode("register")}
        >
          Register
        </button>

        <button type="button" className="auth-close" onClick={onClose}>
          ×
        </button>
      </div>

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            autoComplete="email"
            required
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({ ...loginForm, email: e.target.value })
            }
          />
          <input
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            required
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
          />
          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : "Login"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="auth-form">
          <input
            type="email"
            autoComplete="email"
            required
            placeholder="Email"
            value={registerForm.email}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, email: e.target.value })
            }
          />
          <input
            placeholder="Password"
            type="password"
            autoComplete="new-password"
            required
            value={registerForm.password}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, password: e.target.value })
            }
          />
          <input
            placeholder="Person Name"
            required
            value={registerForm.personName}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, personName: e.target.value })
            }
          />
          <select
            value={registerForm.gender}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, gender: e.target.value })
            }
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : "Register"}
          </button>
        </form>
      )}
    </section>
  );
};

export default AuthPanel;
