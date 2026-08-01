"use client";

import { useState, useCallback } from "react";

/* ─── Tokens ──────────────────────────────────────────────────────── */

const LIGHT = {
  cellBg: "#ffffff",
  text: "#292929",
  textSub: "#464646",
  textMuted: "#7c7c7c",
  textInv: "#fefefe",
  border: "#bdbdbd",
  borderDark: "#001719",
  primary: "#057b80",
  primaryHover: "#0a6065",
  primaryLight: "#effefd",
  primaryLightPressed: "#c7fffb",
  error: "#d7312b",
  success: "#3a8732",
  warning: "#e7660f",
  tagNormal: "#656565",
  divider: "rgba(0,0,0,0.08)",
  switchOffBg: "#989898",
  switchOnBg: "#bfe4e5",
  tagHoverFilter: "brightness(0.85)",
};

const DARK = {
  cellBg: "#1a1a1a",
  text: "#f0f0f0",
  textSub: "#c8c8c8",
  textMuted: "#606060",
  textInv: "#fefefe",
  border: "#3a3a3a",
  borderDark: "#606060",
  primary: "#0ca4ab",
  primaryHover: "#12c4cc",
  primaryLight: "#0c2e30",
  primaryLightPressed: "#0a2426",
  error: "#e85450",
  success: "#4aab42",
  warning: "#f07a20",
  tagNormal: "#888888",
  divider: "rgba(255,255,255,0.08)",
  switchOffBg: "#525252",
  switchOnBg: "#0c3d40",
  tagHoverFilter: "brightness(1.2)",
};

type Tok = typeof LIGHT;
const OS = "'Open Sans', system-ui, sans-serif";

function useVariant(count: number) {
  const [v, setV] = useState(0);
  const next = useCallback(() => setV((c) => (c + 1) % count), [count]);
  return [v, next] as const;
}

/* ─── Cell wrapper ────────────────────────────────────────────────── */

type CellPos = { col: 0 | 1; row: 0 | 1 };

function AtomCell({
  name,
  v,
  total,
  onClick,
  tok,
  pos,
  children,
}: {
  name: string;
  v: number;
  total: number;
  onClick: () => void;
  tok: Tok;
  pos: CellPos;
  children: React.ReactNode;
}) {
  const radius =
    pos.col === 0 && pos.row === 0 ? "12px 0 0 0"
    : pos.col === 1 && pos.row === 0 ? "0 12px 0 0"
    : pos.col === 0 && pos.row === 1 ? "0 0 0 12px"
    : "0 0 12px 0";

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        minHeight: 260,
        padding: "48px 40px 44px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        background: tok.cellBg,
        borderRadius: radius,
        // Inner cross dividers only — no outer border
        borderRight: pos.col === 0 ? `1px solid ${tok.divider}` : "none",
        borderBottom: pos.row === 0 ? `1px solid ${tok.divider}` : "none",
      }}
    >
      {/* Component */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        {children}
      </div>

      {/* Label + variant dots */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 20,
          right: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: OS,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: tok.textMuted,
          }}
        >
          {name}
        </span>
        {total > 1 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === v ? 16 : 4,
                  height: 4,
                  borderRadius: 2,
                  background: i === v ? tok.primary : tok.border,
                  transition: "width 220ms ease, background 220ms ease",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════════════════ */

// 1 — BUTTON
function ButtonAtom({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(3);
  const [hov, setHov] = useState(false);

  const styles = {
    0: {
      label: "Primary",
      bg: hov ? tok.primaryHover : tok.primary,
      color: tok.textInv,
      border: hov ? tok.primaryHover : tok.primary,
    },
    1: {
      label: "Outline",
      bg: hov ? tok.primaryLight : "transparent",
      color: hov ? tok.primaryHover : tok.primary,
      border: hov ? tok.primaryHover : tok.primary,
    },
    2: {
      label: "Ghost",
      bg: hov ? tok.primaryLight : "transparent",
      color: hov ? tok.primaryHover : tok.primary,
      border: "transparent",
    },
  }[v as 0 | 1 | 2];

  return (
    <AtomCell name="Button" v={v} total={3} onClick={next} tok={tok} pos={pos}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: styles.bg,
          color: styles.color,
          border: `1.5px solid ${styles.border}`,
          fontFamily: OS,
          fontWeight: 700,
          fontSize: 14,
          padding: "10px 28px",
          borderRadius: 8,
          letterSpacing: "0.01em",
          transition: "background 220ms ease, color 220ms ease, border-color 220ms ease",
        }}
      >
        {styles.label}
      </div>
    </AtomCell>
  );
}

// 2 — TAG
function TagAtom({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(4);
  const [hov, setHov] = useState(false);
  const variants = [
    { bg: tok.tagNormal, label: "Normal"  },
    { bg: tok.success,   label: "Succes"  },
    { bg: tok.warning,   label: "Warning" },
    { bg: tok.error,     label: "Error"   },
  ];
  const cur = variants[v];

  return (
    <AtomCell name="Tag" v={v} total={4} onClick={next} tok={tok} pos={pos}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: cur.bg,
          color: tok.textInv,
          fontFamily: OS,
          fontWeight: 700,
          fontSize: 14,
          padding: "8px 20px",
          borderRadius: 20,
          letterSpacing: "0.01em",
          filter: hov ? tok.tagHoverFilter : undefined,
          transition: "filter 180ms ease",
        }}
      >
        {cur.label}
      </div>
    </AtomCell>
  );
}

// 3 — CHECKBOX
function CheckboxAtom({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(4);
  const [hov, setHov] = useState(false);
  const states = [
    { label: "Default",       checked: false, indet: false, disabled: false },
    { label: "Checked",       checked: true,  indet: false, disabled: false },
    { label: "Indeterminate", checked: false, indet: true,  disabled: false },
    { label: "Disabled",      checked: false, indet: false, disabled: true  },
  ];
  const s = states[v];
  const hasFill = s.checked || s.indet;

  const boxBg =
    hasFill ? tok.primary
    : hov && !s.disabled ? tok.primaryLight
    : "transparent";

  return (
    <AtomCell name="Checkbox" v={v} total={4} onClick={next} tok={tok} pos={pos}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: s.disabled ? 0.38 : 1,
          transition: "opacity 200ms ease",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `1.5px solid ${hasFill ? tok.primary : tok.borderDark}`,
            background: boxBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 150ms, border-color 150ms",
          }}
        >
          {s.checked && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5l4 4 6-8" stroke="#effefd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {s.indet && (
            <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
              <path d="M1 1h8" stroke="#effefd" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <span style={{ fontSize: 14, fontFamily: OS, fontWeight: 400, color: tok.textSub }}>
          {s.label}
        </span>
      </div>
    </AtomCell>
  );
}

// 4 — SWITCH
function SwitchAtom({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(3);
  const states = [
    { on: false, disabled: false },
    { on: true,  disabled: false },
    { on: false, disabled: true  },
  ];
  const s = states[v];

  const trackBg = s.disabled ? tok.border : s.on ? tok.switchOnBg : tok.switchOffBg;
  const knobBg  = s.disabled ? tok.textMuted : s.on ? tok.primary : tok.textInv;
  const knobLeft = s.on ? 28 : 4;

  return (
    <AtomCell name="Switch" v={v} total={3} onClick={next} tok={tok} pos={pos}>
      <div style={{ opacity: s.disabled ? 0.38 : 1, transition: "opacity 200ms ease" }}>
        <div
          style={{
            position: "relative",
            width: 48,
            height: 26,
            borderRadius: 13,
            background: trackBg,
            transition: "background 220ms ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 5,
              left: knobLeft,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: knobBg,
              transition: "left 220ms cubic-bezier(0.4, 0, 0.2, 1), background 220ms ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            }}
          />
        </div>
      </div>
    </AtomCell>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */

export default function EkaraUIKit() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const tok = theme === "light" ? LIGHT : DARK;

  return (
    <div style={{ fontFamily: OS }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 10,
              fontFamily: OS,
              fontWeight: 700,
              color: tok.primary,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Atomes
          </span>
          <div style={{ width: 40, height: 1, background: `${tok.primary}40` }} />
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 14px",
            borderRadius: 20,
            border: `1px solid ${tok.border}`,
            background: "transparent",
            cursor: "pointer",
            color: tok.textMuted,
            fontFamily: OS,
            fontSize: 12,
            fontWeight: 600,
            transition: "border-color 200ms, color 200ms",
            whiteSpace: "nowrap",
          }}
        >
          {theme === "light" ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Dark
            </>
          )}
        </button>
      </div>

      {/* 2×2 grid — white/dark cells, inner dividers only */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
          borderRadius: 12,
        }}
      >
        <ButtonAtom   tok={tok} pos={{ col: 0, row: 0 }} />
        <TagAtom      tok={tok} pos={{ col: 1, row: 0 }} />
        <CheckboxAtom tok={tok} pos={{ col: 0, row: 1 }} />
        <SwitchAtom   tok={tok} pos={{ col: 1, row: 1 }} />
      </div>
    </div>
  );
}
