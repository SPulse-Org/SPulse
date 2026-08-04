import React from "react";
import { FiLoader } from "react-icons/fi";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({ variant = "primary", fullWidth = false, loading = false, className, children, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-2xl font-semibold transition-transform duration-150";
  const variants: Record<Variant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "bg-transparent text-slate-200 hover:text-white",
  };

  const classes = `${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${loading ? "opacity-70 cursor-wait" : ""} ${className ?? ""}`.trim();

  return (
    <button {...rest} disabled={rest.disabled || loading} className={classes}>
      {loading && <FiLoader className="w-4 h-4 mr-2 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
