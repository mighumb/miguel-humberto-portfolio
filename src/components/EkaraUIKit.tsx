"use client";

import { useState, useCallback } from "react";

/* ─── Tokens ──────────────────────────────────────────────────────── */

const LIGHT = {
  text: "#292929",
  textSub: "#464646",
  textMuted: "#7c7c7c",
  textInv: "#fefefe",
  border: "#bdbdbd",
  borderDark: "#001719",
  primary: "#057b80",
  primaryLight: "#effefd",
  error: "#d7312b",
  success: "#3a8732",
  warning: "#e7660f",
  tagNormal: "#656565",
  divider: "rgba(0,0,0,0.07)",
  hoverBg: "rgba(0,0,0,0.025)",
};

const DARK = {
  text: "#f0f0f0",
  textSub: "#c8c8c8",
  textMuted: "#666666",
  textInv: "#fefefe",
  border: "#383838",
  borderDark: "#606060",
  primary: "#0ca4ab",
  primaryLight: "#0c2e30",
  error: "#e85450",
  success: "#4aab42",
  warning: "#f07a20",
  tagNormal: "#888888",
  divider: "rgba(255,255,255,0.07)",
  hoverBg: "rgba(255,255,255,0.04)",
};

type Tok = typeof LIGHT;
const OS = "'Open Sans', system-ui, sans-serif";

function useVariant(count: number) {
  const [v, setV] = useState(0);
  const next = useCallback(() => setV((c) => (c + 1) % count), [count]);
  return [v, next] as const;
}

/* ─── Atom cell wrapper ───────────────────────────────────────────── */

function AtomCell({
  name,
  v,
  total,
  onClick,
  tok,
  children,
  col,
  row,
  totalCols = 2,
  totalRows = 2,
}: {
  name: string;
  v: number;
  total: number;
  onClick: () => void;
  tok: Tok;
  children: React.ReactNode;
  col: number;
  row: number;
  totalCols?: number;
  totalRows?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        minHeight: 260,
        padding: "48px 40px 36px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        background: hovered ? tok.hoverBg : "transparent",
        transition: "background 200ms ease",
        borderRight: col < totalCols - 1 ? `1px solid ${tok.divider}` : "none",
        borderBottom: row < totalRows - 1 ? `1px solid ${tok.divider}` : "none",
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        {children}
      </div>

      {/* Label + dots */}
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

function TagAtom({ tok, col, row }: { tok: Tok; col: number; row: number }) {
  const [v, next] = useVariant(4);
  const variants = [
    { bg: tok.tagNormal, label: "Label", name: "Normal" },
    { bg: tok.success,   label: "Label", name: "Succes" },
    { bg: tok.warning,   label: "Label", name: "Warning" },
    { bg: tok.error,     label: "Label", name: "Error" },
  ];
  const cur = variants[v];

  return (
    <AtomCell name="Tag" v={v} total={4} onClick={next} tok={tok} col={col} row={row}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div
          style={{
            background: cur.bg,
            color: tok.textInv,
            fontFamily: OS,
            fontWeight: 700,
            fontSize: 14,
            padding: "8px 20px",
            borderRadius: 20,
            letterSpacing: "0.01em",
            transition: "background 240ms ease",
          }}
        >
          {cur.label}
        </div>
        <span
          style={{
            fontSize: 12,
            fontFamily: OS,
            fontWeight: 600,
            color: cur.bg,
            transition: "color 240ms ease",
          }}
        >
          {cur.name}
        </span>
      </div>
    </AtomCell>
  );
}

function CheckboxAtom({ tok, col, row }: { tok: Tok; col: number; row: number }) {
  const [v, next] = useVariant(4);
  const states = [
    { label: "Default",       checked: false, indet: false, disabled: false },
    { label: "Checked",       checked: true,  indet: false, disabled: false },
    { label: "Indeterminate", checked: false, indet: true,  disabled: false },
    { label: "Disabled",      checked: false, indet: false, disabled: true  },
  ];

  return (
    <AtomCell name="Checkbox" v={v} total={4} onClick={next} tok={tok} col={col} row={row}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {states.map((s, i) => {
          const isActive = i === v;
          const hasFill = s.checked || s.indet;
          return (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: s.disabled ? 0.38 : isActive ? 1 : 0.35,
                transition: "opacity 200ms ease",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  border: `1.5px solid ${hasFill ? tok.primary : tok.borderDark}`,
                  background: hasFill ? tok.primary : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  outline: isActive && !s.disabled ? `2.5px solid ${tok.primary}40` : "none",
                  outlineOffset: 2,
                  transition: "background 150ms, border-color 150ms, outline 150ms",
                }}
              >
                {s.checked && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4.5l3.5 3.5 6-7" stroke="#fefefe" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {s.indet && (
                  <svg width="9" height="2" viewBox="0 0 9 2" fill="none">
                    <path d="M1 1h7" stroke="#fefefe" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 13, fontFamily: OS, fontWeight: 400, color: tok.textSub }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </AtomCell>
  );
}

function SwitchAtom({ tok, col, row }: { tok: Tok; col: number; row: number }) {
  const [v, next] = useVariant(3);
  const states = [
    { on: false, disabled: false, label: "Off" },
    { on: true,  disabled: false, label: "On" },
    { on: false, disabled: true,  label: "Disabled" },
  ];

  return (
    <AtomCell name="Switch" v={v} total={3} onClick={next} tok={tok} col={col} row={row}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
        {states.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: s.disabled ? 0.38 : i === v ? 1 : 0.35,
              transition: "opacity 200ms ease",
            }}
          >
            {/* Track */}
            <div
              style={{
                position: "relative",
                width: 44,
                height: 26,
                borderRadius: 13,
                background: s.on ? tok.primary : "transparent",
                border: `1.5px solid ${s.on ? tok.primary : tok.border}`,
                transition: "background 200ms, border-color 200ms",
                flexShrink: 0,
              }}
            >
              {/* Knob */}
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: s.on ? 20 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: s.on ? "#fefefe" : tok.textMuted,
                  transition: "left 200ms cubic-bezier(0.4, 0, 0.2, 1), background 200ms",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                }}
              />
            </div>
            <span style={{ fontSize: 13, fontFamily: OS, fontWeight: 600, color: tok.textSub }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </AtomCell>
  );
}

function ButtonAtom({ tok, col, row }: { tok: Tok; col: number; row: number }) {
  const [v, next] = useVariant(3);
  const variants = [
    {
      label: "Primary",
      style: { background: tok.primary, color: tok.textInv, border: `1.5px solid ${tok.primary}` },
    },
    {
      label: "Outline",
      style: { background: "transparent", color: tok.primary, border: `1.5px solid ${tok.primary}` },
    },
    {
      label: "Ghost",
      style: { background: "transparent", color: tok.primary, border: "1.5px solid transparent" },
    },
  ];
  const cur = variants[v];

  return (
    <AtomCell name="Button" v={v} total={3} onClick={next} tok={tok} col={col} row={row}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div
          style={{
            ...cur.style,
            fontFamily: OS,
            fontWeight: 700,
            fontSize: 14,
            padding: "10px 28px",
            borderRadius: 8,
            letterSpacing: "0.01em",
            transition: "background 220ms ease, color 220ms ease, border-color 220ms ease",
          }}
        >
          {cur.label}
        </div>
        <span
          style={{
            fontSize: 12,
            fontFamily: OS,
            fontWeight: 600,
            color: tok.textMuted,
          }}
        >
          {cur.label} variant
        </span>
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
      {/* Section header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
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
            display: "flex",
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
          }}
        >
          {theme === "light" ? (
            <>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1.05 1.05M10.35 10.35l1.05 1.05M2.6 11.4l1.05-1.05M10.35 3.65l1.05-1.05" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M12 8.4A5.4 5.4 0 015.6 2a5.4 5.4 0 100 10 5.4 5.4 0 006.4-3.6z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Dark
            </>
          )}
        </button>
      </div>

      {/* 2×2 grid — no background, just dividers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: `1px solid ${tok.divider}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <TagAtom      tok={tok} col={0} row={0} />
        <CheckboxAtom tok={tok} col={1} row={0} />
        <SwitchAtom   tok={tok} col={0} row={1} />
        <ButtonAtom   tok={tok} col={1} row={1} />
      </div>
    </div>
  );
}
