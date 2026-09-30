import React from "react";

/**
 * EmblemMark
 * Disciplined, architectural single-hue/dual-facet geometric shield mark.
 * Replaces the multi-orb blend-mode AI slop with a razor-sharp institutional mark.
 */
export function EmblemMark({ size = 32, className = "", color = "var(--cobalt)", leftFacetColor }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, display: "block" }}
    >
      {/* Left Shield Facet */}
      <path
        d="M16 3L5 7.2V15.8C5 22.5 9.7 27.8 16 29.5V3Z"
        fill={leftFacetColor || "var(--text-1)"}
      />
      {/* Right Shield Facet */}
      <path
        d="M16 3L27 7.2V15.8C27 22.5 22.3 27.8 16 29.5V3Z"
        fill={color}
      />
      {/* Minimalist Keyhole / Core Node */}
      <circle cx="16" cy="14.5" r="2.8" fill="#FFFFFF" />
      <path
        d="M16 17.3V21"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BrandLogo({
  variant = "horizontal", // 'horizontal' | 'mark' | 'stacked' | 'badge'
  emblemSize = 30,
  inverted = false,
  textColor,
  subtitleColor,
  color = "var(--cobalt)",
  leftFacetColor,
  onClick,
}) {
  const resolvedLeftFacet = leftFacetColor || (inverted ? "rgba(255, 255, 255, 0.9)" : "var(--text-1)");
  const resolvedTextColor = textColor || (inverted ? "#FFFFFF" : "var(--text-1)");
  const resolvedSubColor = subtitleColor || (inverted ? "rgba(255, 255, 255, 0.65)" : "var(--text-3)");

  if (variant === "mark") {
    return (
      <div
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        <EmblemMark size={emblemSize} color={color} leftFacetColor={resolvedLeftFacet} />
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 8px 3px 6px",
          borderRadius: 20,
          background: inverted ? "rgba(255, 255, 255, 0.12)" : "rgba(37, 99, 235, 0.08)",
          border: `1px solid ${inverted ? "rgba(255, 255, 255, 0.2)" : "rgba(37, 99, 235, 0.2)"}`,
          cursor: onClick ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        <EmblemMark size={emblemSize || 16} color={color} leftFacetColor={resolvedLeftFacet} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: resolvedTextColor,
          }}
        >
          Sentinel<span style={{ color: color }}>Pay</span>
        </span>
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          cursor: onClick ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        <EmblemMark size={emblemSize * 1.4} color={color} leftFacetColor={resolvedLeftFacet} />
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: resolvedTextColor,
              lineHeight: 1.1,
            }}
          >
            Sentinel<span style={{ color: color }}>Pay</span>
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: resolvedSubColor,
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              marginTop: 3,
            }}
          >
            Risk Evaluation Engine
          </div>
        </div>
      </div>
    );
  }

  // Default: 'horizontal' (Optimized for the floating island Navbar)
  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      <EmblemMark size={emblemSize} color={color} leftFacetColor={resolvedLeftFacet} />

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: resolvedTextColor,
          }}
        >
          Sentinel<span style={{ color: color }}>Pay</span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.07em",
            color: resolvedSubColor,
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
          }}
        >
          Risk Engine
        </span>
      </div>
    </div>
  );
}
