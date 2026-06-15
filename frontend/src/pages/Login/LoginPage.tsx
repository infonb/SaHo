import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/userApi";
import Button from "../../components/common/Button";
import { LeafLogo } from "../../components/layout/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

export default function LoginPage() {
  const [role, setRole] = useState<"Admin" | "Student">("Admin");
  const [email, setEmail] = useState("admin@sahofoundation.org");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (role === "Student") {
      toast("Student portal coming soon.", "success");
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await loginUser(email, password);
      auth.login(user, token);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="loginShell">
      <div className="loginCard">
        <div className="loginLeft">
          <div className="brand">
            <LeafLogo />
            <div>
              <div className="brandName">SaHo</div>
              <div className="brandSub">Sapling of Hope</div>
            </div>
          </div>
          <h2>Empowering single-parent families through education.</h2>
          <p style={{ color: "var(--br-300)", fontSize: 13 }}>
            Admin tools for sponsorships, students, volunteers, and access
            management.
          </p>
          <div
            style={{ marginTop: "auto", color: "var(--br-300)", fontSize: 12 }}
          >
            © 2025 SaHo Foundation
          </div>
        </div>
        <form className="loginRight" onSubmit={submit}>
          <div className="tabs">
            <button
              type="button"
              className={`tab ${role === "Admin" ? "active" : ""}`}
              onClick={() => setRole("Admin")}
            >
              Admin
            </button>
            <button
              type="button"
              className={`tab ${role === "Student" ? "active" : ""}`}
              onClick={() => setRole("Student")}
            >
              Student
            </button>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)" }}>
            {role === "Admin" ? "Welcome back, Admin" : "Student Login"}
          </h1>
          <div className="field">
            <label>{role === "Admin" ? "Email" : "Student ID"}</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="toast error" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
          <Button loading={loading} style={{ width: "100%", marginTop: 18 }}>
            Sign In -&gt;
          </Button>
          <p className="sub">Demo: admin@sahofoundation.org / any password</p>
        </form>
      </div>
    </div>
  );
}
