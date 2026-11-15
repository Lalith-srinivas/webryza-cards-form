import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import {
  Store,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function PartnerLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login, isAuthenticated, loading } = usePartnerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to /admin/dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectPath = location.state?.from?.pathname || "/admin/dashboard";
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password) {
      setErrorMessage("Please enter both your username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
      const redirectPath = location.state?.from?.pathname || "/admin/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0D0B] text-[#FAF7F2] flex flex-col justify-between relative overflow-hidden selection:bg-[#D4AF37] selection:text-[#0F0D0B]">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#D4AF37]/10 via-[#B8860B]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header / Navigation */}
      <header className="relative z-10 max-w-5xl mx-auto w-full px-4 py-5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-medium text-[#B5ABA0] hover:text-[#FAF7F2] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Registration Site</span>
        </Link>

        <div className="flex items-center space-x-2 text-xs text-[#8B6E32] bg-[#1C1814] px-3 py-1 rounded-full border border-[#D4AF37]/20">
          <ShieldCheck size={13} className="text-[#D4AF37]" />
          <span>Authorized Partners Only</span>
        </div>
      </header>

      {/* Login Card Container */}
      <main className="relative z-10 max-w-md mx-auto w-full px-4 py-8">
        <div className="bg-[#181512]/90 backdrop-blur-xl border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] p-[1.5px] mx-auto shadow-lg mb-3 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-[#141210] flex items-center justify-center">
                <Store size={24} className="text-[#D4AF37]" />
              </div>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#FAF7F2]">
              WebRyza Partner Portal
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#A89F91] leading-relaxed">
              Manage your wedding projects and track your payments.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="partner-username"
                className="block text-xs font-semibold text-[#D8CDBF] uppercase tracking-wider mb-1.5"
              >
                Username or Partner ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7165]">
                  <User size={16} />
                </div>
                <input
                  id="partner-username"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. SHOP001 or partner username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3.5 py-3 bg-[#0F0D0B] border border-[#2D261E] rounded-xl text-sm text-[#FAF7F2] placeholder-[#5C5449] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="partner-password"
                className="block text-xs font-semibold text-[#D8CDBF] uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7165]">
                  <Lock size={16} />
                </div>
                <input
                  id="partner-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-3 bg-[#0F0D0B] border border-[#2D261E] rounded-xl text-sm text-[#FAF7F2] placeholder-[#5C5449] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A7165] hover:text-[#FAF7F2] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center space-x-2 mt-2 ${
                isSubmitting
                  ? "bg-[#2D261E] text-[#7A7165] cursor-not-allowed"
                  : "bg-gradient-to-r from-[#D4AF37] via-[#C9972C] to-[#B8860B] hover:brightness-110 active:scale-[0.99] text-[#141210] font-bold"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-[#141210]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Login to Dashboard</span>
              )}
            </button>
          </form>

          {/* Admin Managed Note */}
          <div className="mt-6 pt-5 border-t border-[#2D261E] text-center">
            <p className="text-[11px] text-[#8C8274] leading-relaxed">
              Partner accounts are strictly issued and managed by <span className="text-[#D4AF37]">WebRyza Admin</span>. If you need credentials or password assistance, please contact your WebRyza relationship manager.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full px-4 py-4 text-center text-xs text-[#7A7165]">
        © {new Date().getFullYear()} WebRyza. All rights reserved.
      </footer>
    </div>
  );
}
