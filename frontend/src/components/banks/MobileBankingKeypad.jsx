import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Delete, Fingerprint } from "lucide-react";

/**
 * MobileBankingKeypad
 * Authentic iOS & Commercial Mobile Banking Keypad Replica
 * Features:
 * - Real phone key proportions with sub-letters (2 ABC, 3 DEF, etc.)
 * - Haptic tactile press animations (Framer Motion scale + active flash)
 * - Physical keyboard capture: supports desktop typing (0-9, Backspace, Enter, .)
 * - Bank-specific themes: ABA (cyan/dark glass), ACLEDA (gold/navy), Wing (lime green/card)
 * - Two modes: "amount" (with decimal point) and "pin" (with FaceID biometric)
 */

const KEY_SUB_LETTERS = {
  1: "",
  2: "ABC",
  3: "DEF",
  4: "GHI",
  5: "JKL",
  6: "MNO",
  7: "PQRS",
  8: "TUV",
  9: "WXYZ",
  0: "+"
};

const THEME_STYLES = {
  aba: {
    keyBg: "rgba(0, 31, 48, 0.75)",
    keyBorder: "1px solid rgba(0, 163, 224, 0.22)",
    keyColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.55)",
    activeBg: "rgba(0, 163, 224, 0.28)",
    activeBorder: "#00A3E0",
    actionColor: "#00A3E0",
    emptyBg: "transparent",
    shadow: "none"
  },
  acleda: {
    keyBg: "rgba(10, 28, 51, 0.78)",
    keyBorder: "1px solid rgba(212, 175, 55, 0.25)",
    keyColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.55)",
    activeBg: "rgba(212, 175, 55, 0.25)",
    activeBorder: "#D4AF37",
    actionColor: "#D4AF37",
    emptyBg: "transparent",
    shadow: "none"
  },
  wing: {
    keyBg: "#FFFFFF",
    keyBorder: "1px solid #E2E8F0",
    keyColor: "#0F172A",
    subColor: "#64748B",
    activeBg: "#F1F5F9",
    activeBorder: "#77BC1F",
    actionColor: "#77BC1F",
    emptyBg: "transparent",
    shadow: "none"
  }
};

export default function MobileBankingKeypad({
  onDigit,
  onDelete,
  onDecimal,
  onBiometric,
  onSubmit,
  mode = "amount", // "amount" | "pin"
  theme = "aba", // "aba" | "acleda" | "wing"
  compact = false,
  enableKeyboard = true,
  style = {}
}) {
  const t = THEME_STYLES[theme] || THEME_STYLES.aba;
  const [activeKey, setActiveKey] = useState(null);

  const keyHeight = compact ? 44 : 48;
  const leftActionType = mode === "pin" ? "biometric" : "decimal";

  // Capture physical computer keyboard strokes seamlessly for desktop testing
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e) => {
      // Don't intercept if an explicit text input or textarea is focused
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        const digit = parseInt(e.key, 10);
        setActiveKey(digit);
        onDigit?.(digit);
        setTimeout(() => setActiveKey(null), 120);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        setActiveKey("del");
        onDelete?.();
        setTimeout(() => setActiveKey(null), 120);
      } else if (e.key === "." || e.key === ",") {
        if (mode === "amount") {
          e.preventDefault();
          setActiveKey("dec");
          onDecimal?.(".");
          setTimeout(() => setActiveKey(null), 120);
        }
      } else if (e.key === "Enter") {
        if (onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboard, onDigit, onDelete, onDecimal, onSubmit, mode]);

  const renderKey = (val, sub = "") => {
    const isKeyPressed = activeKey === val;
    return (
      <motion.button
        key={val}
        type="button"
        whileTap={{ scale: 0.93 }}
        onClick={(e) => {
          e.currentTarget.blur();
          onDigit?.(val);
        }}
        style={{
          height: keyHeight,
          borderRadius: 14,
          background: isKeyPressed ? t.activeBg : t.keyBg,
          border: isKeyPressed ? `1px solid ${t.activeBorder}` : t.keyBorder,
          color: t.keyColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "manipulation",
          boxShadow: t.shadow || "none",
          transition: "background 80ms ease, border-color 80ms ease, transform 80ms ease"
        }}
      >
        <span
          style={{
            fontSize: compact ? 18 : 20,
            fontWeight: 700,
            lineHeight: 1.1,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
        >
          {val}
        </span>
        {sub ? (
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: t.subColor,
              marginTop: 1,
              textTransform: "uppercase"
            }}
          >
            {sub}
          </span>
        ) : null}
      </motion.button>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: compact ? 6 : 8,
        ...style
      }}
    >
      {/* Digits 1-9 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) =>
        renderKey(digit, KEY_SUB_LETTERS[digit] || "")
      )}

      {/* Row 4: Left Key (Decimal or Biometric) */}
      {leftActionType === "decimal" ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.93 }}
          onClick={(e) => {
            e.currentTarget.blur();
            onDecimal?.(".");
          }}
          style={{
            height: keyHeight,
            borderRadius: 14,
            background: activeKey === "dec" ? t.activeBg : t.keyBg,
            border: activeKey === "dec" ? `1px solid ${t.activeBorder}` : t.keyBorder,
            color: t.keyColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 800,
            cursor: "pointer",
            touchAction: "manipulation",
            boxShadow: t.shadow || "none"
          }}
        >
          &bull;
        </motion.button>
      ) : onBiometric ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.93 }}
          onClick={(e) => {
            e.currentTarget.blur();
            onBiometric();
          }}
          style={{
            height: keyHeight,
            borderRadius: 14,
            background: t.keyBg,
            border: t.keyBorder,
            color: t.actionColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            touchAction: "manipulation",
            boxShadow: t.shadow || "none"
          }}
          title="FaceID / TouchID"
        >
          <Fingerprint style={{ width: 22, height: 22 }} />
        </motion.button>
      ) : (
        <div style={{ height: keyHeight }} />
      )}

      {/* Digit 0 */}
      {renderKey(0, "")}

      {/* Backspace Key with authentic Delete icon */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.93 }}
        onClick={(e) => {
          e.currentTarget.blur();
          onDelete?.();
        }}
        style={{
          height: keyHeight,
          borderRadius: 14,
          background: activeKey === "del" ? t.activeBg : t.keyBg,
          border: activeKey === "del" ? `1px solid ${t.activeBorder}` : t.keyBorder,
          color: t.keyColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          touchAction: "manipulation",
          boxShadow: t.shadow || "none"
        }}
        title="Delete (Backspace)"
      >
        <Delete style={{ width: 20, height: 20, opacity: 0.9 }} />
      </motion.button>
    </div>
  );
}

