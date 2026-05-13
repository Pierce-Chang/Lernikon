"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Props for DemoPrinterAnimation. */
interface DemoPrinterAnimationProps {
  show: boolean;
}

/** Radial angles for the three star particles. */
const STAR_ANGLES = [330, 30, 90] as const;

/**
 * Overlay animation shown while the demo worksheet is "printing".
 * Honours prefers-reduced-motion: skips keyframes and shows a brief static state.
 */
export function DemoPrinterAnimation({ show }: DemoPrinterAnimationProps) {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Animation: Arbeitsblatt wird gedruckt"
          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="relative flex flex-col items-center">
            {/* Printer emoji */}
            <motion.div
              className="text-4xl leading-none select-none"
              initial={prefersReduced ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -40, scale: 0.6 }}
              animate={
                prefersReduced
                  ? { opacity: 1, y: 0, scale: 1 }
                  : {
                      opacity: [0, 1, 1, 1, 0],
                      y: [-40, 0, 0, 0, 0],
                      scale: [0.6, 1, 1, 1, 1],
                      x: [0, 0, -4, 4, -4, 4, 0, 0, 0, 0],
                    }
              }
              transition={
                prefersReduced
                  ? { duration: 0.3 }
                  : {
                      duration: 1.4,
                      times: [0, 0.25, 0.5, 0.85, 1],
                      ease: "easeOut",
                    }
              }
            >
              🖨️
            </motion.div>

            {/* PDF emoji sliding out from behind the printer */}
            {!prefersReduced && (
              <motion.div
                className="text-3xl leading-none select-none"
                initial={{ opacity: 0, y: -12, scale: 0.5 }}
                animate={{ opacity: [0, 0, 1, 1, 0], y: [-12, -12, 24, 24, 24], scale: [0.5, 0.5, 1, 1, 1] }}
                transition={{
                  duration: 1.4,
                  times: [0, 0.5, 0.75, 0.9, 1],
                  ease: "easeOut",
                }}
                style={{ marginTop: -8 }}
              >
                📄
              </motion.div>
            )}

            {/* Star burst particles */}
            {!prefersReduced &&
              STAR_ANGLES.map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const dx = Math.cos(rad) * 38;
                const dy = Math.sin(rad) * 38;
                return (
                  <motion.span
                    key={angle}
                    className="pointer-events-none absolute select-none text-xs"
                    style={{ color: "#F4B942", top: 20, left: "50%" }}
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 0, 1, 0],
                      x: [0, 0, dx, dx],
                      y: [0, 0, dy, dy],
                    }}
                    transition={{
                      duration: 1.4,
                      times: [0, 0.64, 0.85, 1],
                      delay: idx * 0.04,
                      ease: "easeOut",
                    }}
                  >
                    ✦
                  </motion.span>
                );
              })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
