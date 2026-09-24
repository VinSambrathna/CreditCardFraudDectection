import React, { useEffect, useState, useRef } from "react";

/**
 * AnimatedNumber
 * Smoothly interpolates numeric values on change using requestAnimationFrame
 * with Apple/Stripe-like cubic ease-out.
 */
export default function AnimatedNumber({
  value,
  duration = 600,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  style = {},
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const startTimestampRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = typeof value === "number" ? value : parseFloat(value) || 0;

    // Honor prefers-reduced-motion immediately
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || startVal === endVal) {
      setDisplayValue(endVal);
      prevValueRef.current = endVal;
      return;
    }

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const elapsed = timestamp - startTimestampRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const current = startVal + (endVal - startVal) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        prevValueRef.current = endVal;
        startTimestampRef.current = null;
      }
    };

    startTimestampRef.current = null;
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted =
    typeof displayValue === "number"
      ? displayValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : displayValue;

  return (
    <span
      className={`tabular-nums ${className}`}
      style={{
        fontVariantNumeric: "tabular-nums",
        display: "inline-block",
        ...style,
      }}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
