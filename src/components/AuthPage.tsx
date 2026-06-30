import { useState, FormEvent } from "react";
import { safeParseJSON, isValidAuthUser } from "../lib/auth";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import Icon from "./Icon";

interface AuthPageProps {
  onAuthSuccess: (user: any, token: string) => void;
  onClose: () => void;
}

export default function AuthPage({ onAuthSuccess, onClose }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setLoading(false);
      setErrorMsg("Supabase is not configured yet. Please provide valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY credentials.");
      return;
    }

    try {
      if (authMode === "forgot") {
        if (!email) {
          throw new Error("Email address is required for password recovery.");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg("An email containing a secure password reset link has been dispatched.");
        return;
      }

      if (authMode === "signup") {
        if (!name || !email || !password) {
          throw new Error("All credentials (name, email, password) are mandatory.");
        }

        const defaultRole = email === "tanishkchandak45@gmail.com" || email === "tanishktanishkchandak45@gmail.com" || email.includes("admin") ? "ADMIN" : "CLIENT";

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name,
              role: defaultRole,
            }
          }
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Registration completed, but no user context was retrieved. Verify your settings.");
        }

        const userProfile = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || name,
          email: data.user.email || email,
          role: data.user.user_metadata?.role || defaultRole,
        };

        const token = data.session?.access_token || "supabase-auth-session-active";

        // Insert/upsert into the public.users database table for standard SaaS data tracking
        try {
          await supabase.from("users").upsert({
            id: data.user.id,
            full_name: name,
            email: email,
          });
        } catch (dbErr) {
          console.warn("[AuthPage] Failed to register user profile into users table:", dbErr);
        }

        if (data.session) {
          onAuthSuccess(userProfile, token);
        } else {
          setSuccessMsg("Account registered successfully! Please check your email inbox to confirm your account and log in.");
        }
      } else {
        // Login mode
        if (!email || !password) {
          throw new Error("Email and password credentials are required.");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (!data.user || !data.session) {
          throw new Error("Authentication failed to establish an active database session.");
        }

        const defaultRole = email === "tanishkchandak45@gmail.com" || email === "tanishktanishkchandak45@gmail.com" || email.includes("admin") ? "ADMIN" : "CLIENT";

        const userProfile = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email,
          email: data.user.email || email,
          role: data.user.user_metadata?.role || defaultRole,
        };

        const token = data.session.access_token;

        // Upsert user details into public.users
        try {
          await supabase.from("users").upsert({
            id: data.user.id,
            full_name: userProfile.name,
            email: userProfile.email,
          });
        } catch (dbErr) {
          console.warn("[AuthPage] Failed to update user profile in users table:", dbErr);
        }

        onAuthSuccess(userProfile, token);
      }
    } catch (err: any) {
      const errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("rate limit") || errMsg.toLowerCase().includes("rate_limit") || errMsg.toLowerCase().includes("limit exceeded")) {
        setErrorMsg("Signup rate limit exceeded (Supabase allows a maximum of 3 signups per hour per IP). If you have already registered, please switch to the 'Login' tab to access your account instantly. Otherwise, please try again shortly.");
      } else {
        setErrorMsg(errMsg || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050816]/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0B1220]/80 border border-white/10 rounded-2xl p-8 relative shadow-2xl overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
          aria-label="Close authentication page"
        >
          <Icon name="X" size={20} />
        </button>

        {/* Logo Header */}
        <div className="text-center mb-8 relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/10 mb-4">
            <Icon name="Cpu" className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {authMode === "login" && "Log in to Veloce"}
            {authMode === "signup" && "Join Veloce AI"}
            {authMode === "forgot" && "Reset Password"}
          </h2>
          <p className="text-xs text-gray-400 mt-1.5">
            {authMode === "login" && "Enter credentials to access your SaaS dashboard"}
            {authMode === "signup" && "Register to lock in pricing plans & strategy meetings"}
            {authMode === "forgot" && "Input your email to recover your active session"}
          </p>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="p-4 mb-5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <Icon name="AlertCircle" className="text-red-400 shrink-0" size={18} />
            <p className="text-xs text-red-300 font-medium leading-normal">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="p-4 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
            <Icon name="CheckCircle" className="text-emerald-400 shrink-0" size={18} />
            <p className="text-xs text-emerald-300 font-medium leading-normal">{successMsg}</p>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {authMode === "signup" && (
            <div>
              <label htmlFor="auth-name-input" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Icon name="User" size={14} />
                </div>
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Liam Vance"
                  className="w-full pl-10 pr-4 py-3 bg-[#050816] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email-input" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Icon name="Mail" size={14} />
              </div>
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-3 bg-[#050816] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          {authMode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="auth-password-input" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot")}
                    className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Icon name="Lock" size={14} />
                </div>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#050816] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-cyan-400/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {authMode === "login" && "Authenticate Access"}
                  {authMode === "signup" && "Create Agency Account"}
                  {authMode === "forgot" && "Send Reset Link"}
                </span>
                <Icon name="ArrowRight" size={14} />
              </>
            )}
          </button>

          {authMode !== "forgot" && (
            <>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-[10px] uppercase font-bold tracking-wider">or</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setErrorMsg("");
                  setSuccessMsg("");
                  setLoading(true);
                  if (!isSupabaseConfigured()) {
                    setLoading(false);
                    setErrorMsg("Supabase is not configured yet.");
                    return;
                  }
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: window.location.origin,
                        scopes: "email profile",
                      },
                    });
                    if (error) throw error;
                  } catch (err: any) {
                    setErrorMsg(err.message || "An unexpected error occurred during Google Sign-In.");
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-3 bg-[#050816] hover:bg-white/5 text-white text-xs font-bold rounded-xl border border-white/10 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.111C18.29 1.92 15.54 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.742-.08-1.3-.177-1.859l-10.616-.36z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}
        </form>

        {/* Auth Mode Toggle Footer */}
        <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-gray-400 relative">
          {authMode === "login" && (
            <p>
              New to the platform?{" "}
              <button
                onClick={() => setAuthMode("signup")}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                Sign up here
              </button>
            </p>
          )}
          {authMode === "signup" && (
            <p>
              Already registered?{" "}
              <button
                onClick={() => setAuthMode("login")}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                Log in here
              </button>
            </p>
          )}
          {authMode === "forgot" && (
            <button
              onClick={() => setAuthMode("login")}
              className="font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1.5 mx-auto"
            >
              <Icon name="ArrowLeft" size={12} />
              <span>Back to Login</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
