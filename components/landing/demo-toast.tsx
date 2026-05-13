"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Props for DemoToast. */
interface DemoToastProps {
  show: boolean;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 8000;

/**
 * Fixed bottom-center toast that appears after the printer animation.
 * Auto-dismisses after 8 seconds. Honours controlled close via onClose.
 */
export function DemoToast({ show, onClose }: DemoToastProps) {
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100vw-3rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-brand px-5 py-4 shadow-2xl"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute right-3 top-3 rounded-md p-0.5 text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <X className="size-4" />
          </button>

          <p className="pr-6 font-semibold text-white">
            Fertig. So sähe dein Blatt aus.
          </p>
          <p className="mt-1 pr-6 text-sm text-white/90">
            Konto anlegen und echte PDFs für dein Kind drucken.
          </p>
          <Button
            size="sm"
            className="mt-3"
            render={<Link href="/signup" />}
          >
            Kostenlos loslegen
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
