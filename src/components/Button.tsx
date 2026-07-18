"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import clsx from "clsx";

type Variant = "primary" | "ghost" | "danger";

type ButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & { variant?: Variant };

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[#7c9dff] to-[#a78bfa] text-[#05050c] font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "glass-input text-white/90 hover:bg-white/10",
  danger:
    "bg-red-500/15 border border-red-400/30 text-red-200 hover:bg-red-500/25",
};

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.97 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        "rounded-xl px-5 py-2.5 text-sm transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
