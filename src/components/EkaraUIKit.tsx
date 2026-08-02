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
  tagHoverBlend: "#000000",
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
  tagHoverBlend: "#ffffff",
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
          background: hov
            ? `color-mix(in srgb, ${cur.bg} 82%, ${tok.tagHoverBlend})`
            : cur.bg,
          color: tok.textInv,
          fontFamily: OS,
          fontWeight: 700,
          fontSize: 14,
          padding: "8px 20px",
          borderRadius: 20,
          letterSpacing: "0.01em",
          transition: "background 180ms ease",
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
  const [hov, setHov] = useState(false);
  const states = [
    { on: false, disabled: false },
    { on: true,  disabled: false },
    { on: false, disabled: true  },
  ];
  const s = states[v];

  const trackBg = s.disabled ? tok.border : s.on ? tok.switchOnBg : tok.switchOffBg;
  const knobBg  = s.disabled ? tok.textMuted : s.on ? tok.primary : tok.textInv;
  const knobLeft = s.disabled
    ? (s.on ? 28 : 4)
    : s.on
      ? (hov ? 24 : 28)
      : (hov ? 8  : 4);

  return (
    <AtomCell name="Switch" v={v} total={3} onClick={next} tok={tok} pos={pos}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ opacity: s.disabled ? 0.38 : 1, transition: "opacity 200ms ease" }}
      >
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
   MOLECULES
═══════════════════════════════════════════════════════════════════ */

// 5 — INPUT FIELD
function InputFieldMolecule({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(6);
  const states = [
    { label: "Default",  active: false, filled: false, error: false, success: false, disabled: false, value: "",               helper: "" },
    { label: "Active",   active: true,  filled: false, error: false, success: false, disabled: false, value: "",               helper: "" },
    { label: "Filled",   active: false, filled: true,  error: false, success: false, disabled: false, value: "john@email.com", helper: "" },
    { label: "Error",    active: false, filled: true,  error: true,  success: false, disabled: false, value: "john@email",     helper: "Invalid format" },
    { label: "Success",  active: false, filled: true,  error: false, success: true,  disabled: false, value: "john@email.com", helper: "Verified" },
    { label: "Disabled", active: false, filled: false, error: false, success: false, disabled: true,  value: "",               helper: "" },
  ];
  const s = states[v];
  const floated = s.active || s.filled;

  const borderColor =
    s.error   ? tok.error   :
    s.success ? tok.success :
    s.active  ? tok.primary :
    tok.border;

  const labelColor =
    s.error   ? tok.error   :
    s.success ? tok.success :
    s.active  ? tok.primary :
    floated   ? tok.textSub :
    tok.textMuted;

  return (
    <AtomCell name="Input Field" v={v} total={6} onClick={next} tok={tok} pos={pos}>
      <div style={{ width: "100%", maxWidth: 240, opacity: s.disabled ? 0.38 : 1, transition: "opacity 200ms" }}>
        <div
          style={{
            position: "relative",
            height: 52,
            border: `1.5px solid ${borderColor}`,
            borderRadius: 8,
            background: tok.cellBg,
            transition: "border-color 200ms",
          }}
        >
          {/* Floating label */}
          <span
            style={{
              position: "absolute",
              left: 12,
              top: floated ? -10 : "50%",
              transform: floated ? "none" : "translateY(-50%)",
              fontSize: floated ? 11 : 14,
              fontFamily: OS,
              fontWeight: floated ? 600 : 400,
              color: labelColor,
              background: floated ? tok.cellBg : "transparent",
              padding: floated ? "0 4px" : 0,
              transition: "top 180ms ease, font-size 180ms ease, color 180ms ease",
              pointerEvents: "none",
              lineHeight: 1.2,
              zIndex: 1,
            }}
          >
            Email
          </span>
          {/* Value text */}
          {floated && (
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                fontFamily: OS,
                color: tok.textSub,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {s.value}
              {s.active && (
                <span
                  style={{
                    display: "inline-block",
                    width: 1.5,
                    height: 16,
                    background: tok.primary,
                    verticalAlign: "middle",
                  }}
                />
              )}
            </span>
          )}
        </div>
        {/* Helper text */}
        {s.helper && (
          <div
            style={{
              marginTop: 5,
              fontSize: 11,
              fontFamily: OS,
              color: s.error ? tok.error : tok.success,
              paddingLeft: 4,
            }}
          >
            {s.helper}
          </div>
        )}
      </div>
    </AtomCell>
  );
}

// 6 — SELECT
function SelectMolecule({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(3);
  const isHov  = v === 1;
  const isOpen = v === 2;

  const triggerBorder = (isHov || isOpen) ? tok.primary : tok.border;
  const triggerBg     = (isHov || isOpen) ? tok.primaryLight : "transparent";
  const items = ["Analytics", "Reports", "Dashboard"];

  return (
    <AtomCell name="Select" v={v} total={3} onClick={next} tok={tok} pos={pos}>
      <div style={{ width: "100%", maxWidth: 220, position: "relative" }}>
        {/* Trigger */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 44,
            padding: "0 12px",
            border: `1.5px solid ${triggerBorder}`,
            borderRadius: isOpen ? "8px 8px 0 0" : 8,
            background: triggerBg,
            transition: "border-color 200ms, background 200ms",
          }}
        >
          <span style={{ fontSize: 14, fontFamily: OS, color: tok.textSub }}>View</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 200ms",
              flexShrink: 0,
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke={tok.primary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* Dropdown */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              border: `1.5px solid ${tok.primary}`,
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              background: tok.cellBg,
              overflow: "hidden",
              zIndex: 2,
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "11px 12px",
                  fontSize: 14,
                  fontFamily: OS,
                  color: tok.textSub,
                  borderTop: i > 0 ? `1px solid ${tok.divider}` : "none",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </AtomCell>
  );
}

// 7 — SNACKBAR
function SnackbarIcon({ type, color }: { type: string; color: string }) {
  if (type === "Warning") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.75" fill={color} />
    </svg>
  );
  if (type === "Error") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (type === "Success") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="8.5" r="0.75" fill={color} />
      <line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const SNACKBAR_DEFS = [
  { type: "Warning", message: "Check your connection", action: "Retry",   getAccent: (t: Tok) => t.warning },
  { type: "Error",   message: "Something went wrong",  action: "Dismiss", getAccent: (t: Tok) => t.error   },
  { type: "Success", message: "Changes saved",          action: "View",    getAccent: (t: Tok) => t.success  },
  { type: "Info",    message: "New update available",   action: "Update",  getAccent: (t: Tok) => t.primary  },
];

function SnackbarMolecule({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(4);
  const def    = SNACKBAR_DEFS[v];
  const accent = def.getAccent(tok);
  const bg     = `${accent}18`;

  return (
    <AtomCell name="Snackbar" v={v} total={4} onClick={next} tok={tok} pos={pos}>
      <div
        style={{
          width: "100%",
          maxWidth: 280,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 8,
          border: `1px solid ${accent}`,
          background: bg,
          transition: "background 200ms, border-color 200ms",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <SnackbarIcon type={def.type} color={accent} />
        </div>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontFamily: OS,
            color: tok.text,
            fontWeight: 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {def.message}
        </span>
        <span
          style={{
            fontSize: 12,
            fontFamily: OS,
            fontWeight: 700,
            color: accent,
            flexShrink: 0,
          }}
        >
          {def.action}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M18 6L6 18M6 6l12 12" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </AtomCell>
  );
}

// 8 — KEBAB MENU
function KebabMenuMolecule({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(2);
  const isOpen = v === 1;

  return (
    <AtomCell name="Kebab Menu" v={v} total={2} onClick={next} tok={tok} pos={pos}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Trigger */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isOpen ? tok.primaryLight : "transparent",
            border: `1.5px solid ${isOpen ? tok.primary : tok.border}`,
            transition: "background 200ms, border-color 200ms",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5"  r="1.5" fill={isOpen ? tok.primary : tok.textMuted} />
            <circle cx="12" cy="12" r="1.5" fill={isOpen ? tok.primary : tok.textMuted} />
            <circle cx="12" cy="19" r="1.5" fill={isOpen ? tok.primary : tok.textMuted} />
          </svg>
        </div>

        {/* Menu panel */}
        {isOpen && (
          <div
            style={{
              marginTop: 8,
              width: 160,
              borderRadius: 8,
              border: `1px solid ${tok.border}`,
              background: tok.cellBg,
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            {/* Export */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                fontSize: 13,
                fontFamily: OS,
                color: tok.textSub,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke={tok.textSub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              Export
            </div>
            {/* Share */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                fontSize: 13,
                fontFamily: OS,
                color: tok.textSub,
                borderTop: `1px solid ${tok.divider}`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="18" cy="5"  r="3" stroke={tok.textSub} strokeWidth="1.5" />
                <circle cx="6"  cy="12" r="3" stroke={tok.textSub} strokeWidth="1.5" />
                <circle cx="18" cy="19" r="3" stroke={tok.textSub} strokeWidth="1.5" />
                <path
                  d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"
                  stroke={tok.textSub} strokeWidth="1.5" strokeLinecap="round"
                />
              </svg>
              Share
            </div>
            {/* Delete */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                fontSize: 13,
                fontFamily: OS,
                color: tok.error,
                borderTop: `1px solid ${tok.divider}`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline
                  points="3 6 5 6 21 6"
                  stroke={tok.error} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
                <path
                  d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"
                  stroke={tok.error} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              Delete
            </div>
          </div>
        )}
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
      {/* ── Atoms ── */}
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

      {/* Atoms 2×2 grid */}
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

      {/* ── Molecules ── */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
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
            Molécules
          </span>
          <div style={{ width: 40, height: 1, background: `${tok.primary}40` }} />
        </div>

        {/* Molecules 2×2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            overflow: "hidden",
            borderRadius: 12,
          }}
        >
          <InputFieldMolecule tok={tok} pos={{ col: 0, row: 0 }} />
          <SelectMolecule     tok={tok} pos={{ col: 1, row: 0 }} />
          <SnackbarMolecule   tok={tok} pos={{ col: 0, row: 1 }} />
          <KebabMenuMolecule  tok={tok} pos={{ col: 1, row: 1 }} />
        </div>
      </div>
    </div>
  );
}
