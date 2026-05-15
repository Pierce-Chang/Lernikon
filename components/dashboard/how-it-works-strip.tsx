"use client";

/*
 * The three Step animations below are sequential state-machines: each phase
 * (cursor moves, then click, then highlight, then fade) must wait for the
 * previous phase to finish. `Promise.all` is used wherever sub-steps run in
 * parallel within one phase. The cross-phase awaits inside `while (!cancelled)`
 * are intentional, not a Promise.all candidate.
 */
/* eslint-disable no-await-in-loop */

import { useRef, useEffect } from "react";
import { motion, useReducedMotion, useInView, useAnimate } from "framer-motion";
import { Settings, FileText, Printer } from "lucide-react";

// ---------------------------------------------------------------------------
// Shared cursor SVG element
// ---------------------------------------------------------------------------

/** Standard arrow-pointer cursor rendered as inline SVG. */
function CursorIcon() {
  return (
    <svg
      width="16"
      height="22"
      viewBox="0 0 16 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
    >
      <path
        d="M1 1L1 17L5 13L8.5 20L10.5 19L7 12L13 12L1 1Z"
        fill="#1E4A7C"
        stroke="white"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Modul wählen
// ---------------------------------------------------------------------------

/** Animates a cursor clicking the "Einmaleins" tile, then resets. */
function Step1Animation({ isInView }: { isInView: boolean }) {
  const prefersReduced = useReducedMotion();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (prefersReduced || !isInView) return;

    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        // Reset to initial state
        await animate("#cursor1", { opacity: 0, x: 80, y: 70 }, { duration: 0 });
        await animate("#tile-rechnen", {
          borderColor: "#e2e8f0",
          boxShadow: "none",
          backgroundColor: "#ffffff",
          scale: 1,
        }, { duration: 0 });

        if (cancelled) break;

        // t=0–0.2: cursor fade-in
        await animate("#cursor1", { opacity: 1 }, { duration: 0.2 });
        if (cancelled) break;

        // t=0.2–0.9: cursor moves to tile centre
        await animate("#cursor1", { x: 18, y: 22 }, { duration: 0.7, ease: "easeInOut" });
        if (cancelled) break;

        // t=0.9–1.1: click press (cursor scale + tile highlight)
        await Promise.all([
          animate("#cursor1", { scale: [1, 0.85, 1] }, { duration: 0.2 }),
          animate("#tile-rechnen", {
            borderColor: "#F4B942",
            boxShadow: "0 0 0 2px #F4B942",
            backgroundColor: "#FFF9EC",
          }, { duration: 0.2 }),
        ]);
        if (cancelled) break;

        // t=1.1–1.6: tile bounce
        await animate("#tile-rechnen", { scale: [1, 1.04, 1] }, { duration: 0.5 });
        if (cancelled) break;

        // t=1.6–2.4: fade everything out
        await Promise.all([
          animate("#cursor1", { opacity: 0 }, { duration: 0.4 }),
          animate("#tile-rechnen", {
            borderColor: "#e2e8f0",
            boxShadow: "none",
            backgroundColor: "#ffffff",
            scale: 1,
          }, { duration: 0.4 }),
        ]);
        if (cancelled) break;

        // t=2.4–3.4: pause
        await new Promise<void>((res) => { setTimeout(res, 1000); });
      }
    };

    void run();

    return () => { cancelled = true; };
  }, [isInView, prefersReduced, animate]);

  // Reduced-motion: show final active state statically.
  if (prefersReduced) {
    return (
      <div className="absolute inset-x-4 top-10 grid grid-cols-2 gap-1.5">
        {(["Einmaleins", "Buchstaben", "Muster", "Rechnen"] as const).map((label) => (
          <div
            key={label}
            className="h-8 rounded-md border px-2 py-1 text-[8px] text-slate-700"
            style={
              label === "Rechnen"
                ? { borderColor: "#F4B942", boxShadow: "0 0 0 2px #F4B942", backgroundColor: "#FFF9EC" }
                : { borderColor: "#e2e8f0", backgroundColor: "#ffffff" }
            }
          >
            {label}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={scope} className="absolute inset-x-4 top-10 grid grid-cols-2 gap-1.5">
      {(["Einmaleins", "Buchstaben", "Muster", "Rechnen"] as const).map((label) => (
        <div
          key={label}
          id={label === "Rechnen" ? "tile-rechnen" : undefined}
          className="h-8 rounded-md border px-2 py-1 text-[8px] text-slate-700"
          style={{
            borderColor: "#e2e8f0",
            backgroundColor: "#ffffff",
            boxShadow: "none",
          }}
        >
          {label}
        </div>
      ))}
      <motion.div
        id="cursor1"
        className="pointer-events-none absolute bottom-2 right-2"
        style={{ opacity: 0 }}
      >
        <CursorIcon />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Einstellungen
// ---------------------------------------------------------------------------

/** Animates cursor toggling count pills, class toggle, enabling the Erstellen button. */
function Step2Animation({ isInView }: { isInView: boolean }) {
  const prefersReduced = useReducedMotion();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (prefersReduced || !isInView) return;

    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        // Reset
        await animate("#cursor2", { opacity: 0, x: 176, y: 22 }, { duration: 0 });
        await animate("#pill-8", { backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }, { duration: 0 });
        await animate("#pill-12", { backgroundColor: "#1E4A7C", color: "#ffffff", borderColor: "#1E4A7C" }, { duration: 0 });
        await animate("#pill-16", { backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }, { duration: 0 });
        await animate("#toggle-3", { backgroundColor: "#1E4A7C", color: "#ffffff", borderColor: "#1E4A7C" }, { duration: 0 });
        await animate("#toggle-4", { backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }, { duration: 0 });
        await animate("#erstellen-btn", { opacity: 0.6 }, { duration: 0 });

        if (cancelled) break;

        // t=0–0.2: cursor appears right of pill row
        await animate("#cursor2", { opacity: 1 }, { duration: 0.2 });
        if (cancelled) break;

        // t=0.2–0.7: cursor to pill-16 (rightmost in centered Anzahl row)
        await animate("#cursor2", { x: 156, y: 26 }, { duration: 0.5, ease: "easeInOut" });
        if (cancelled) break;

        // t=0.7–0.9: click — 16 active, 12 inactive
        await Promise.all([
          animate("#cursor2", { scale: [1, 0.85, 1] }, { duration: 0.2 }),
          animate("#pill-16", { backgroundColor: "#1E4A7C", color: "#ffffff", borderColor: "#1E4A7C" }, { duration: 0.15 }),
          animate("#pill-12", { backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }, { duration: 0.15 }),
        ]);
        if (cancelled) break;

        // t=0.9–1.4: cursor to toggle-4 (right toggle in centered Rechenart row)
        await animate("#cursor2", { x: 140, y: 74 }, { duration: 0.5, ease: "easeInOut" });
        if (cancelled) break;

        // t=1.4–1.6: click Rechenart — minus active, plus inactive
        await Promise.all([
          animate("#cursor2", { scale: [1, 0.85, 1] }, { duration: 0.2 }),
          animate("#toggle-4", { backgroundColor: "#1E4A7C", color: "#ffffff", borderColor: "#1E4A7C" }, { duration: 0.15 }),
          animate("#toggle-3", { backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }, { duration: 0.15 }),
        ]);
        if (cancelled) break;

        // t=1.6–1.9: cursor to Erstellen button (centered). Button opacity 0.6 → 1
        await Promise.all([
          animate("#cursor2", { x: 120, y: 110 }, { duration: 0.3, ease: "easeInOut" }),
          animate("#erstellen-btn", { opacity: 1 }, { duration: 0.3 }),
        ]);
        if (cancelled) break;

        // t=1.9–2.1: click button
        await Promise.all([
          animate("#cursor2", { scale: [1, 0.85, 1] }, { duration: 0.2 }),
          animate("#erstellen-btn", { scale: [1, 0.95, 1] }, { duration: 0.2 }),
        ]);
        if (cancelled) break;

        // t=2.1–2.8: fade out everything
        await animate("#cursor2", { opacity: 0 }, { duration: 0.4 });
        if (cancelled) break;

        // t=2.8–3.6: pause
        await new Promise<void>((res) => { setTimeout(res, 800); });
      }
    };

    void run();

    return () => { cancelled = true; };
  }, [isInView, prefersReduced, animate]);

  // Reduced-motion: show final enabled state.
  if (prefersReduced) {
    return (
      <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-medium text-slate-500">Anzahl</span>
          <div className="flex gap-1">
            {(["8", "12", "16"] as const).map((v) => (
              <div
                key={v}
                className="h-5 rounded-md border px-2 text-[8px] flex items-center"
                style={
                  v === "16"
                    ? { backgroundColor: "#1E4A7C", color: "#ffffff", borderColor: "#1E4A7C" }
                    : { backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }
                }
              >
                {v}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-medium text-slate-500">Rechenart</span>
          <div className="flex gap-1">
            {(["+", "-"] as const).map((v) => (
              <div
                key={v}
                className="h-5 rounded-md border px-2 text-[8px] flex items-center"
                style={
                  v === "-"
                    ? { backgroundColor: "#1E4A7C", color: "#ffffff", borderColor: "#1E4A7C" }
                    : { backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }
                }
              >
                {v}
              </div>
            ))}
          </div>
        </div>
        <div
          className="h-7 w-24 rounded-lg text-[10px] font-medium flex items-center justify-center"
          style={{ backgroundColor: "#F4B942", color: "#1E4A7C" }}
        >
          Erstellen
        </div>
      </div>
    );
  }

  return (
    <div ref={scope} className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
      {/* Anzahl row */}
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-medium text-slate-500">Anzahl</span>
        <div className="flex gap-1">
          <motion.div id="pill-8" className="h-5 rounded-md border px-2 text-[8px] flex items-center" style={{ backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }}>8</motion.div>
          <motion.div id="pill-12" className="h-5 rounded-md border px-2 text-[8px] flex items-center" style={{ backgroundColor: "#1E4A7C", color: "#ffffff", borderColor: "#1E4A7C" }}>12</motion.div>
          <motion.div id="pill-16" className="h-5 rounded-md border px-2 text-[8px] flex items-center" style={{ backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }}>16</motion.div>
        </div>
      </div>

      {/* Rechenart row */}
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-medium text-slate-500">Rechenart</span>
        <div className="flex gap-1">
          <motion.div id="toggle-3" className="h-5 rounded-md border px-2 text-[8px] flex items-center" style={{ backgroundColor: "#1E4A7C", color: "#ffffff", borderColor: "#1E4A7C" }}>+</motion.div>
          <motion.div id="toggle-4" className="h-5 rounded-md border px-2 text-[8px] flex items-center" style={{ backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }}>-</motion.div>
        </div>
      </div>

      {/* Erstellen button */}
      <motion.div
        id="erstellen-btn"
        className="h-7 w-24 rounded-lg text-[10px] font-medium flex items-center justify-center"
        style={{ backgroundColor: "#F4B942", color: "#1E4A7C", opacity: 0.6 }}
      >
        Erstellen
      </motion.div>

      {/* Cursor */}
      <motion.div
        id="cursor2"
        className="pointer-events-none absolute left-0 top-0"
        style={{ opacity: 0, x: 170, y: 22 }}
      >
        <CursorIcon />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Drucken
// ---------------------------------------------------------------------------

/** Printed page SVG drawn under the printer icon. */
function PrintedPage() {
  return (
    <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="17" height="23" rx="1.5" fill="white" stroke="#cbd5e1" />
      <line x1="3" y1="7" x2="15" y2="7" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="3" y1="12" x2="15" y2="12" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="3" y1="17" x2="15" y2="17" stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  );
}

/** Animates the Settings -> FileText -> Printer sequence. */
function Step3Animation({ isInView }: { isInView: boolean }) {
  const prefersReduced = useReducedMotion();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (prefersReduced || !isInView) return;

    let cancelled = false;
    // Cumulative spin counter so the gear never snaps back to 0 between loop
    // iterations. Framer-motion treats `animate({ rotate: 360 })` as a no-op
    // when the live value is already 360; bumping the target each loop makes
    // every spin a fresh animation, which is what makes the rotation visible
    // on every iteration instead of just the first one.
    let spinTarget = 0;

    const run = async () => {
      while (!cancelled) {
        // Reset everything except the spin counter so the gear keeps turning.
        await animate("#step3-settings", { opacity: 1 }, { duration: 0 });
        await animate("#step3-filtext", { opacity: 0, scale: 0.4 }, { duration: 0 });
        await animate("#step3-printer", { opacity: 0 }, { duration: 0 });
        await animate("#step3-page", { opacity: 0, y: -10 }, { duration: 0 });
        await animate("#step3-pulse", { opacity: 0, scale: 1 }, { duration: 0 });

        if (cancelled) break;

        // Settings spins another 360° with a snappy easeOut, pulse ring runs in sync.
        spinTarget += 360;
        await Promise.all([
          animate("#step3-settings", { rotate: spinTarget }, { duration: 0.6, ease: "easeOut" }),
          animate("#step3-pulse", { opacity: [0, 1, 0], scale: [1, 1.8, 1] }, { duration: 0.6, ease: "easeOut" }),
        ]);
        if (cancelled) break;

        // t=1.2–1.4: Settings fades out
        await animate("#step3-settings", { opacity: 0 }, { duration: 0.2 });
        if (cancelled) break;

        // t=1.2–1.55: FileText appears
        await animate("#step3-filtext", { opacity: 1, scale: 1 }, { duration: 0.35, ease: "easeOut" });
        if (cancelled) break;

        // Hold: keep PDF visible long enough to read it before it floats up.
        await new Promise<void>((res) => { setTimeout(res, 700); });
        if (cancelled) break;

        // FileText floats up + Printer fades in
        await Promise.all([
          animate("#step3-filtext", { y: -20, opacity: 0 }, { duration: 0.4, ease: "easeIn" }),
          animate("#step3-printer", { opacity: 1 }, { duration: 0.3 }),
        ]);
        if (cancelled) break;

        // t=2.1: Printer scale bump (swallow feedback)
        await animate("#step3-printer", { scale: [1, 1.05, 1] }, { duration: 0.25 });
        if (cancelled) break;

        // t=2.2–2.8: printed page slides out below printer
        await animate("#step3-page", { opacity: 1, y: 16 }, { duration: 0.5, ease: "easeOut" });
        if (cancelled) break;

        // t=2.8–3.8: pause
        await new Promise<void>((res) => { setTimeout(res, 1000); });
      }
    };

    void run();

    return () => { cancelled = true; };
  }, [isInView, prefersReduced, animate]);

  // Reduced-motion: show static end state — printer + page below.
  if (prefersReduced) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Printer size={40} stroke="#1E4A7C" />
        <PrintedPage />
      </div>
    );
  }

  return (
    <div ref={scope} className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Pulse ring behind settings icon */}
      <motion.div
        id="step3-pulse"
        className="absolute"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "2px solid #F4B942",
          opacity: 0,
        }}
      />

      {/* Settings icon */}
      <motion.div id="step3-settings" style={{ opacity: 1 }}>
        <Settings size={40} stroke="#1E4A7C" />
      </motion.div>

      {/* FileText icon (positioned over settings) */}
      <motion.div
        id="step3-filtext"
        className="absolute flex flex-col items-center"
        style={{ opacity: 0, scale: 0.4 }}
      >
        <FileText size={40} stroke="#1E4A7C" />
        {/* PDF badge */}
        <span
          className="absolute -bottom-1 -right-1 rounded px-1 text-white"
          style={{ fontSize: 6, backgroundColor: "#ef4444" }}
        >
          PDF
        </span>
      </motion.div>

      {/* Printer icon */}
      <motion.div id="step3-printer" className="absolute" style={{ opacity: 0 }}>
        <Printer size={40} stroke="#1E4A7C" />
      </motion.div>

      {/* Printed page emerging below printer */}
      <motion.div
        id="step3-page"
        className="absolute"
        style={{ opacity: 0, y: -10, top: "calc(50% + 16px)" }}
      >
        <PrintedPage />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step card specialisations
// ---------------------------------------------------------------------------

function Step1Card() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.4 });
  return (
    <div ref={ref} className="relative aspect-4/3 min-h-53 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="absolute left-3 top-3 z-10 flex size-6 items-center justify-center rounded-full bg-[#F4B942] text-[10px] font-bold text-[#1E4A7C]">
        01
      </div>
      <Step1Animation isInView={isInView} />
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <p className="text-xs font-medium text-slate-700">Thema wählen</p>
        <p className="text-[10px] text-slate-500">Klick auf ein Übungsblatt.</p>
      </div>
    </div>
  );
}

function Step2Card() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.4 });
  return (
    <div ref={ref} className="relative aspect-4/3 min-h-53 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="absolute left-3 top-3 z-10 flex size-6 items-center justify-center rounded-full bg-[#F4B942] text-[10px] font-bold text-[#1E4A7C]">
        02
      </div>
      <Step2Animation isInView={isInView} />
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <p className="text-xs font-medium text-slate-700">Einstellungen</p>
        <p className="text-[10px] text-slate-500">Rechenart, Anzahl, Stil.</p>
      </div>
    </div>
  );
}

function Step3Card() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.4 });
  return (
    <div ref={ref} className="relative aspect-4/3 min-h-53 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="absolute left-3 top-3 z-10 flex size-6 items-center justify-center rounded-full bg-[#F4B942] text-[10px] font-bold text-[#1E4A7C]">
        03
      </div>
      <Step3Animation isInView={isInView} />
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <p className="text-xs font-medium text-slate-700">PDF drucken</p>
        <p className="text-[10px] text-slate-500">Fertig in Sekunden.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/** Three-step animated explainer strip for the Dashboard page. */
export function HowItWorksStrip() {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        So funktioniert&apos;s
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Step1Card />
        <Step2Card />
        <Step3Card />
      </div>
    </section>
  );
}
