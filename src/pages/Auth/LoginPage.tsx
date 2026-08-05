import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Eye,
  EyeOff,
  FileCheck,
  HelpCircle,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { login } from "@/api/auth";
import { getAccessToken } from "@/api/axios";

/**
 * Palette (inline literals so this file stays drop-in; promote to brand tokens when convenient):
 *   forest  #0A1813 → #1C4030   brand side, lit from the top-left
 *   paper   #FFFFFF             form side
 *   ink     #16231D             headings, primary action
 *   muted   #6E7A74             secondary text
 *   line    #E4E4E0             field borders
 *   brass   #C8A249             brand accent
 */

type LocationState = { from?: { pathname?: string } };

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? "support@iotiq.example.com";

const CAPABILITIES = [
  {
    icon: Building2,
    title: "Vendor records, unified",
    copy: "Profiles, contacts, and contracts held in one place instead of five inboxes.",
  },
  {
    icon: FileCheck,
    title: "Compliance you can see",
    copy: "Track documents and renewal dates before anything lapses.",
  },
  {
    icon: Activity,
    title: "Fleet intelligence in context",
    copy: "Device health sits next to the vendor accountable for it.",
  },
];

const labelClass = "mb-2 block text-[13px] font-medium text-[#16231D]";
const fieldShell =
  "flex items-center rounded-[8px] border bg-white transition duration-200 hover:border-[#D3D3CE] focus-within:border-[#16231D] focus-within:ring-4 focus-within:ring-[#16231D]/10";
const fieldInput =
  "w-full bg-transparent px-3 py-2.5 text-sm text-[#16231D] caret-[#16231D] outline-none placeholder:text-[#A6A6A2] disabled:cursor-not-allowed " +
  // Chrome/Safari paint a blue block over autofilled inputs; the inset shadow covers it
  // in the field's own white, and the 9999s transition stops it flashing back on focus.
  "autofill:[-webkit-box-shadow:inset_0_0_0_1000px_#ffffff] autofill:[-webkit-text-fill-color:#16231D] " +
  "autofill:[transition:background-color_9999s_ease-in-out_0s] " +
  "hover:autofill:[-webkit-box-shadow:inset_0_0_0_1000px_#ffffff] " +
  "focus:autofill:[-webkit-box-shadow:inset_0_0_0_1000px_#ffffff] " +
  "active:autofill:[-webkit-box-shadow:inset_0_0_0_1000px_#ffffff]";

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

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  if (getAccessToken()) return <Navigate to="/dashboard" replace />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Enter your work email address.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Use the format name@company.com.";
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
      setError(
        status === 401 || status === 403
          ? "That email and password don't match an account. Check both and try again."
          : "Can't reach the sign-in service. Check your connection, then try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#16231D] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ─────────────  Brand side  ───────────── */}
      <section className="relative hidden overflow-hidden bg-[#0A1813] text-[#EDF2EC] lg:flex lg:min-h-screen lg:flex-col lg:px-14 lg:py-12 xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(95% 75% at 10% 4%, #1C4030 0%, #12291F 46%, #0A1813 100%)",
          }}
        />

        {/* Signal rings — an IoT node, broadcasting. The one flourish on the page. */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-[14%]">
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C8A249]" />
          {[0, 1, 2].map(ring => (
            <span
              key={ring}
              className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-[#C8A249]/25 motion-reduce:animate-none"
              style={{ animationDuration: "6s", animationDelay: `${ring * 2}s` }}
            />
          ))}
          <span className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C8A249]/10" />
          <span className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C8A249]/[0.06]" />
        </div>

        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#C8A249]/60 text-[12px] font-semibold tracking-wide text-[#C8A249]">
            IQ
          </span>
          <span className="text-sm font-semibold tracking-[0.16em]">IOTIQ</span>
        </div>

        <div className="relative my-auto max-w-xl pb-10 pt-20">
          <span
            className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D9BE7C] motion-reduce:animate-none"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8A249]" />
            Vendor operations platform
          </span>

          <h1
            className="mt-7 animate-fade-in-up font-[Geist_Variable] text-[44px] font-medium leading-[1.04] tracking-[-0.035em] motion-reduce:animate-none xl:text-[54px]"
            style={{ animationDelay: "80ms" }}
          >
            Every vendor,
            <br />
            every document,
            <br />
            <span className="text-[#C8A249]">every device.</span>
          </h1>

          <p
            className="mt-6 max-w-md animate-fade-in-up text-[15px] leading-7 text-[#B9C9BE] motion-reduce:animate-none"
            style={{ animationDelay: "150ms" }}
          >
            IOTIQ holds your records, compliance status, and fleet telemetry in one workspace, so
            your team can see what needs attention and act on it the same day.
          </p>

          <ul className="mt-12 max-w-md space-y-6">
            {CAPABILITIES.map(({ icon: Icon, title, copy }, index) => (
              <li
                key={title}
                className="flex animate-fade-in-up gap-4 motion-reduce:animate-none"
                style={{ animationDelay: `${220 + index * 70}ms` }}
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-white/12 bg-white/[0.05] text-[#C8A249]">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-[#EDF2EC]">{title}</span>
                  <span className="mt-1 block text-[13px] leading-6 text-[#93A79A]">{copy}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[#7C9186]">Internal operations console · India</p>
      </section>

      {/* ─────────────  Sign-in side  ───────────── */}
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 flex items-center justify-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#16231D] text-[12px] font-semibold tracking-wide text-[#C8A249]">
              IQ
            </span>
            <span className="text-sm font-semibold tracking-[0.16em] text-[#16231D]">IOTIQ</span>
          </div>

          <header className="animate-fade-in-up text-center motion-reduce:animate-none">
            <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A6D22]">
              <span className="h-px w-5 bg-[#C8A249]/70" aria-hidden="true" />
              Secure access
              <span className="h-px w-5 bg-[#C8A249]/70" aria-hidden="true" />
            </span>
            <h2 className="mt-3.5 font-[Geist_Variable] text-[22px] font-semibold leading-tight tracking-[-0.01em]">
              Sign in
            </h2>
            <p className="mx-auto mt-2 max-w-[290px] text-sm leading-6 text-[#6E7A74]">
              Use your IOTIQ work account to continue.
            </p>
          </header>

          <form className="mt-8 space-y-5" noValidate aria-busy={submitting} onSubmit={submit}>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[8px] border border-[#E7C9C5] bg-[#FBF0EE] px-4 py-3 text-[13px] leading-5 text-[#8A2822]"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className={labelClass}>
                Work email
              </label>
              <div className={`${fieldShell} ${fieldErrors.email ? "border-[#C0524B]" : "border-[#E4E4E0]"}`}>
                <Mail size={16} className="ml-3.5 shrink-0 text-[#9A978B]" aria-hidden="true" />
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={fieldInput}
                  placeholder="name@company.com"
                  disabled={submitting}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-2 text-xs text-[#B0463F]">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <label htmlFor="password" className="text-[13px] font-medium text-[#16231D]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotHelp(value => !value)}
                  aria-expanded={showForgotHelp}
                  className="rounded text-[13px] text-[#6E7A74] transition duration-200 hover:text-[#16231D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A249]"
                >
                  Forgot password?
                </button>
              </div>
              <div className={`${fieldShell} ${fieldErrors.password ? "border-[#C0524B]" : "border-[#E4E4E0]"}`}>
                <LockKeyhole size={16} className="ml-3.5 shrink-0 text-[#9A978B]" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onKeyUp={e => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLockOn(false)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "password-error" : capsLockOn ? "password-capslock" : undefined
                  }
                  className={fieldInput}
                  placeholder="Enter your password"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  className="mr-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-[#8E8B80] transition duration-200 hover:bg-[#F4F4F2] hover:text-[#16231D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A249]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p id="password-error" className="mt-2 text-xs text-[#B0463F]">
                  {fieldErrors.password}
                </p>
              ) : (
                capsLockOn && (
                  <p id="password-capslock" className="mt-2 flex items-center gap-1.5 text-xs text-[#8A6D22]">
                    <AlertTriangle size={13} aria-hidden="true" />
                    Caps Lock is on.
                  </p>
                )
              )}

              {showForgotHelp && (
                <div className="mt-3 flex items-start gap-2.5 rounded-[8px] bg-[#F6F6F4] px-4 py-3 text-xs leading-5 text-[#55605A]">
                  <HelpCircle size={15} className="mt-0.5 shrink-0 text-[#8A9490]" aria-hidden="true" />
                  <span>
                    Your workspace administrator resets passwords. Email{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="font-medium text-[#16231D] underline decoration-[#C8A249] underline-offset-2"
                    >
                      {SUPPORT_EMAIL}
                    </a>{" "}
                    to get back in.
                  </span>
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#55605A]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded-[3px] border-[#D9D9D5] accent-[#16231D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A249]"
              />
              Keep me signed in on this device
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#16231D] px-5 py-3 text-sm font-medium text-white transition duration-200 hover:bg-[#22362D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A249] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 flex items-center justify-center gap-2 border-t border-[#ECECE9] pt-6 text-xs text-[#8A9490]">
            <ShieldCheck size={14} className="shrink-0" aria-hidden="true" />
            Sessions are protected and access is logged.
          </p>
        </div>
      </section>
    </main>
  );
}