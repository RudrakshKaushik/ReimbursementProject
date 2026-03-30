import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconReceipt } from "@tabler/icons-react";
import { login } from "@/api/client";
import { useAuth } from "@context/AuthContext";
import loginHeroImage from "@/assets/login-hero.png";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    new URLSearchParams(location.search).get("returnTo") ?? "/dashboard";

  const { setAuthStatus } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);

      if (res.success) {
        setAuthStatus("authenticated");
        navigate(returnTo ?? "/dashboard", { replace: true });
      } else {
        setError(res.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left: hero image */}
        <div className="relative min-h-[240px] overflow-hidden lg:min-h-screen">
          <img
            src={loginHeroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/45 to-blue-900/35"
            aria-hidden
          />
          <div className="relative flex h-full min-h-[240px] flex-col justify-end p-8 sm:p-10 lg:justify-center lg:p-14 xl:p-16">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <IconReceipt size={28} stroke={1.75} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Expense Management
            </h1>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">
              Track reimbursements, approvals, and receipts in one place — built
              for teams that move fast.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <span className="h-px w-8 bg-slate-300" aria-hidden />
                Sign in
              </p>
            </div>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter your credentials to access your expense dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  className="block text-sm font-medium text-slate-700"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-slate-700"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                />
              </div>

              {error && (
                <p
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200/80"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
