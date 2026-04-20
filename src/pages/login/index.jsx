// src/pages/login/index.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginThunk, clearAuthError } from "../../store/authSlice";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import Input from "components/ui/Input";

const LoginPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token, loading, error } = useSelector((s) => s.auth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);

  // Already logged in → redirect
  useEffect(() => {
    if (token) navigate("/dashboard", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    return () => { dispatch(clearAuthError()); };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) return;
    const res = await dispatch(loginThunk({ username: username.trim(), password }));
    if (!res.error) navigate("/dashboard", { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Icon name="Bot" size={32} color="white" strokeWidth={2} />
          </div>
          <h1
            className="text-2xl font-bold text-center"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            GIS Robotics Inventory
          </h1>
          <p
            className="text-sm mt-1 text-center"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
          >
            Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 mb-4 rounded-lg text-sm"
              style={{
                backgroundColor: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.2)",
                color: "var(--color-error)",
                fontFamily: "var(--font-caption)",
              }}
            >
              <Icon name="AlertCircle" size={15} color="currentColor" strokeWidth={2} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-8 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                tabIndex={-1}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <Icon name={showPw ? "EyeOff" : "Eye"} size={16} color="currentColor" strokeWidth={2} />
              </button>
            </div>

            <Button
              type="submit"
              variant="default"
              fullWidth
              loading={loading}
              iconName="LogIn"
              iconPosition="left"
              className="mt-2"
            >
              Sign In
            </Button>
          </form>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
        >
          Ghana International School · Robotics Lab
        </p>
      </div>
    </div>
  );
};

export default LoginPage;