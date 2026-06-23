import { FormEvent, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, studentLogin } from "../../api/userApi";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../../styles/LoginPage.css";
import logo from "../../assets/logo.png";

export default function LoginPage() {
  const [role, setRole] = useState<"Admin" | "Student">("Admin");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const loadingRef = useRef(false);

  const getErrorMessage = (err: any): string => {
    if (err?.response?.data) {
      const data = err.response.data;
      if (typeof data === "string") return data;
      if (data.error) return data.error;
      if (data.message) return data.message;
    }
    if (err?.response?.status === 400) return "Invalid email or password.";
    if (err?.response?.status === 401) return "Unauthorized. Please login again.";
    if (err?.response?.status === 403) return "Access denied.";
    if (err?.response?.status === 500) return "Something went wrong. Please try again.";
    if (err.message) return err.message;
    return "Unable to sign in.";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loadingRef.current) return;
    setError("");

    if (role === "Admin") {
      if (!email.trim() || !password) {
        setError("Please enter both email and password.");
        return;
      }
      setLoading(true);
      loadingRef.current = true;
      try {
        const user = await loginUser(email, password);
        auth.login(user);
        navigate("/dashboard");
      } catch (err: any) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    } else {
      if (!studentId.trim() || !password) {
        setError("Please enter both Student ID and password.");
        return;
      }
      const id = parseInt(studentId, 10);
      if (isNaN(id)) {
        setError("Student ID must be a number.");
        return;
      }
      setLoading(true);
      loadingRef.current = true;
      try {
        const user = await studentLogin(id, password);
        auth.login(user);
        toast("Student login successful.", "success");
        navigate("/student/dashboard");
      } catch (err: any) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  };

  return (
    <div className="loginShell">
      <div className="loginCard">
        <div className="loginLeft">
          <div className="loginLeftText">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              Welcome to
              <img src={logo} alt="SaHo" style={{ height: 32, width: 'auto', display: 'inline-block' }} />
              Foundation
            </h2>
            <p>Supporting students through education,<br />opportunity, and hope.</p>
          </div>
        </div>
        <form className="loginRight" onSubmit={submit}>
          <div className="segmentedControl">
            <button
              type="button"
              className={`segOption ${role === "Admin" ? "active" : ""}`}
              onClick={() => setRole("Admin")}
            >
              Admin
            </button>
            <button
              type="button"
              className={`segOption ${role === "Student" ? "active" : ""}`}
              onClick={() => setRole("Student")}
            >
              Student
            </button>
          </div>
          <h1>Welcome back, {role === "Admin" ? "Admin" : "Student"}</h1>
          <div className="field">
            <label>{role === "Admin" ? "Email" : "Student ID"}</label>
            <input
              className="input"
              value={role === "Admin" ? email : studentId}
              onChange={(e) => role === "Admin" ? setEmail(e.target.value) : setStudentId(e.target.value)}
              placeholder={role === "Admin" ? "Enter your email" : "Enter your Student ID"}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="passwordField">
              <input
                className="input passwordInput"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              {password && (
                <button
                  type="button"
                  className="passwordToggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              )}
            </div>
            <p className="passwordHint">
              {role === "Student" && (
                <> Password: Date of Birth <strong>(DDMMYYYY)</strong></>
              )}
            </p>
          </div>
          <div className="errorContainer">
            {error && <div className="errorMessage">{error}</div>}
          </div>
          <Button type="submit" disabled={loading} className="btnGreen loginSignInBtn">
            <span className={`spinner ${loading ? '' : 'spinnerHidden'}`} />
            Sign In<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Button>
        </form>
      </div>
    </div>
  );
}
