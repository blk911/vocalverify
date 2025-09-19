"use client";
import { useEffect, useMemo, useState } from "react";

type Step = {
  id: string;
  title: string;
  blurb: string;
  bullets?: string[];
  tone?: "green" | "purple" | "blue" | "amber";
};

const toneStyles: Record<NonNullable<Step["tone"]>, string> = {
  green: "bg-green-500/10 border-green-600/20",
  purple: "bg-purple-500/10 border-purple-600/20",
  blue: "bg-blue-500/10 border-blue-600/20",
  amber: "bg-amber-500/10 border-amber-600/20",
};

const defaultSteps: Step[] = [
  {
    id: "welcome",
    title: "Welcome to AM I HUMAN",
    blurb:
      "You've joined an invite-only network built on trust and authentic relationships. This isn't social media — it's something entirely different.",
    bullets: [
      "Create verified connections with people you actually know",
      "Form Trust Units with mutual connections",
      "Secure messaging and vaults for sensitive assets",
    ],
    tone: "blue",
  },
  {
    id: "trust-bonds",
    title: "Trust Bonds",
    blurb: "Create verified one-to-one connections with real people you know and trust.",
    bullets: ["Phone + identity checks", "Mutual confirmation", "Private channel opens"],
    tone: "green",
  },
  {
    id: "trust-units",
    title: "Trust Units",
    blurb: "Form verified groups with people who share mutual connections.",
    bullets: ["Triad-based verification", "Roles & rules", "Unit-level actions"],
    tone: "purple",
  },
  {
    id: "secure-messaging",
    title: "Secure Messaging",
    blurb: "Private conversations only within your trusted network.",
    bullets: ["End-to-end intent", "Device checks", "Zero public discovery"],
    tone: "blue",
  },
  {
    id: "secure-vaults",
    title: "Secure Vaults",
    blurb: "Share sensitive documents with controlled access.",
    bullets: ["Granular permissions", "Audit trail", "Encrypted at rest"],
    tone: "amber",
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    blurb:
      "Only verified members can see your profile. All communications are encrypted. Admins can't read your messages.",
    bullets: ["Enterprise-grade security", "Minimal data", "You control visibility"],
    tone: "blue",
  },
];

export type InteractiveGuideProps = {
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
  username?: string;
  steps?: Step[];
};

export default function InteractiveGuide({
  isOpen,
  onClose,
  onFinish,
  username,
  steps = defaultSteps,
}: InteractiveGuideProps) {
  const [idx, setIdx] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const total = steps.length;
  const step = useMemo(() => steps[idx], [steps, idx]);
  const pct = Math.round(((idx + 1) / total) * 100);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  function next() {
    if (idx < total - 1) setIdx((i) => i + 1);
    else {
      if (dontShow) localStorage.setItem("aih.guide.dismissed", "1");
      onFinish?.();
      onClose();
    }
  }
  function prev() {
    if (idx > 0) setIdx((i) => i - 1);
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center p-4"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* modal */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <h2 className="text-xl font-semibold">
            {idx === 0 ? `Welcome to AM I HUMAN${username ? `, ${username}` : ""}!` : step.title}
          </h2>
          <button
            className="rounded p-2 text-black/60 hover:bg-black/5"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-5">
          <div
            className={`rounded-xl border p-4 ${step.tone ? toneStyles[step.tone] : "bg-black/5 border-black/10"}`}
          >
            <p className="text-black/80">{idx === 0 ? defaultSteps[0].blurb : step.blurb}</p>
          </div>

          {/* grid cards on first step to mirror your screenshot */}
          {idx === 0 ? (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard title="Trust Bonds" tone="green" desc="Verified connections with real people you know." />
              <FeatureCard title="Trust Units" tone="purple" desc="Verified groups built on mutual connections." />
              <FeatureCard title="Secure Messaging" tone="blue" desc="Private conversations within your network." />
              <FeatureCard title="Secure Vaults" tone="amber" desc="Controlled sharing for sensitive documents." />
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {step.bullets?.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1 text-green-600">•</span>
                  <span className="text-black/80">{b}</span>
                </li>
              ))}
            </ul>
          )}

          {/* privacy block like screenshot */}
          {idx === 0 && (
            <div className="mt-5 rounded-xl border border-black/10 p-4">
              <h3 className="font-medium">Privacy & Security</h3>
              <p className="mt-1 text-sm text-black/70">
                Your data is protected by enterprise-grade security. Only verified members can see your profile, and all communications are encrypted.
              </p>
            </div>
          )}

          {/* quick action buttons on first step */}
          {idx === 0 && (
            <div className="mt-4 flex gap-3">
              <button
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                onClick={() => setIdx(1)}
              >
                Start Interactive Guide →
              </button>
              <button
                className="px-4 py-2 rounded-md bg-black/5 hover:bg-black/10"
                onClick={() => {
                  localStorage.setItem("aih.guide.dismissed", "1");
                  onClose();
                }}
              >
                Explore on My Own
              </button>
            </div>
          )}
          {idx === 0 && (
            <p className="mt-2 text-center text-xs text-black/50">
              You can access the guide anytime from the main menu
            </p>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-black/5">
          <label className="flex items-center gap-2 text-sm text-black/70">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            Don't show this again
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="px-4 py-2 rounded-md bg-black/5 text-black/80 hover:bg-black/10 disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={next}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {idx < total - 1 ? "Next" : "Finish"}
            </button>
          </div>
        </div>

        {/* progress bar */}
        <div className="h-1 w-full bg-black/5">
          <div
            className="h-full bg-indigo-600 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  tone = "blue",
}: {
  title: string;
  desc: string;
  tone?: "green" | "purple" | "blue" | "amber";
}) {
  const map: Record<typeof tone, string> = {
    green: "bg-green-500/10 border-green-600/20",
    purple: "bg-purple-500/10 border-purple-600/20",
    blue: "bg-blue-500/10 border-blue-600/20",
    amber: "bg-amber-500/10 border-amber-600/20",
  };
  return (
    <div className={`rounded-xl border p-4 ${map[tone]}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-black/70">{desc}</div>
    </div>
  );
}



