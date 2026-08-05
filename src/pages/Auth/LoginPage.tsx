import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Copy, Eye, EyeOff, HelpCircle, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { login } from "@/api/auth";
import { getAccessToken } from "@/api/axios";

type LocationState = { from?: { pathname?: string } };

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? "support@iotiq.example.com";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [copied, setCopied] = useState(false);
  const isDevelopment = import.meta.env.DEV;
  const seededAdminEmail = import.meta.env.VITE_SEEDED_ADMIN_EMAIL ?? "admin@iotiq.example.com";

  useEffect(() => emailRef.current?.focus(), []);

  if (getAccessToken()) return <Navigate to="/dashboard" replace />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Enter your work email address.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    setError("");
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password, rememberMe);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname || "/dashboard", { replace: true });
    } catch (requestError) {
      const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined;
      setError(status === 401 || status === 403
        ? "We couldn't verify those credentials. Please try again."
        : "Unable to reach the sign-in service. Please try again shortly.");
    } finally {
      setSubmitting(false);
    }
  };

  const useSeededEmail = async () => {
    setEmail(seededAdminEmail);
    setFieldErrors(current => ({ ...current, email: undefined }));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
    await navigator.clipboard?.writeText(seededAdminEmail).catch(() => undefined);
  };

  return (
    <main className="relative min-h-screen bg-[#f7f4ed] text-brand-text lg:grid lg:grid-cols-[minmax(420px,46%)_1fr]">
      <div className="pointer-events-none absolute left-[27%] right-[17%] top-[calc(50%-295px)] z-10 hidden h-px bg-[#d1ad71] lg:block" aria-hidden="true">
        <span className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full border-2 border-[#d1ad71] bg-brand-forest" />
        <span className="absolute left-[33%] -top-1 h-2 w-2 rounded-full bg-[#d1ad71] shadow-[0_0_0_6px_rgba(209,173,113,.12)]" />
      </div>
      <section className="relative hidden overflow-hidden bg-brand-forest px-10 py-12 text-[#f8f5ed] lg:flex lg:min-h-screen lg:flex-col xl:px-16">
        <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
          <div className="absolute -left-20 top-28 h-72 w-72 animate-float-slow rounded-full border border-[#d1ad71]/30" />
          <div className="absolute left-28 top-36 h-3 w-3 animate-float-slow rounded-full bg-[#d1ad71] shadow-[0_0_0_9px_rgba(209,173,113,.10)]" style={{ animationDelay: "1.1s" }} />
          <div className="absolute left-0 top-[47%] h-px w-[74%] bg-[#d1ad71]/50" />
          <div className="absolute right-[21%] top-[38%] h-[22%] w-px bg-[#d1ad71]/35" />
          <div className="absolute right-[19.7%] top-[60%] h-2.5 w-2.5 animate-float-slow rounded-full bg-[#d1ad71]" style={{ animationDelay: "2.3s" }} />
          <div className="absolute -bottom-24 right-4 h-72 w-72 rounded-full border border-[#f8f5ed]/10" />
        </div>

        <div className="relative flex animate-fade-in-up items-center gap-3 text-sm font-bold tracking-[0.16em]">
          <span className="grid h-9 w-9 place-items-center border border-[#d1ad71] text-[#d1ad71]">IQ</span>
          IOTIQ
        </div>
        <div className="relative my-auto max-w-md pb-14 pt-24">
          <p className="mb-5 animate-fade-in-up text-xs font-bold uppercase tracking-[0.2em] text-[#d1ad71]" style={{ animationDelay: "80ms" }}>Vendor operations, in control</p>
          <h1 className="animate-fade-in-up font-[Geist_Variable] text-4xl font-medium leading-[1.08] tracking-[-0.045em] xl:text-5xl" style={{ animationDelay: "160ms" }}>
            Know the signal.<br />Move with confidence.
          </h1>
          <p className="mt-6 max-w-sm animate-fade-in-up text-sm leading-7 text-[#dce4da]" style={{ animationDelay: "240ms" }}>
            One secure workspace for your vendor records, compliance documents, and fleet intelligence.
          </p>
          <div className="mt-10 flex animate-fade-in-up items-center gap-3 text-sm text-[#dce4da]" style={{ animationDelay: "320ms" }}>
            <span className="h-px w-10 bg-[#d1ad71]" />
            <span>Built for accountable operations</span>
          </div>
        </div>
        <p className="relative text-xs text-[#bfcfc1]">Internal operations console · India</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <span className="grid h-9 w-9 place-items-center bg-brand-forest text-xs font-bold tracking-wide text-[#f8f5ed]">IQ</span>
            <span className="text-sm font-extrabold tracking-[0.16em] text-brand-forest">IOTIQ</span>
          </div>
          <div className="mb-8 flex items-center gap-4 lg:pl-20">
            <span className="relative h-px w-12 bg-brand-gold" aria-hidden="true"><span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-brand-gold" /></span>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold-dark">Secure access</p>
          </div>
          <header className="animate-fade-in-up">
            <h2 className="font-[Geist_Variable] text-4xl font-medium tracking-[-0.045em] text-brand-forest">Welcome back.</h2>
            <p className="mt-3 text-sm leading-6 text-brand-muted">Sign in to continue to your operations workspace.</p>
          </header>

          <form className="mt-9 space-y-5" noValidate onSubmit={submit}>
            {error && (
              <div role="alert" className="flex animate-fade-in-up items-start gap-2.5 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-brand-forest">Work email</label>
              <div className={`flex items-center border bg-white transition focus-within:border-brand-forest focus-within:ring-2 focus-within:ring-brand-forest/15 ${fieldErrors.email ? "border-red-600" : "border-brand-border"}`}>
                <Mail size={18} className="ml-4 shrink-0 text-brand-muted" aria-hidden="true" />
                <input ref={emailRef} id="email" name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} className="w-full bg-transparent px-3 py-3.5 text-sm outline-none" placeholder="name@company.com" disabled={submitting} />
              </div>
              {fieldErrors.email && <p id="email-error" className="mt-1.5 text-xs font-semibold text-red-700">{fieldErrors.email}</p>}
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "140ms" }}>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold text-brand-forest">Password</label>
                <button type="button" onClick={() => setShowForgotHelp(value => !value)} className="text-xs font-bold text-brand-gold-dark underline decoration-brand-gold underline-offset-4 hover:text-brand-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest">
                  Forgot password?
                </button>
              </div>
              <div className={`flex items-center border bg-white transition focus-within:border-brand-forest focus-within:ring-2 focus-within:ring-brand-forest/15 ${fieldErrors.password ? "border-red-600" : "border-brand-border"}`}>
                <LockKeyhole size={18} className="ml-4 shrink-0 text-brand-muted" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyUp={e => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLockOn(false)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : capsLockOn ? "password-capslock" : undefined}
                  className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                  placeholder="Enter your password"
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowPassword(value => !value)} className="mr-3 grid h-9 w-9 shrink-0 place-items-center text-brand-muted transition hover:text-brand-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password
                ? <p id="password-error" className="mt-1.5 text-xs font-semibold text-red-700">{fieldErrors.password}</p>
                : capsLockOn && <p id="password-capslock" className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-gold-dark"><AlertTriangle size={13} aria-hidden="true" />Caps Lock is on.</p>}

              {showForgotHelp && (
                <div className="mt-3 flex animate-fade-in-up items-start gap-2.5 border-l-2 border-brand-gold bg-[#f3ede1] px-4 py-3 text-xs leading-5 text-brand-text">
                  <HelpCircle size={15} className="mt-0.5 shrink-0 text-brand-gold-dark" aria-hidden="true" />
                  <span>Password resets are handled by your workspace administrator. Reach out at <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline decoration-brand-gold underline-offset-2">{SUPPORT_EMAIL}</a> for help regaining access.</span>
                </div>
              )}
            </div>
            <label className="flex animate-fade-in-up items-center gap-2.5 text-sm text-brand-text" style={{ animationDelay: "180ms" }}>
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 shrink-0 rounded-none border-brand-border text-brand-forest accent-brand-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest" />
              Keep me signed in on this device
            </label>
            <button type="submit" disabled={submitting} className="mt-2 flex w-full animate-fade-in-up items-center justify-center gap-2 bg-brand-forest px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest disabled:cursor-not-allowed disabled:opacity-65" style={{ animationDelay: "220ms" }}>
              {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {submitting ? "Signing in…" : "Sign in securely"}
            </button>
          </form>

          {isDevelopment && <aside className="mt-7 animate-fade-in-up border-l-2 border-brand-gold bg-[#f3ede1] px-4 py-3 text-sm leading-6 text-brand-text">
            <strong className="font-bold text-brand-forest">Local development access</strong>
            <p className="mt-1">Seeded administrator: <span className="font-semibold">{seededAdminEmail}</span>. The local backend seed password is <span className="font-semibold">Admin@123</span>.</p>
            <button type="button" onClick={() => void useSeededEmail()} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand-forest underline decoration-brand-gold underline-offset-4 hover:text-brand-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest">
              <Copy size={14} aria-hidden="true" />{copied ? "Email copied and added to form" : "Use seeded email"}
            </button>
          </aside>}
          <p className="mt-7 flex animate-fade-in-up gap-2 text-xs leading-5 text-brand-muted"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-forest" aria-hidden="true" />Your session is protected and access is logged for operational security.</p>
        </div>
      </section>
    </main>
  );
}
