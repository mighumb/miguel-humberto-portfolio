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
  // input/hover/stroke
  inputHoverStroke: "#464646",
  // item-menu tokens
  menuText: "#464646",
  menuHoverBg: "#f2f2f2",
  menuSurface: "#fefefe",
  // snackbar & alert — exact Figma tokens
  snack: {
    warning: { bg: "#fddcab", text: "#421808", icon: "#b45309" },
    error:   { bg: "#fccecc", text: "#430e0c", icon: "#c0271f" },
    success: { bg: "#cbebc7", text: "#0f260d", icon: "#2f7028" },
    info:    { bg: "#c6def7", text: "#1e2b4d", icon: "#2058a8" },
  },
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
  inputHoverStroke: "#c8c8c8",
  menuText: "#c8c8c8",
  menuHoverBg: "#2a2a2a",
  menuSurface: "#242424",
  snack: {
    warning: { bg: "#3d2a12", text: "#fddcab", icon: "#f0a35c" },
    error:   { bg: "#3d1d1c", text: "#fccecc", icon: "#ef7a75" },
    success: { bg: "#1c3319", text: "#cbebc7", icon: "#7fc276" },
    info:    { bg: "#1b2a3d", text: "#c6def7", icon: "#7aaef0" },
  },
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
  raised,
  children,
}: {
  name: string;
  v: number;
  total: number;
  onClick: () => void;
  tok: Tok;
  pos: CellPos;
  /** Lifts the cell above its siblings so an open dropdown isn't painted over. */
  raised?: boolean;
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
        zIndex: raised ? 5 : undefined,
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
// Figma (node 5920:18688), size S: track 40×24, knob 28 — the knob is LARGER
// than the track and overhangs it by 4px horizontally / 2px vertically.
function SwitchAtom({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(3);
  const [hov, setHov] = useState(false);
  const states = [
    { on: false, disabled: false },
    { on: true,  disabled: false },
    { on: false, disabled: true  },
  ];
  const s = states[v];

  const TRACK_W = 40;
  const TRACK_H = 24;
  const KNOB    = 28;
  const OFF_X   = -4;                        // overhangs the left edge
  const ON_X    = TRACK_W - KNOB + 4;        // overhangs the right edge

  const trackBg = s.disabled ? tok.border : s.on ? tok.switchOnBg : tok.switchOffBg;
  const knobBg  = s.disabled ? tok.textMuted : s.on ? tok.primary : tok.textInv;
  const knobLeft = s.disabled
    ? (s.on ? ON_X : OFF_X)
    : s.on
      ? (hov ? ON_X - 4 : ON_X)
      : (hov ? OFF_X + 4 : OFF_X);

  return (
    <AtomCell name="Switch" v={v} total={3} onClick={next} tok={tok} pos={pos}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: 4, // room for the knob's left overhang
          opacity: s.disabled ? 0.38 : 1,
          transition: "opacity 200ms ease",
        }}
      >
        <div
          style={{
            position: "relative",
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            background: trackBg,
            flexShrink: 0,
            transition: "background 220ms ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: (TRACK_H - KNOB) / 2,
              left: knobLeft,
              width: KNOB,
              height: KNOB,
              borderRadius: "50%",
              background: knobBg,
              transition: "left 220ms cubic-bezier(0.4, 0, 0.2, 1), background 220ms ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.16)",
            }}
          />
        </div>
        {/* text/body-2 #464646, Open Sans SemiBold 14 */}
        <span style={{ fontSize: 14, fontFamily: OS, fontWeight: 600, color: tok.menuText }}>
          Label
        </span>
      </div>
    </AtomCell>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MOLECULES
═══════════════════════════════════════════════════════════════════ */

// 5 — INPUT FIELD (password)
function LockIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 16.5H12.009M12 14.5L12 15.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.26781 18.8447L5.13499 18.7279L5.13498 18.7279L4.26781 18.8447ZM7.55966 21.9009L7.51947 22.775H7.51949L7.55966 21.9009ZM16.4403 21.9009L16.4805 22.775H16.4805L16.4403 21.9009ZM19.7322 18.8447L18.865 18.7279L18.865 18.7279L19.7322 18.8447ZM19.7322 12.1553L18.865 12.2721L18.865 12.2721L19.7322 12.1553ZM16.4403 9.09909L16.4805 8.22501H16.4805L16.4403 9.09909ZM7.55966 9.09909L7.51948 8.22501H7.51947L7.55966 9.09909ZM4.26781 12.1553L5.13498 12.2721L5.13499 12.2721L4.26781 12.1553ZM6.625 9C6.625 9.48325 7.01675 9.875 7.5 9.875C7.98325 9.875 8.375 9.48325 8.375 9H7.5H6.625ZM15.625 9C15.625 9.48325 16.0168 9.875 16.5 9.875C16.9832 9.875 17.375 9.48325 17.375 9H16.5H15.625ZM4.26781 18.8447L3.40063 18.9615C3.67998 21.0363 5.399 22.6775 7.51947 22.775L7.55966 21.9009L7.59985 21.0268C6.35326 20.9695 5.3054 19.9937 5.13499 18.7279L4.26781 18.8447ZM7.55966 21.9009L7.51949 22.775C8.94986 22.8407 10.4023 22.875 12 22.875V22V21.125C10.4283 21.125 9.00268 21.0913 7.59983 21.0268L7.55966 21.9009ZM12 22V22.875C13.5977 22.875 15.0501 22.8407 16.4805 22.775L16.4403 21.9009L16.4001 21.0268C14.9973 21.0913 13.5717 21.125 12 21.125V22ZM16.4403 21.9009L16.4805 22.775C18.601 22.6775 20.32 21.0363 20.5994 18.9615L19.7322 18.8447L18.865 18.7279C18.6946 19.9937 17.6468 20.9695 16.4001 21.0268L16.4403 21.9009ZM19.7322 18.8447L20.5994 18.9615C20.7478 17.8594 20.875 16.6965 20.875 15.5H20H19.125C19.125 16.5787 19.0102 17.65 18.865 18.7279L19.7322 18.8447ZM20 15.5H20.875C20.875 14.3035 20.7478 13.1406 20.5994 12.0385L19.7322 12.1553L18.865 12.2721C19.0102 13.35 19.125 14.4213 19.125 15.5H20ZM19.7322 12.1553L20.5994 12.0385C20.32 9.96367 18.601 8.3225 16.4805 8.22501L16.4403 9.09909L16.4001 9.97317C17.6468 10.0305 18.6946 11.0063 18.865 12.2721L19.7322 12.1553ZM16.4403 9.09909L16.4805 8.22501C15.0501 8.15926 13.5977 8.125 12 8.125V9V9.875C13.5717 9.875 14.9973 9.90868 16.4001 9.97317L16.4403 9.09909ZM12 9V8.125C10.4023 8.125 8.94987 8.15926 7.51948 8.22501L7.55966 9.09909L7.59984 9.97317C9.00267 9.90868 10.4283 9.875 12 9.875V9ZM7.55966 9.09909L7.51947 8.22501C5.399 8.3225 3.67998 9.96367 3.40063 12.0385L4.26781 12.1553L5.13499 12.2721C5.3054 11.0063 6.35326 10.0305 7.59985 9.97317L7.55966 9.09909ZM4.26781 12.1553L3.40063 12.0385C3.25225 13.1406 3.125 14.3034 3.125 15.5H4H4.875C4.875 14.4214 4.98985 13.35 5.13498 12.2721L4.26781 12.1553ZM4 15.5H3.125C3.125 16.6966 3.25225 17.8594 3.40063 18.9615L4.26781 18.8447L5.13498 18.7279C4.98985 17.65 4.875 16.5786 4.875 15.5H4ZM7.5 9H8.375V6.5H7.5H6.625V9H7.5ZM7.5 6.5H8.375C8.375 4.49797 9.99797 2.875 12 2.875V2V1.125C9.03147 1.125 6.625 3.53147 6.625 6.5H7.5ZM12 2V2.875C14.002 2.875 15.625 4.49797 15.625 6.5H16.5H17.375C17.375 3.53147 14.9686 1.125 12 1.125V2ZM16.5 6.5H15.625V9H16.5H17.375V6.5H16.5Z" fill={color} />
    </svg>
  );
}

function EyeOpenIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M22 13C22 13 18 19 12 19C6 19 2 13 2 13" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="12.4998" r="2.5" stroke={color} strokeWidth="1.75" />
      <path d="M22 13.0002C22 13.0002 18 7.00024 12 7.00024C6 7.00024 2 13.0002 2 13.0002" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M15 7.5L16.5 5" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 10L22 8" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 8L4 10" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7.5L7.5 5" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeClosedIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M22 8C22 8 18 14 12 14C6 14 2 8 2 8" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M15 13.5L16.5 16" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 11L22 13" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 13L4 11" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13.5L7.5 16" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InputFieldMolecule({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(6);
  const [showPw, setShowPw] = useState(false);
  const [hov, setHov] = useState(false);

  const states = [
    { label: "Default",  active: false, filled: false, error: false, success: false, disabled: false, helper: "" },
    { label: "Active",   active: true,  filled: false, error: false, success: false, disabled: false, helper: "" },
    { label: "Filled",   active: false, filled: true,  error: false, success: false, disabled: false, helper: "" },
    { label: "Error",    active: false, filled: true,  error: true,  success: false, disabled: false, helper: "Incorrect password" },
    { label: "Success",  active: false, filled: true,  error: false, success: true,  disabled: false, helper: "Password accepted" },
    { label: "Disabled", active: false, filled: false, error: false, success: false, disabled: true,  helper: "" },
  ];
  const s = states[v];
  const floated   = s.active || s.filled;
  const iconColor = tok.textMuted;

  const borderColor =
    s.error   ? tok.error   :
    s.success ? tok.success :
    s.active  ? tok.primary :
    hov && !s.disabled ? tok.inputHoverStroke :
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
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            position: "relative",
            height: 52,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            border: `1.25px solid ${borderColor}`,
            borderRadius: 8,
            background: tok.cellBg,
            transition: "border-color 200ms",
          }}
        >
          <LockIcon color={iconColor} />

          {/* Floating label — floats to left edge of field, not after icon */}
          <span
            style={{
              position: "absolute",
              left: floated ? 12 : 40,
              top: floated ? -10 : "50%",
              transform: floated ? "none" : "translateY(-50%)",
              fontSize: floated ? 11 : 14,
              fontFamily: OS,
              fontWeight: floated ? 600 : 400,
              color: labelColor,
              background: floated ? tok.cellBg : "transparent",
              padding: floated ? "0 4px" : 0,
              transition: "left 180ms ease, top 180ms ease, font-size 180ms ease, color 180ms ease",
              pointerEvents: "none",
              lineHeight: 1.2,
              zIndex: 1,
            }}
          >
            Password
          </span>

          {floated ? (
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontFamily: OS,
                color: tok.textSub,
                letterSpacing: showPw ? "normal" : "0.15em",
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPw ? "MyP@ssw0rd" : "••••••••"}
              {s.active && (
                <span
                  style={{
                    display: "inline-block",
                    width: 1,
                    height: 16,
                    background: tok.text,
                    marginLeft: 2,
                    verticalAlign: "middle",
                    letterSpacing: "normal",
                  }}
                />
              )}
            </span>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {floated && (
            <div
              onClick={(e) => { e.stopPropagation(); setShowPw((p) => !p); }}
              style={{ flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {showPw ? <EyeOpenIcon color={iconColor} /> : <EyeClosedIcon color={iconColor} />}
            </div>
          )}
        </div>

        {s.helper && (
          <div style={{ marginTop: 5, fontSize: 11, fontFamily: OS, color: s.error ? tok.error : tok.success, paddingLeft: 4 }}>
            {s.helper}
          </div>
        )}
      </div>
    </AtomCell>
  );
}

// 6 — SELECT
const SELECT_ITEMS = ["None", "Placeholder text 1", "Placeholder text 2", "Placeholder text 3"];

function SelectMolecule({ tok, pos }: { tok: Tok; pos: CellPos }) {
  // A single click opens it, like a real select.
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [hov, setHov] = useState(false);
  const [itemHov, setItemHov] = useState<number | null>(null);

  // input/default #bdbdbd — input/hover #464646 — input/active #057b80
  const triggerBorder = open ? tok.primary : hov ? tok.inputHoverStroke : tok.border;

  return (
    <AtomCell
      name="Select"
      v={open ? 1 : 0}
      total={2}
      onClick={() => setOpen((o) => !o)}
      tok={tok}
      pos={pos}
      raised={open}
    >
      <div style={{ width: "100%", maxWidth: 220, position: "relative" }}>
        {/* Trigger — radius stays 8px on all corners in every state */}
        <div
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 44,
            padding: "0 12px",
            border: `1.25px solid ${triggerBorder}`,
            borderRadius: 8,
            background: tok.cellBg,
            transition: "border-color 200ms",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontFamily: OS,
              fontWeight: 400,
              color: selected === 0 ? tok.textMuted : tok.textSub,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {SELECT_ITEMS[selected]}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms", flexShrink: 0 }}
          >
            <path d="M6 9l6 6 6-6" stroke={tok.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Dropdown — detached floating card: 4px gap, own 8px radius, shadow, no border, no dividers */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              borderRadius: 8,
              background: tok.menuSurface,
              padding: "6px 0",
              boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
              zIndex: 2,
            }}
          >
            {SELECT_ITEMS.map((item, i) => {
              const isActive = i === selected;
              return (
                <div
                  key={i}
                  onMouseEnter={(e) => { e.stopPropagation(); setItemHov(i); }}
                  onMouseLeave={() => setItemHov(null)}
                  onClick={(e) => {
                    // Pick the value without letting AtomCell toggle the panel back open.
                    e.stopPropagation();
                    setSelected(i);
                    setOpen(false);
                    setItemHov(null);
                  }}
                  style={{
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 16px",
                    fontSize: 14,
                    fontFamily: OS,
                    fontWeight: 600,
                    // item-menu/active: bg #effefd, text #057b80
                    color: isActive ? tok.primary : tok.menuText,
                    background:
                      isActive ? tok.primaryLight
                      : itemHov === i ? tok.menuHoverBg
                      : "transparent",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "background 150ms, color 150ms",
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AtomCell>
  );
}

// 7 — SNACKBAR
function SnackbarIcon({ type, color }: { type: "warning" | "error" | "success" | "info"; color: string }) {
  if (type === "warning") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 9.5v4" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill={color} />
    </svg>
  );
  if (type === "error") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.75" />
      <path d="M12 7v6" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill={color} />
    </svg>
  );
  if (type === "success") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.75" />
      <path d="M7.8 12.2l2.9 2.9 5.5-6" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.75" />
      <circle cx="12" cy="7.8" r="1" fill={color} />
      <path d="M12 11.5v5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

const SNACKBAR_DEFS = [
  { key: "warning" as const, label: "Warning" },
  { key: "error"   as const, label: "Error"   },
  { key: "success" as const, label: "Succes"  },
  { key: "info"    as const, label: "Information" },
];

function SnackbarMolecule({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(4);
  const def = SNACKBAR_DEFS[v];
  const c   = tok.snack[def.key];

  return (
    <AtomCell name="Snackbar" v={v} total={4} onClick={next} tok={tok} pos={pos}>
      {/* Figma: pl-16 pr-12 py-8, gap 8, radius 8, no border */}
      <div
        style={{
          width: "100%",
          maxWidth: 300,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px 8px 16px",
          borderRadius: 8,
          background: c.bg,
          transition: "background 200ms",
        }}
      >
        {/* Only the icon carries the type colour */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          <SnackbarIcon type={def.key} color={c.icon} />
        </div>

        {/* Message — Open Sans SemiBold 14, type text colour */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            fontFamily: OS,
            fontWeight: 600,
            color: c.text,
            lineHeight: 1.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Snackbar supporting text
        </span>

        {/* Action — Open Sans Bold, same dark type text colour (never the icon colour) */}
        <span
          style={{
            fontSize: 12,
            fontFamily: OS,
            fontWeight: 700,
            color: c.text,
            flexShrink: 0,
            padding: "0 4px",
          }}
        >
          Action
        </span>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M18 6L6 18M6 6l12 12" stroke={c.text} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </AtomCell>
  );
}

// 8 — KEBAB MENU
const KEBAB_ITEMS = [
  {
    label: "Export",
    icon: (c: string) => (
      <path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Share",
    icon: (c: string) => (
      <>
        <circle cx="18" cy="5"  r="3" stroke={c} strokeWidth="1.5" />
        <circle cx="6"  cy="12" r="3" stroke={c} strokeWidth="1.5" />
        <circle cx="18" cy="19" r="3" stroke={c} strokeWidth="1.5" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Delete",
    icon: (c: string) => (
      <>
        <polyline points="3 6 5 6 21 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"
          stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </>
    ),
  },
];

function KebabMenuMolecule({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(2);
  const [itemHov, setItemHov] = useState<number | null>(null);
  const [trigHov, setTrigHov] = useState(false);
  const isOpen = v === 1;
  const dotColor = isOpen ? tok.primary : tok.text;

  return (
    <AtomCell name="Kebab Menu" v={v} total={2} onClick={next} tok={tok} pos={pos} raised={isOpen}>
      {/* Anchor is only as tall as the trigger, so the cell never resizes.
          The block inside is centred on the anchor, so opening the menu
          slides the trigger up instead of pushing the grid around. */}
      <div style={{ position: "relative", width: 140, height: 40 }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center", // centred in the showcase cell, trigger over the card
          }}
        >
          {/* Trigger — 40×40 circular, 4px dots spread over 20px */}
          <div
            onMouseEnter={() => setTrigHov(true)}
            onMouseLeave={() => setTrigHov(false)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              // hover = grey, active/open = primary tint
              background:
                isOpen   ? tok.primaryLight
                : trigHov ? tok.menuHoverBg
                : "transparent",
              transition: "background 200ms",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="4"  r="2" fill={dotColor} />
              <circle cx="12" cy="12" r="2" fill={dotColor} />
              <circle cx="12" cy="20" r="2" fill={dotColor} />
            </svg>
          </div>

          {/* Menu card — shadow only, no border, no dividers */}
          {isOpen && (
            <div
              style={{
                width: "100%",
                borderRadius: 8,
                background: tok.menuSurface,
                padding: "10px 0",
                overflow: "hidden",
                boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
              }}
            >
              {KEBAB_ITEMS.map((item, i) => {
                const c = item.label === "Delete" ? tok.error : tok.menuText;
                return (
                  <div
                    key={item.label}
                    onMouseEnter={(e) => { e.stopPropagation(); setItemHov(i); }}
                    onMouseLeave={() => setItemHov(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      height: 44,
                      padding: "0 20px 0 12px",
                      fontSize: 14,
                      fontFamily: OS,
                      fontWeight: 600,
                      color: c,
                      background: itemHov === i ? tok.menuHoverBg : "transparent",
                      transition: "background 150ms",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      {item.icon(c)}
                    </svg>
                    {item.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AtomCell>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ORGANISMS
═══════════════════════════════════════════════════════════════════ */

// 9 — ACCORDION
function AccordionOrganism({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [open, next] = useVariant(2);
  const isOpen = open === 1;
  const [hov, setHov] = useState(false);

  return (
    <AtomCell name="Accordion" v={open} total={2} onClick={next} tok={tok} pos={pos} raised={isOpen}>
      <div
        style={{
          width: "100%",
          maxWidth: 296,
          border: `1px solid ${tok.divider}`,
          borderRadius: 8,
          background: tok.cellBg,
          overflow: "hidden",
        }}
      >
        <div
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 48,
            padding: "0 16px",
            background: hov ? tok.menuHoverBg : "transparent",
            transition: "background 150ms",
          }}
        >
          <span style={{ fontSize: 14, fontFamily: OS, fontWeight: 700, color: tok.text }}>
            Section title
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms", flexShrink: 0 }}
          >
            <path d="M6 9l6 6 6-6" stroke={tok.textSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {isOpen && (
          <div style={{ padding: "0 16px 16px" }}>
            <p style={{ margin: 0, fontSize: 13, fontFamily: OS, fontWeight: 400, color: tok.textSub, lineHeight: 1.6 }}>
              Contenu déplié de la section, révélé au clic sur l&apos;en-tête.
            </p>
          </div>
        )}
      </div>
    </AtomCell>
  );
}

// 10 — SELECT INPUT FILTER
const FILTER_ITEMS = ["Statut", "Priorité", "Assigné"];

function SelectInputFilterOrganism({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([true, false, false]);
  const [hov, setHov] = useState(false);
  const [itemHov, setItemHov] = useState<number | null>(null);

  const activeCount = checked.filter(Boolean).length;
  const triggerBorder = open ? tok.primary : hov ? tok.inputHoverStroke : tok.border;

  return (
    <AtomCell
      name="Select Input Filter"
      v={open ? 1 : 0}
      total={2}
      onClick={() => setOpen((o) => !o)}
      tok={tok}
      pos={pos}
      raised={open}
    >
      <div style={{ width: "100%", maxWidth: 296, position: "relative" }}>
        {/* Trigger */}
        <div
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 44,
            padding: "0 12px",
            border: `1.25px solid ${triggerBorder}`,
            borderRadius: 8,
            background: tok.cellBg,
            transition: "border-color 200ms",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M4 5h16M7 12h10M10 19h4" stroke={tok.textSub} strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <span
              style={{
                fontSize: 14,
                fontFamily: OS,
                fontWeight: 400,
                color: tok.textSub,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Filtrer
            </span>
            {activeCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: OS,
                  fontWeight: 700,
                  color: tok.primary,
                  background: tok.primaryLight,
                  borderRadius: 10,
                  padding: "2px 7px",
                  flexShrink: 0,
                }}
              >
                {activeCount}
              </span>
            )}
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms", flexShrink: 0 }}
          >
            <path d="M6 9l6 6 6-6" stroke={tok.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Dropdown — checkbox list, same detached-card treatment as Select */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              borderRadius: 8,
              background: tok.menuSurface,
              padding: "6px 0",
              boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
              zIndex: 2,
            }}
          >
            {FILTER_ITEMS.map((item, i) => (
              <div
                key={item}
                onMouseEnter={(e) => { e.stopPropagation(); setItemHov(i); }}
                onMouseLeave={() => setItemHov(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setChecked((c) => c.map((val, idx) => (idx === i ? !val : val)));
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  height: 36,
                  padding: "0 16px",
                  background: itemHov === i ? tok.menuHoverBg : "transparent",
                  transition: "background 150ms",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    flexShrink: 0,
                    border: `1.5px solid ${checked[i] ? tok.primary : tok.borderDark}`,
                    background: checked[i] ? tok.primary : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 150ms, border-color 150ms",
                  }}
                >
                  {checked[i] && (
                    <svg width="9" height="7" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l4 4 6-8" stroke="#effefd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, fontFamily: OS, fontWeight: 600, color: tok.menuText }}>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AtomCell>
  );
}

// 11 — DATE PICKER (Style=Simple)
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function DatePickerSimpleOrganism({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(14);

  const monthIdx = ((7 + monthOffset) % 12 + 12) % 12;
  const daysInMonth = new Date(2026, monthIdx + 1, 0).getDate();
  const firstDayOffset = (new Date(2026, monthIdx, 1).getDay() + 6) % 7; // Monday-first

  // Always pad to 6 full weeks so the grid height never changes between months.
  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length < 42) cells.push(null);

  return (
    <AtomCell name="Date Picker" v={0} total={1} onClick={() => {}} tok={tok} pos={pos}>
      <div
        style={{
          width: "100%",
          maxWidth: 296,
          border: `1px solid ${tok.divider}`,
          borderRadius: 10,
          background: tok.cellBg,
          padding: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMonthOffset((m) => m - 1); }}
            style={{ display: "flex", background: "none", border: "none", cursor: "pointer", padding: 4, color: tok.textSub }}
            aria-label="Mois précédent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{ fontSize: 13, fontFamily: OS, fontWeight: 700, color: tok.text }}>
            {MONTHS[monthIdx]} 2026
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setMonthOffset((m) => m + 1); }}
            style={{ display: "flex", background: "none", border: "none", cursor: "pointer", padding: 4, color: tok.textSub }}
            aria-label="Mois suivant"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              style={{ textAlign: "center", fontSize: 10, fontFamily: OS, fontWeight: 700, color: tok.textMuted, padding: "4px 0" }}
            >
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((day, i) => {
            const isSelected = day !== null && monthOffset === 0 && day === selectedDay;
            return (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); if (day !== null) setSelectedDay(day); }}
                style={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontFamily: OS,
                  fontWeight: isSelected ? 700 : 400,
                  color: day === null ? "transparent" : isSelected ? tok.textInv : tok.textSub,
                  background: isSelected ? tok.primary : "transparent",
                  borderRadius: 6,
                  cursor: day !== null ? "pointer" : "default",
                  transition: "background 150ms, color 150ms",
                }}
              >
                {day ?? "·"}
              </div>
            );
          })}
        </div>
      </div>
    </AtomCell>
  );
}

// 12 — CARD REPLAY
function CardReplayOrganism({ tok, pos }: { tok: Tok; pos: CellPos }) {
  const [v, next] = useVariant(2);
  const hov = v === 1;

  return (
    <AtomCell name="Card Replay" v={v} total={2} onClick={next} tok={tok} pos={pos}>
      <div
        style={{
          width: "100%",
          maxWidth: 280,
          borderRadius: 10,
          overflow: "hidden",
          background: tok.cellBg,
          border: `1px solid ${tok.divider}`,
          boxShadow: hov ? "0 8px 20px rgba(0,0,0,0.16)" : "0 1px 2px rgba(0,0,0,0.06)",
          transform: hov ? "translateY(-2px)" : "none",
          transition: "box-shadow 200ms, transform 200ms",
        }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "16/10",
            background: "var(--placeholder)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: hov ? tok.primary : "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: hov ? "scale(1.08)" : "scale(1)",
              transition: "background 200ms, transform 200ms",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={hov ? "#fefefe" : "#292929"}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              fontSize: 10,
              fontFamily: OS,
              fontWeight: 700,
              color: "#fefefe",
              background: "rgba(0,0,0,0.6)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            04:12
          </span>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 13, fontFamily: OS, fontWeight: 700, color: tok.text, marginBottom: 4 }}>
            Session replay
          </div>
          <div style={{ fontSize: 11, fontFamily: OS, fontWeight: 400, color: tok.textMuted }}>
            Aujourd&apos;hui, 14:32
          </div>
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

      {/* ── Organismes ── */}
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
            Organismes
          </span>
          <div style={{ width: 40, height: 1, background: `${tok.primary}40` }} />
        </div>

        {/* Organisms 2×2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            overflow: "hidden",
            borderRadius: 12,
          }}
        >
          <AccordionOrganism         tok={tok} pos={{ col: 0, row: 0 }} />
          <SelectInputFilterOrganism tok={tok} pos={{ col: 1, row: 0 }} />
          <DatePickerSimpleOrganism  tok={tok} pos={{ col: 0, row: 1 }} />
          <CardReplayOrganism        tok={tok} pos={{ col: 1, row: 1 }} />
        </div>
      </div>
    </div>
  );
}
