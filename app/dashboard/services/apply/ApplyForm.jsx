"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import Link from "next/link";
import { applyForServiceAction } from "../actions";
import Alert from "@/components/ui/Alert";
import { inputClass } from "@/components/ui/Field";
import {
  MANAGED_PLATFORMS,
  MANAGED_PLATFORM_LABELS,
  PLATFORM_ACCOUNT_LABELS,
  PLATFORM_ACCOUNT_STATES,
  SERVICE_BUDGETS,
  SERVICE_CONTACT_METHODS,
  SERVICE_EXPERIENCE,
  SERVICE_SELLER_TYPES,
} from "@/lib/models/constants";

const STEPS = [
  { title: "About you", sub: "Contact details, background and your monthly budget." },
  { title: "Your accounts", sub: "Which marketplaces you want us to run, and where you're at on each." },
  { title: "Review", sub: "Check everything, add anything else, then send it to our team." },
];
/** Which step owns each field (to jump back to the first error). */
const STEP_OF = { firstName: 0, lastName: 0, email: 0, phone: 0, country: 0, method: 0, experience: 0, sellerType: 0, budget: 0, platforms: 1, goals: 2 };
const stepOf = (key) => STEP_OF[key] ?? (key.startsWith("account_") || key.startsWith("handle_") ? 1 : 2);

const Req = () => (
  <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden="true">
    *
  </span>
);

function Row({ id, label, required, error, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <Req />}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const Group = ({ title, children }) => (
  <fieldset>
    <legend className="mb-4 w-full border-b border-line pb-2 text-xs font-semibold uppercase tracking-wider text-muted">{title}</legend>
    {children}
  </fieldset>
);

/**
 * Three-step store-management application. Every step stays mounted (only
 * hidden), so going Back keeps what was typed; it submits through
 * startTransition (not <form action>) so a server error doesn't reset it.
 *
 * @param {{ defaults: { firstName: string, lastName: string, email: string, phone: string, country: string } }} props
 */
export default function ApplyForm({ defaults }) {
  const [state, formAction, pending] = useActionState(applyForServiceAction, {});
  const formRef = useRef(null);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [clientErrors, setClientErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const v = state.values ?? { ...defaults, method: "WhatsApp" };
  const [picked, setPicked] = useState(() => new Set((state.values?.platforms ?? []).map((p) => p.platform)));
  const [accounts, setAccounts] = useState(() => Object.fromEntries((state.values?.platforms ?? []).map((p) => [p.platform, p.account])));
  const [shownServerErrors, setShownServerErrors] = useState(null);

  // When a server error arrives, jump to the first step that has one.
  if (state.errors && shownServerErrors !== state) {
    setShownServerErrors(state);
    const first = Math.min(...Object.keys(state.errors).map(stepOf));
    if (Number.isFinite(first)) setStep(first);
  }
  const errors = { ...(state.errors ?? {}), ...clientErrors };
  const aria = (name) => (errors[name] ? { "aria-invalid": true, "aria-describedby": `sv-${name}-error` } : {});
  const prevHandle = (p) => state.values?.platforms?.find((x) => x.platform === p)?.handle ?? "";

  /** Light client-side checks so each step can't be skipped half-done. The server re-checks everything. */
  function check(n) {
    const fd = new FormData(formRef.current);
    const get = (k) => String(fd.get(k) ?? "").trim();
    const e = {};
    if (n === 0) {
      if (!get("firstName")) e.firstName = "Enter your first name";
      if (!get("lastName")) e.lastName = "Enter your last name";
      if (!/^\S+@\S+\.\S+$/.test(get("email"))) e.email = "Enter a valid email address";
      if (!/^\+?\d{7,15}$/.test(get("phone").replace(/[\s()-]/g, ""))) e.phone = "Enter a phone number like +92 300 1234567";
      if (get("country").length < 2) e.country = "Enter your country";
      if (!get("experience")) e.experience = "Select your e-commerce experience";
      if (!get("sellerType")) e.sellerType = "Select what best describes you";
      if (!get("budget")) e.budget = "Select your monthly budget";
    }
    if (n === 1) {
      if (!picked.size) e.platforms = "Choose at least one platform";
      for (const p of picked) {
        const acc = get(`account_${p}`);
        if (!acc) e[`account_${p}`] = "Tell us if you have an account";
        else if (acc !== "NONE" && get(`handle_${p}`).length < 2) e[`handle_${p}`] = "Add your store link or username";
      }
    }
    return e;
  }

  function go(n) {
    if (n > step) {
      for (let s = step; s < n; s++) {
        const e = check(s);
        if (Object.keys(e).length) {
          setClientErrors(e);
          setStep(s);
          return;
        }
      }
    }
    setClientErrors({});
    if (n === 2) {
      const fd = new FormData(formRef.current);
      setSummary({
        get: (k) => String(fd.get(k) ?? ""),
        platforms: MANAGED_PLATFORMS.filter((p) => picked.has(p)).map((p) => ({ p, account: String(fd.get(`account_${p}`) ?? ""), handle: String(fd.get(`handle_${p}`) ?? "") })),
      });
    }
    setStep(n);
    setReached((r) => Math.max(r, n));
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function onSubmit(e) {
    e.preventDefault();
    if (step < 2) return go(step + 1);
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  const togglePlatform = (p, on) =>
    setPicked((s) => {
      const next = new Set(s);
      if (on) next.add(p);
      else next.delete(p);
      return next;
    });

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted">Step {step + 1} of 3</p>
      <h2 className="mt-0.5 text-xl font-semibold tracking-tight">{STEPS[step].title}</h2>
      <p className="mt-1 text-sm text-muted">{STEPS[step].sub}</p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label="Application progress">
        <div className="h-full rounded-full bg-brand-600 transition-all dark:bg-brand-500" style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>
      <ol className="mt-3 grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => go(i)}
              disabled={i > reached + 1}
              aria-current={i === step ? "step" : undefined}
              className={`w-full rounded-lg px-2 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                i === step ? "bg-brand-50 font-medium text-brand-800 dark:bg-brand-950/60 dark:text-brand-200" : "bg-surface-2/70 text-muted hover:text-ink"
              }`}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-5 scroll-mt-6 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-7">
        {state.message && (
          <Alert tone="error" className="mb-5">
            {state.message}
          </Alert>
        )}

        {/* Step 1: About you */}
        <div hidden={step !== 0} className="space-y-8">
          <Group title="Contact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Row id="sv-firstName" label="First name" required error={errors.firstName}>
                <input id="sv-firstName" name="firstName" autoComplete="given-name" maxLength={40} defaultValue={v.firstName} className={inputClass} {...aria("firstName")} />
              </Row>
              <Row id="sv-lastName" label="Last name" required error={errors.lastName}>
                <input id="sv-lastName" name="lastName" autoComplete="family-name" maxLength={40} defaultValue={v.lastName} className={inputClass} {...aria("lastName")} />
              </Row>
              <Row id="sv-email" label="Email" required error={errors.email} className="sm:col-span-2">
                <input id="sv-email" name="email" type="email" autoComplete="email" maxLength={120} defaultValue={v.email} className={inputClass} {...aria("email")} />
              </Row>
              <Row id="sv-phone" label="WhatsApp / phone" required error={errors.phone}>
                <input id="sv-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="+92 300 1234567" defaultValue={v.phone} className={inputClass} {...aria("phone")} />
              </Row>
              <Row id="sv-country" label="Country" required error={errors.country}>
                <input id="sv-country" name="country" autoComplete="country-name" maxLength={60} defaultValue={v.country} className={inputClass} {...aria("country")} />
              </Row>
              <Row id="sv-method" label="Best way to reach you" error={errors.method} className="sm:col-span-2">
                <select id="sv-method" name="method" defaultValue={v.method || "WhatsApp"} className={inputClass} {...aria("method")}>
                  {SERVICE_CONTACT_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Row>
            </div>
          </Group>

          <Group title="Background">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Row id="sv-experience" label="E-commerce experience" required error={errors.experience}>
                <select id="sv-experience" name="experience" defaultValue={v.experience ?? ""} className={inputClass} {...aria("experience")}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {SERVICE_EXPERIENCE.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Row>
              <Row id="sv-sellerType" label="What best describes you?" required error={errors.sellerType}>
                <select id="sv-sellerType" name="sellerType" defaultValue={v.sellerType ?? ""} className={inputClass} {...aria("sellerType")}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {SERVICE_SELLER_TYPES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Row>
              <Row id="sv-budget" label="Monthly budget for store management" required error={errors.budget} className="sm:col-span-2">
                <select id="sv-budget" name="budget" defaultValue={v.budget ?? ""} className={inputClass} {...aria("budget")}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {SERVICE_BUDGETS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Row>
            </div>
          </Group>
        </div>

        {/* Step 2: Your accounts */}
        <div hidden={step !== 1}>
          <Group title="Platforms">
            <p className="-mt-1 mb-4 text-sm text-muted">Pick every marketplace you want us to run. No account yet? We can set it up.</p>
            {errors.platforms && (
              <p role="alert" className="mb-3 text-sm font-medium text-red-600 dark:text-red-400">
                {errors.platforms}
              </p>
            )}
            <ul className="space-y-3">
              {MANAGED_PLATFORMS.map((p) => {
                const on = picked.has(p);
                return (
                  <li key={p} className={`rounded-xl border transition-colors ${on ? "border-brand-300 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-950/30" : "border-line"}`}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                      <input type="checkbox" name="platforms" value={p} checked={on} onChange={(e) => togglePlatform(p, e.target.checked)} className="h-4 w-4 accent-brand-600" />
                      <span className="font-medium">{MANAGED_PLATFORM_LABELS[p]}</span>
                    </label>
                    {on && (
                      <div className="grid grid-cols-1 gap-4 border-t border-line px-4 py-4 sm:grid-cols-2">
                        <Row id={`sv-account_${p}`} label="Do you have an account?" required error={errors[`account_${p}`]}>
                          <select
                            id={`sv-account_${p}`}
                            name={`account_${p}`}
                            value={accounts[p] ?? ""}
                            onChange={(e) => setAccounts((a) => ({ ...a, [p]: e.target.value }))}
                            className={inputClass}
                            {...aria(`account_${p}`)}
                          >
                            <option value="" disabled>
                              Select…
                            </option>
                            {PLATFORM_ACCOUNT_STATES.map((a) => (
                              <option key={a} value={a}>
                                {PLATFORM_ACCOUNT_LABELS[a]}
                              </option>
                            ))}
                          </select>
                        </Row>
                        {accounts[p] !== "NONE" && (
                          <Row id={`sv-handle_${p}`} label="Store link or username" required error={errors[`handle_${p}`]}>
                            <input
                              id={`sv-handle_${p}`}
                              name={`handle_${p}`}
                              maxLength={200}
                              defaultValue={prevHandle(p)}
                              placeholder={p === "INSTAGRAM" || p === "TIKTOK" ? "@yourshop" : "https://…"}
                              className={inputClass}
                              {...aria(`handle_${p}`)}
                            />
                          </Row>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Group>
        </div>

        {/* Step 3: Review */}
        <div hidden={step !== 2} className="space-y-6">
          {summary && (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Name", `${summary.get("firstName")} ${summary.get("lastName")}`],
                ["Email", summary.get("email")],
                ["WhatsApp / phone", summary.get("phone")],
                ["Country", summary.get("country")],
                ["Contact by", summary.get("method")],
                ["Experience", summary.get("experience")],
                ["You are", summary.get("sellerType")],
                ["Monthly budget", summary.get("budget")],
              ].map(([k, val]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="break-words">{val}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">Platforms</dt>
                <dd>
                  <ul className="mt-1 space-y-1">
                    {summary.platforms.map((x) => (
                      <li key={x.p}>
                        <span className="font-medium">{MANAGED_PLATFORM_LABELS[x.p]}</span>
                        <span className="text-muted">
                          {" "}
                          · {PLATFORM_ACCOUNT_LABELS[x.account]}
                          {x.account !== "NONE" && x.handle ? ` · ${x.handle}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          )}
          <Row id="sv-goals" label="Anything else we should know?" error={errors.goals}>
            <textarea
              id="sv-goals"
              name="goals"
              rows={4}
              maxLength={1000}
              defaultValue={v.goals}
              placeholder="Your goals, what you sell now, problems with your stores, best days for a call…"
              className={inputClass}
              {...aria("goals")}
            />
          </Row>
          <div className="rounded-xl bg-surface-2/70 p-4 text-sm">
            <p className="font-medium">What happens next</p>
            <p className="mt-1 text-muted">
              Our team reviews your application, then books a short Google Meet call with you. After the call you get a monthly quote. Nothing starts until you agree.
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
              ‹ Back
            </button>
          ) : (
            <Link href="/dashboard/services" className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
              Cancel
            </Link>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-brand-700 px-5 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
          >
            {step < 2 ? "Continue ›" : pending ? "Sending…" : "Send application"}
          </button>
        </div>
      </form>
    </div>
  );
}
