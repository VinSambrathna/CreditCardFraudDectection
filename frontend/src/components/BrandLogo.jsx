import React from "react";

export function EmblemMark({ size = 44, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="36 28 96 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible", flexShrink: 0 }}
    >
      <defs>
        {/* Crisp shadow for white shield & circuit traces */}
        <filter id="shieldGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.5" floodColor="#0A0F1D" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* ─── Chromatic Translucent Overlapping Spheres ─── */}
      <g style={{ mixBlendMode: "multiply" }}>
        {/* Top-Right Warm Gold / Amber Orb */}
        <circle cx="98" cy="65" r="32" fill="#F59E0B" fillOpacity="0.84" />

        {/* Left Deep Indigo / Purple Orb */}
        <circle cx="68" cy="76" r="35" fill="#6366F1" fillOpacity="0.88" />

        {/* Bottom-Right Crimson / Coral Orb */}
        <circle cx="96" cy="94" r="33" fill="#E11D48" fillOpacity="0.80" />

        {/* Bottom-Center Vivid Cobalt / Royal Blue Orb */}
        <circle cx="78" cy="97" r="30" fill="#2563EB" fillOpacity="0.90" />
      </g>

      {/* ─── Orbital Satellites / Micro-Dots ─── */}
      <circle cx="82" cy="38" r="6.5" fill="#F43F5E" />
      <circle cx="122" cy="78" r="7" fill="#3B82F6" />
      <circle cx="114" cy="95" r="4.2" fill="#FB7185" />
      <circle cx="52" cy="107" r="4.5" fill="#FBBF24" />
      <circle cx="46" cy="83" r="3.8" fill="#8B5CF6" />

      {/* ─── Foreground White Shield + Circuit Traces + Padlock ─── */}
      <g filter="url(#shieldGlow)" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Outer Contour Shield */}
        <path
          d="M 80 56 C 91.5 56, 100.5 59.5, 100.5 72 C 100.5 91.5, 80 106.5, 80 106.5 C 80 106.5, 59.5 91.5, 59.5 72 C 59.5 59.5, 68.5 56, 80 56 Z"
          strokeWidth="2.4"
        />

        {/* Inner Contour Shield */}
        <path
          d="M 80 61.5 C 88.5 61.5, 95.5 64.2, 95.5 73.5 C 95.5 88.5, 80 100.5, 80 100.5 C 80 100.5, 64.5 88.5, 64.5 73.5 C 64.5 64.2, 71.5 61.5, 80 61.5 Z"
          strokeWidth="1.8"
        />

        {/* Padlock Shackle */}
        <path d="M 75 75.5 V 71 C 75 68.2, 77.2 66, 80 66 C 82.8 66, 85 68.2, 85 71 V 75.5" strokeWidth="2" />

        {/* Padlock Body */}
        <rect x="72" y="75.5" width="16" height="13" rx="2.5" fill="#FFFFFF" fillOpacity="0.2" strokeWidth="2" />

        {/* Padlock Keyhole */}
        <circle cx="80" cy="80.5" r="1.5" fill="#FFFFFF" stroke="none" />
        <path d="M 80 82 V 85.5" strokeWidth="1.6" />

        {/* Left Circuit Traces (5 Nodes) */}
        <path d="M 59.5 64 H 53" strokeWidth="1.8" />
        <circle cx="51" cy="64" r="2" fill="#FFFFFF" />

        <path d="M 58.5 70 H 51" strokeWidth="1.8" />
        <circle cx="49" cy="70" r="2" fill="#FFFFFF" />

        <path d="M 59.5 76 H 51" strokeWidth="1.8" />
        <circle cx="49" cy="76" r="2" fill="#FFFFFF" />

        <path d="M 61.5 82 H 53" strokeWidth="1.8" />
        <circle cx="51" cy="82" r="2" fill="#FFFFFF" />

        <path d="M 64.5 88 H 57" strokeWidth="1.8" />
        <circle cx="55" cy="88" r="2" fill="#FFFFFF" />

        {/* Right Circuit Traces (5 Nodes) */}
        <path d="M 100.5 64 H 107" strokeWidth="1.8" />
        <circle cx="109" cy="64" r="2" fill="#FFFFFF" />

        <path d="M 101.5 70 H 109" strokeWidth="1.8" />
        <circle cx="111" cy="70" r="2" fill="#FFFFFF" />

        <path d="M 100.5 76 H 109" strokeWidth="1.8" />
        <circle cx="111" cy="76" r="2" fill="#FFFFFF" />

        <path d="M 98.5 82 H 107" strokeWidth="1.8" />
        <circle cx="109" cy="82" r="2" fill="#FFFFFF" />

        <path d="M 95.5 88 H 103" strokeWidth="1.8" />
        <circle cx="105" cy="88" r="2" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

export default function BrandLogo({
  variant = "horizontal", // 'horizontal' | 'mark' | 'stacked'
  emblemSize = 46,
  onClick,
}) {
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
        <EmblemMark size={emblemSize} />
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
        <EmblemMark size={emblemSize * 1.6} />
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: "#1E3A44",
              lineHeight: 1.15,
              textTransform: "uppercase",
            }}
          >
            Intelligence Against
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: "#E24B4A",
              lineHeight: 1.15,
              textTransform: "uppercase",
            }}
          >
            Theft
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
        gap: 11,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 180ms var(--ease-spring)",
        }}
      >
        <EmblemMark size={emblemSize} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.04em",
            color: "#1E3A44",
            textTransform: "uppercase",
          }}
        >
          Intelligence Against
        </span>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 900,
            letterSpacing: "0.06em",
            color: "#E24B4A",
            textTransform: "uppercase",
          }}
        >
          Theft
        </span>
      </div>
    </div>
  );
}
