"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Reusable mount-fade primitives. Honours prefers-reduced-motion automatically
 * (motion variants collapse to a no-op when reduced-motion is requested).
 *
 * Usage:
 *   <FadeInStagger>
 *     <FadeInItem><h1>Title</h1></FadeInItem>
 *     <FadeInItem><p>Body</p></FadeInItem>
 *   </FadeInStagger>
 *
 *   <FadeIn delay={0.1}><div>Hello</div></FadeIn>
 */

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const STAGGER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const FadeIn = ({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: FADE_UP.hidden,
        show: { ...(FADE_UP.show as object), transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
};

export const FadeInStagger = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={STAGGER}
    >
      {children}
    </motion.div>
  );
};

export const FadeInItem = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={FADE_UP}>
      {children}
    </motion.div>
  );
};
