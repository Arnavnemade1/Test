"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import clsx from "clsx";

type GlassCardProps = HTMLMotionProps<"div"> & { strong?: boolean };

export function GlassCard({ className, strong, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={clsx(strong ? "glass-strong" : "glass", "rounded-2xl", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
