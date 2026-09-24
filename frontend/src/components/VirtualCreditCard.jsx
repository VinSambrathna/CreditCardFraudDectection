import React from "react";
import { Shield } from "lucide-react";

/**
 * ContactlessGlyph
 * Authentic 4-arc EMV Contactless / NFC symbol
 */
function ContactlessGlyph({ size = 18, color = "rgba(255, 255, 255, 0.75)" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-label="Contactless payment enabled"
    >
      <path
        d="M6 16.5C8 14.3 8 10.7 6 8.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.5 18.5C12.8 14.8 12.8 9.2 9.5 5.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13.5 21C18 16 18 8 13.5 3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * VisaWordmark
 * Clean SVG glyph matching the geometric typographic system
 */
function VisaWordmark() {
  return (
    <svg width="44" height="15" viewBox="0 0 54 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.2 1.2L14.7 16.8H9.7L5.9 4.3C5.7 3.5 5.5 3.2 4.9 2.8C3.8 2.2 1.8 1.7 0 1.3L0.4 0.2H8.3C9.3 0.2 10.3 0.9 10.5 2.1L12.5 12.3L17.4 0.2H21.2V1.2ZM39.6 11.5C39.6 7.1 33.5 6.9 33.6 4.9C33.6 4.3 34.2 3.7 35.5 3.5C36.1 3.4 37.9 3.3 39.8 4.2L40.5 1.1C39.5 0.7 38.2 0.3 36.6 0.3C32.1 0.3 29 2.7 29 6.2C29 8.7 31.3 10.1 33 11C34.7 11.8 35.3 12.4 35.3 13.1C35.3 14.3 33.9 14.8 32.6 14.8C30.3 14.8 29 14.4 28 13.9L27.2 17.1C28.2 17.6 30.1 18 32.2 18C37 18 40.1 15.6 39.6 11.5ZM51.8 16.8H55.9L52.4 0.2H48.6C47.7 0.2 47 0.7 46.6 1.6L39.8 16.8H43.9L44.7 14.6H49.8L51.8 16.8ZM45.8 11.6L48 5.7L49.3 11.6H45.8ZM28.5 0.2L25.3 16.8H21.4L24.6 0.2H28.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * VirtualCreditCard
 * Institutional-grade payment card component with brushed EMV microchip,
 * authentic contactless NFC wave, and clean modern typography.
 */
export default function VirtualCreditCard({
  cardholder = "ALEX MORGAN",
  cardNumber = "4532 •••• •••• 8821",
  expiry = "09/28",
  cardType = "VISA",
  status = "ACTIVE", // 'ACTIVE' | 'REVIEW' | 'BLOCKED'
  variant = "black", // 'black' | 'titanium'
  className = "",
  style = {},
}) {
  const isReview = status === "REVIEW" || status === "SOFT_BLOCKED";
  const isBlocked = status === "BLOCKED";

  return (
    <div
      className={`virtual-credit-card ${className}`}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 360,
        height: 220,
        borderRadius: 18,
        padding: "24px 26px",
        background:
          variant === "titanium"
            ? "linear-gradient(135deg, #242933 0%, #12151C 100%)"
            : "linear-gradient(145deg, #0F172A 0%, #080D1A 60%, #030712 100%)",
        boxShadow:
          isBlocked
            ? "0 16px 36px -8px rgba(220, 38, 38, 0.28), 0 0 0 1px rgba(220, 38, 38, 0.35)"
            : isReview
            ? "0 16px 36px -8px rgba(217, 119, 6, 0.22), 0 0 0 1px rgba(217, 119, 6, 0.35)"
            : "0 18px 40px -10px rgba(10, 15, 29, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        color: "#FFFFFF",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        userSelect: "none",
        transition: "transform 200ms var(--ease-spring), box-shadow 200ms ease",
        ...style,
      }}
    >
      {/* Specular Diagonal Sheen */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: isBlocked
            ? "radial-gradient(circle, rgba(220, 38, 38, 0.12) 0%, transparent 70%)"
            : isReview
            ? "radial-gradient(circle, rgba(217, 119, 6, 0.1) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header: Bank Name & Brand Mark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <Shield style={{ width: 12, height: 12, color: "#60A5FA" }} />
          </div>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.1em",
              fontFamily: "var(--font-mono)",
              color: "rgba(255, 255, 255, 0.85)",
              textTransform: "uppercase",
            }}
          >
            SentinelPay Platinum
          </span>
        </div>

        {/* Brand Mark (Visa / Mastercard) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {cardType === "MASTERCARD" ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#EB001B", opacity: 0.9 }} />
              <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#F79E1B", marginLeft: -7, opacity: 0.85 }} />
            </div>
          ) : (
            <VisaWordmark />
          )}
        </div>
      </div>

      {/* Middle Row: Brushed Gold EMV Microchip & Contactless Glyph */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "relative",
          zIndex: 1,
          marginTop: 4,
        }}
      >
        {/* Realistic Brushed Gold EMV Microchip */}
        <div
          style={{
            width: 44,
            height: 33,
            borderRadius: 6,
            background: "linear-gradient(135deg, #E6C687 0%, #C99738 45%, #F0D999 75%, #A67C24 100%)",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.45), 0 2px 6px rgba(0, 0, 0, 0.35)",
            position: "relative",
            border: "1px solid rgba(133, 96, 26, 0.45)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Microchip internal etched circuit paths */}
          <div
            style={{
              position: "absolute",
              inset: 3,
              border: "1px solid rgba(100, 70, 18, 0.45)",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(100, 70, 18, 0.45)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "42%",
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(100, 70, 18, 0.45)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "64%",
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(100, 70, 18, 0.45)",
            }}
          />
        </div>

        {/* Authentic Contactless NFC Wave */}
        <ContactlessGlyph size={18} color="rgba(255, 255, 255, 0.7)" />

        {/* Card Status Pill */}
        <div
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            borderRadius: 99,
            background: isBlocked
              ? "rgba(220, 38, 38, 0.25)"
              : isReview
              ? "rgba(217, 119, 6, 0.22)"
              : "rgba(5, 150, 105, 0.22)",
            border: `1px solid ${
              isBlocked
                ? "rgba(220, 38, 38, 0.4)"
                : isReview
                ? "rgba(217, 119, 6, 0.35)"
                : "rgba(5, 150, 105, 0.35)"
            }`,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            color: isBlocked ? "#FCA5A5" : isReview ? "#FDE68A" : "#6EE7B7",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "currentColor",
            }}
          />
          {isBlocked ? "BLOCKED" : isReview ? "3DS2 HELD" : "VERIFIED"}
        </div>
      </div>

      {/* Card Number (Clean Monospace Modern Look) */}
      <div
        className="tabular-nums"
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: 17,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.15em",
          color: "rgba(255, 255, 255, 0.95)",
          margin: "12px 0 6px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {cardNumber}
      </div>

      {/* Bottom Row: Cardholder Name & Expiry */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "rgba(255, 255, 255, 0.6)",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              marginBottom: 2,
            }}
          >
            CARDHOLDER
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#FFFFFF",
              textTransform: "uppercase",
            }}
          >
            {cardholder}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "rgba(255, 255, 255, 0.6)",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              marginBottom: 2,
            }}
          >
            EXPIRES
          </div>
          <div
            className="tabular-nums"
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "rgba(255, 255, 255, 0.9)",
              letterSpacing: "0.06em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {expiry}
          </div>
        </div>
      </div>
    </div>
  );
}
