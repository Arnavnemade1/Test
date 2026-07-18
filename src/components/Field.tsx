import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string };
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };

export function TextField({ label, className, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">
        {label}
      </span>
      <input
        className={clsx(
          "glass-input w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function TextAreaField({ label, className, ...props }: TextareaProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">
        {label}
      </span>
      <textarea
        className={clsx(
          "glass-input w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30",
          className,
        )}
        {...props}
      />
    </label>
  );
}
