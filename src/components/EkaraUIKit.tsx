"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/* ─── Ekara design tokens ──────────────────────────────────────────── */

const LIGHT = {
  bg: "#fefefe",
  bgAlt: "#f4f4f4",
  bgTable: "#f9f9f9",
  surfaceCard: "#fefefe",
  text: "#292929",
  textSub: "#464646",
  textMuted: "#7c7c7c",
  textInv: "#fefefe",
  border: "#bdbdbd",
  borderDark: "#001719",
  primary: "#057b80",
  primaryHov: "#046a6e",
  primaryLight: "#effefd",
  error: "#d7312b",
  errorLight: "#fccecc",
  errorText: "#430e0c",
  success: "#3a8732",
  successLight: "#cbebc7",
  successText: "#0f260d",
  warning: "#e7660f",
  warningLight: "#fddcab",
  warningText: "#421808",
  info: "#3b71d5",
  infoLight: "#c6def7",
  infoText: "#1e2b4d",
  tagNormal: "#656565",
  surface: "#ffffff",
  shadow: "0 4px 20px rgba(0,0,0,0.08)",
  shadowMd: "0 8px 28px rgba(0,0,0,0.12)",
  shadowCard: "0 24px 64px -12px rgba(0,0,0,0.18)",
};

const DARK = {
  bg: "#1e1e1e",
  bgAlt: "#252525",
  bgTable: "#2a2a2a",
  surfaceCard: "#2a2a2a",
  text: "#f0f0f0",
  textSub: "#c8c8c8",
  textMuted: "#888888",
  textInv: "#fefefe",
  border: "#404040",
  borderDark: "#606060",
  primary: "#0ca4ab",
  primaryHov: "#0bb5bc",
  primaryLight: "#0c2e30",
  error: "#e85450",
  errorLight: "#3a1010",
  errorText: "#fbbaba",
  success: "#4aab42",
  successLight: "#102010",
  successText: "#a8f0a0",
  warning: "#f07a20",
  warningLight: "#3a1e05",
  warningText: "#f5c080",
  info: "#5a8ee8",
  infoLight: "#1a2545",
  infoText: "#a0c0f5",
  tagNormal: "#888888",
  surface: "#242424",
  shadow: "0 4px 20px rgba(0,0,0,0.4)",
  shadowMd: "0 8px 28px rgba(0,0,0,0.5)",
  shadowCard: "0 24px 64px -12px rgba(0,0,0,0.6)",
};

type Tok = typeof LIGHT;

const OS = "'Open Sans', system-ui, sans-serif";

/* ─── Shared hook ──────────────────────────────────────────────────── */

function useVariant(count: number) {
  const [v, setV] = useState(0);
  const next = useCallback(() => setV((c) => (c + 1) % count), [count]);
  return [v, next] as const;
}

/* ─── Card wrapper ─────────────────────────────────────────────────── */

function CompCard({
  name,
  variant,
  total,
  tok,
  children,
  onClick,
  minH = 140,
  noPad = false,
}: {
  name: string;
  variant: number;
  total: number;
  tok: Tok;
  children: React.ReactNode;
  onClick?: () => void;
  minH?: number;
  noPad?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: tok.bgAlt,
        borderRadius: 14,
        padding: noPad ? "0 0 12px 0" : "20px 16px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        minHeight: minH,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          overflow: "hidden",
          padding: noPad ? "16px 16px 4px" : 0,
        }}
      >
        {children}
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: noPad ? "0 16px" : 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: OS,
            fontWeight: 700,
            color: tok.textMuted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {name}
        </span>
        {total > 1 && (
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === variant ? 14 : 4,
                  height: 4,
                  borderRadius: 2,
                  background: i === variant ? tok.primary : tok.border,
                  transition: "width 200ms ease, background 200ms ease",
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

function TagComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(4);
  const variants = [
    { bg: tok.tagNormal, label: "Label", name: "Normal" },
    { bg: tok.success, label: "Label", name: "Succes" },
    { bg: tok.warning, label: "Label", name: "Warning" },
    { bg: tok.error, label: "Label", name: "Error" },
  ];
  const cur = variants[v];
  return (
    <CompCard name="Tag" variant={v} total={4} tok={tok} onClick={next}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            background: cur.bg,
            color: tok.textInv,
            fontFamily: OS,
            fontWeight: 700,
            fontSize: 12,
            padding: "4px 12px",
            borderRadius: 16,
            transition: "background 220ms ease",
          }}
        >
          {cur.label}
        </div>
        <span
          style={{
            fontSize: 11,
            fontFamily: OS,
            fontWeight: 600,
            color: tok.textMuted,
          }}
        >
          {cur.name}
        </span>
      </div>
    </CompCard>
  );
}

function CheckboxComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(4);
  const states = ["Default", "Checked", "Indeterminate", "Disabled"];
  return (
    <CompCard name="Checkbox" variant={v} total={4} tok={tok} onClick={next}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
        {[0, 1, 2, 3].map((s) => {
          const active = s === v;
          const isChecked = s === 1;
          const isIndet = s === 2;
          const isDisabled = s === 3;
          const boxBg =
            isChecked || isIndet
              ? active
                ? tok.primary
                : isDisabled
                ? tok.border
                : tok.primary
              : "transparent";
          const boxBorder =
            isDisabled
              ? tok.border
              : isChecked || isIndet
              ? tok.primary
              : tok.borderDark;
          return (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `1.5px solid ${boxBorder}`,
                  background: isChecked || isIndet ? tok.primary : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 150ms, border-color 150ms",
                  outline: active && !isDisabled ? `2px solid ${tok.primary}` : "none",
                  outlineOffset: 2,
                }}
              >
                {isChecked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#fefefe" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isIndet && (
                  <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
                    <path d="M1 1h6" stroke="#fefefe" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: OS,
                  fontWeight: 400,
                  color: tok.textSub,
                }}
              >
                {states[s]}
              </span>
            </div>
          );
        })}
      </div>
    </CompCard>
  );
}

function SwitchComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(3);
  const configs = [
    { on: false, disabled: false, label: "Off" },
    { on: true, disabled: false, label: "On" },
    { on: false, disabled: true, label: "Disabled" },
  ];
  const { on, disabled, label } = configs[v];
  return (
    <CompCard name="Switch" variant={v} total={3} tok={tok} onClick={next}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: disabled ? 0.45 : 1 }}>
          <div
            style={{
              position: "relative",
              width: 40,
              height: 24,
              borderRadius: 12,
              background: on ? tok.primary : tok.bgAlt,
              border: `1.5px solid ${on ? tok.primary : tok.border}`,
              transition: "background 200ms, border-color 200ms",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 2,
                left: on ? 16 : 2,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: on ? "#fefefe" : tok.textMuted,
                transition: "left 200ms cubic-bezier(0.4, 0, 0.2, 1), background 200ms",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </div>
          <span style={{ fontSize: 13, fontFamily: OS, fontWeight: 600, color: tok.textSub }}>
            {label}
          </span>
        </div>
      </div>
    </CompCard>
  );
}

function ButtonComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(3);
  const variants = [
    {
      label: "Primary",
      style: {
        background: tok.primary,
        color: tok.textInv,
        border: `1.5px solid ${tok.primary}`,
      },
    },
    {
      label: "Outline",
      style: {
        background: "transparent",
        color: tok.primary,
        border: `1.5px solid ${tok.primary}`,
      },
    },
    {
      label: "Ghost",
      style: {
        background: "transparent",
        color: tok.primary,
        border: "1.5px solid transparent",
      },
    },
  ];
  const cur = variants[v];
  return (
    <CompCard name="Button" variant={v} total={3} tok={tok} onClick={next}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <div
          style={{
            ...cur.style,
            fontFamily: OS,
            fontWeight: 700,
            fontSize: 13,
            padding: "8px 20px",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 200ms ease",
            letterSpacing: "0.01em",
          }}
        >
          {cur.label}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            opacity: 0.5,
          }}
        >
          <div
            style={{
              background: tok.primary,
              color: tok.textInv,
              fontFamily: OS,
              fontWeight: 700,
              fontSize: 10,
              padding: "4px 10px",
              borderRadius: 6,
              opacity: 0.5,
            }}
          >
            sm
          </div>
          <div
            style={{
              background: tok.error,
              color: tok.textInv,
              fontFamily: OS,
              fontWeight: 700,
              fontSize: 10,
              padding: "4px 10px",
              borderRadius: 6,
              opacity: 0.5,
            }}
          >
            error
          </div>
        </div>
      </div>
    </CompCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MOLECULES
═══════════════════════════════════════════════════════════════════ */

function InputFieldComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(5);
  const states = [
    { label: "Default", border: tok.border, labelColor: tok.textMuted, float: false, value: "", hint: "Helper text", icon: null },
    { label: "Active", border: tok.primary, labelColor: tok.primary, float: true, value: "", hint: "Helper text", icon: null },
    { label: "Filled", border: tok.primary, labelColor: tok.primary, float: true, value: "user@ekara.io", hint: "Helper text", icon: null },
    { label: "Error", border: tok.error, labelColor: tok.error, float: true, value: "invalid", hint: "This field is required", icon: "error" },
    { label: "Success", border: tok.success, labelColor: tok.success, float: true, value: "user@ekara.io", hint: "Email verified", icon: "check" },
  ];
  const s = states[v];
  return (
    <CompCard name="Input Field" variant={v} total={5} tok={tok} onClick={next} minH={160}>
      <div style={{ width: "100%", position: "relative" }}>
        {/* Floating label */}
        <div
          style={{
            position: "absolute",
            top: s.float ? -10 : 14,
            left: 12,
            fontSize: s.float ? 11 : 14,
            fontFamily: OS,
            fontWeight: s.float ? 600 : 400,
            color: s.labelColor,
            background: tok.bg,
            padding: "0 4px",
            transition: "top 180ms ease, font-size 180ms ease, color 180ms ease",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          Email
        </div>
        {/* Input box */}
        <div
          style={{
            width: "100%",
            height: 48,
            border: `1.5px solid ${s.border}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            padding: "0 40px 0 14px",
            background: tok.bg,
            transition: "border-color 180ms ease",
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontFamily: OS,
              fontWeight: 400,
              color: s.value ? tok.textSub : tok.border,
            }}
          >
            {s.value || ""}
          </span>
          {/* Status icon */}
          {s.icon && (
            <div
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: s.icon === "error" ? tok.error : tok.success,
              }}
            >
              {s.icon === "error" ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" fill="none" />
                  <path d="M8 4.5v4M8 10.5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          )}
        </div>
        {/* Hint text */}
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            fontFamily: OS,
            color: s.icon === "error" ? tok.error : s.icon === "check" ? tok.success : tok.textMuted,
            paddingLeft: 4,
          }}
        >
          {s.hint}
        </div>
      </div>
    </CompCard>
  );
}

function SelectComp({ tok }: { tok: Tok }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const options = ["Dashboard", "Mesures", "Scénarios", "Alertes"];
  const v = open ? 1 : selected ? 2 : 0;
  return (
    <CompCard
      name="Select"
      variant={v}
      total={3}
      tok={tok}
      onClick={() => setOpen((o) => !o)}
      minH={open ? 220 : 140}
    >
      <div style={{ width: "100%", position: "relative" }}>
        {/* Trigger */}
        <div
          style={{
            width: "100%",
            height: 48,
            border: `1.5px solid ${open ? tok.primary : tok.border}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            background: tok.bg,
            cursor: "pointer",
            transition: "border-color 180ms",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontFamily: OS,
              color: selected ? tok.textSub : tok.textMuted,
            }}
          >
            {selected ?? "Select an option"}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              color: tok.textMuted,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
            }}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              background: tok.bg,
              border: `1px solid ${tok.border}`,
              borderRadius: 8,
              boxShadow: tok.shadowMd,
              overflow: "hidden",
              zIndex: 10,
            }}
          >
            {options.map((opt) => (
              <div
                key={opt}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(opt);
                  setOpen(false);
                }}
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  fontFamily: OS,
                  fontWeight: selected === opt ? 600 : 400,
                  color: selected === opt ? tok.primary : tok.textSub,
                  background: selected === opt ? tok.primaryLight : "transparent",
                  cursor: "pointer",
                  transition: "background 120ms",
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    </CompCard>
  );
}

function AccordionComp({ tok }: { tok: Tok }) {
  const [open, setOpen] = useState(false);
  return (
    <CompCard
      name="Accordion"
      variant={open ? 1 : 0}
      total={2}
      tok={tok}
      onClick={() => setOpen((o) => !o)}
      minH={120}
    >
      <div
        style={{
          width: "100%",
          border: `1.25px solid ${tok.border}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: tok.bgTable,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontFamily: OS,
              fontWeight: 600,
              color: tok.textSub,
            }}
          >
            Section title
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              color: tok.textMuted,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 250ms ease",
            }}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Body */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: open ? 80 : 0,
            transition: "max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: tok.bg,
              borderTop: `1px solid ${tok.border}`,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontFamily: OS,
                fontWeight: 400,
                color: tok.textMuted,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Content appears here when the accordion is expanded and can contain any rich text or elements.
            </p>
          </div>
        </div>
      </div>
    </CompCard>
  );
}

function SnackbarComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(4);
  const alerts = [
    { type: "Info", bg: tok.infoLight, text: tok.infoText, icon: "info", border: tok.info },
    { type: "Success", bg: tok.successLight, text: tok.successText, icon: "check", border: tok.success },
    { type: "Warning", bg: tok.warningLight, text: tok.warningText, icon: "warn", border: tok.warning },
    { type: "Error", bg: tok.errorLight, text: tok.errorText, icon: "error", border: tok.error },
  ];
  const a = alerts[v];
  const icons: Record<string, React.ReactNode> = {
    info: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    check: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    warn: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L14.5 13H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 6v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    error: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  };
  return (
    <CompCard name="Snackbar" variant={v} total={4} tok={tok} onClick={next} minH={140}>
      <div
        style={{
          width: "100%",
          background: a.bg,
          borderRadius: 8,
          border: `1px solid ${a.border}22`,
          padding: "10px 14px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          transition: "background 250ms ease, border-color 250ms ease",
        }}
      >
        <div style={{ color: a.text, flexShrink: 0, marginTop: 1 }}>{icons[a.icon]}</div>
        <div>
          <div
            style={{
              fontSize: 12,
              fontFamily: OS,
              fontWeight: 700,
              color: a.text,
              marginBottom: 2,
            }}
          >
            {a.type} alert
          </div>
          <div style={{ fontSize: 11, fontFamily: OS, fontWeight: 400, color: a.text, lineHeight: 1.5, opacity: 0.85 }}>
            A brief description of what happened.
          </div>
        </div>
        <button
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: a.text,
            opacity: 0.6,
            padding: 2,
            flexShrink: 0,
          }}
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </CompCard>
  );
}

function KebabMenuComp({ tok }: { tok: Tok }) {
  const [open, setOpen] = useState(false);
  const items = [
    { icon: "edit", label: "Edit" },
    { icon: "duplicate", label: "Duplicate" },
    { icon: "link", label: "Associated scenarios" },
    { icon: "trash", label: "Delete" },
  ];
  const svgPaths: Record<string, string> = {
    edit: "M11 3L9 1 2 8v2h2L11 3z",
    duplicate: "M9 3H4a1 1 0 00-1 1v7a1 1 0 001 1h5a1 1 0 001-1V4a1 1 0 00-1-1zM7 1h2l1 1v1H7V1z",
    link: "M8.5 4.5l-5 5M5 4.5H2.5v5H7M7.5 11.5h2.5v-5H5.5",
    trash: "M3 4h8M5 4V2h4v2M5.5 7v4M8.5 7v4M4 4l.7 7h5.6L11 4",
  };
  return (
    <CompCard
      name="Kebab Menu"
      variant={open ? 1 : 0}
      total={2}
      tok={tok}
      onClick={() => setOpen((o) => !o)}
      minH={open ? 220 : 120}
    >
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        {/* Trigger button */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: `1px solid ${open ? tok.primary : tok.border}`,
            background: open ? tok.primaryLight : tok.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 180ms",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: open ? tok.primary : tok.textMuted }} />
            ))}
          </div>
        </div>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: 44,
              right: 0,
              background: tok.bg,
              border: `1px solid ${tok.border}`,
              borderRadius: 10,
              boxShadow: tok.shadowMd,
              width: 180,
              overflow: "hidden",
              zIndex: 10,
            }}
          >
            {items.map((item, i) => (
              <div
                key={item.label}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: i < items.length - 1 ? `1px solid ${tok.border}22` : "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: i === items.length - 1 ? tok.error : tok.textMuted }}>
                  <path d={svgPaths[item.icon]} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: OS,
                    fontWeight: 600,
                    color: i === items.length - 1 ? tok.error : tok.textSub,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </CompCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ORGANISMS
═══════════════════════════════════════════════════════════════════ */

function TableHeaderComp({ tok }: { tok: Tok }) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const cols = ["Name", "Status", "Response", "Uptime"];

  const handleSort = (i: number) => {
    if (sortCol === i) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(i);
      setSortDir("asc");
    }
  };

  return (
    <CompCard name="Table Header" variant={sortCol !== null ? 1 : 0} total={2} tok={tok} minH={100}>
      <div
        style={{
          width: "100%",
          background: tok.bgTable,
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${tok.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Checkbox col */}
          <div
            style={{
              width: 36,
              padding: "10px 0 10px 12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                border: `1.5px solid ${tok.border}`,
              }}
            />
          </div>
          {cols.map((col, i) => (
            <div
              key={col}
              onClick={() => handleSort(i)}
              style={{
                flex: 1,
                padding: "10px 8px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                background: sortCol === i ? `${tok.primary}08` : "transparent",
                transition: "background 150ms",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontFamily: OS,
                  fontWeight: 700,
                  color: sortCol === i ? tok.primary : tok.textSub,
                  whiteSpace: "nowrap",
                }}
              >
                {col}
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: sortCol === i ? tok.primary : tok.border, flexShrink: 0 }}>
                {sortCol === i && sortDir === "asc" ? (
                  <path d="M2 7l3-4 3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                ) : sortCol === i && sortDir === "desc" ? (
                  <path d="M2 3l3 4 3-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M2 4l3-2.5L8 4M2 6l3 2.5L8 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </div>
          ))}
        </div>
      </div>
    </CompCard>
  );
}

function TableCellComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(4);
  const rows = [
    {
      name: "dashboard-overview",
      status: { bg: tok.successLight, text: tok.success, label: "OK" },
      time: "143 ms",
      uptime: "99.8%",
    },
    {
      name: "scenario-runner",
      status: { bg: tok.warningLight, text: tok.warning, label: "Slow" },
      time: "1240 ms",
      uptime: "97.2%",
    },
    {
      name: "api-incidents",
      status: { bg: tok.errorLight, text: tok.error, label: "Down" },
      time: "—",
      uptime: "91.4%",
    },
    {
      name: "auth-service",
      status: { bg: tok.infoLight, text: tok.info, label: "Check" },
      time: "88 ms",
      uptime: "99.9%",
    },
  ];
  const r = rows[v];

  return (
    <CompCard name="Table Cell" variant={v} total={4} tok={tok} onClick={next} minH={100}>
      <div style={{ width: "100%", border: `1px solid ${tok.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: tok.bg,
            transition: "background 200ms",
          }}
        >
          <div style={{ width: 36, padding: "10px 0 10px 12px", flexShrink: 0 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${tok.border}` }} />
          </div>
          <div style={{ flex: 1, padding: "10px 8px", overflow: "hidden" }}>
            <span style={{ fontSize: 12, fontFamily: OS, fontWeight: 600, color: tok.textSub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
              {r.name}
            </span>
          </div>
          <div style={{ flex: 1, padding: "10px 8px" }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: OS,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 10,
                background: r.status.bg,
                color: r.status.text,
              }}
            >
              {r.status.label}
            </span>
          </div>
          <div style={{ flex: 1, padding: "10px 8px" }}>
            <span style={{ fontSize: 12, fontFamily: OS, fontWeight: 400, color: tok.textSub }}>{r.time}</span>
          </div>
          <div style={{ flex: 1, padding: "10px 8px" }}>
            <span style={{ fontSize: 12, fontFamily: OS, fontWeight: 400, color: tok.textSub }}>{r.uptime}</span>
          </div>
        </div>
      </div>
    </CompCard>
  );
}

function HeaderComp({ tok }: { tok: Tok }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = ["Dashboard", "Mesures", "Scénarios", "Alertes"];
  return (
    <CompCard
      name="Header"
      variant={menuOpen ? 1 : 0}
      total={2}
      tok={tok}
      noPad
      minH={menuOpen ? 160 : 100}
      onClick={() => setMenuOpen((o) => !o)}
    >
      <div style={{ width: "100%", background: tok.bg, borderBottom: `1px solid ${tok.border}`, padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", height: 52, gap: 12 }}>
          {/* Logo */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: tok.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, fontFamily: OS, fontWeight: 700, color: "#fefefe" }}>E</span>
          </div>
          <span style={{ fontSize: 14, fontFamily: OS, fontWeight: 700, color: tok.primary, flexShrink: 0 }}>ekara</span>

          {/* Nav */}
          <div style={{ display: "flex", gap: 2, flex: 1, overflow: "hidden" }}>
            {navItems.map((item, i) => (
              <div
                key={item}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: OS,
                  fontWeight: i === 0 ? 700 : 400,
                  color: i === 0 ? tok.primary : tok.textMuted,
                  background: i === 0 ? tok.primaryLight : "transparent",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: tok.bgAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: tok.textMuted }}>
                <path d="M7 1a3 3 0 010 6M7 1a3 3 0 000 6M4 11c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* User dropdown */}
        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              right: 16,
              top: 52,
              background: tok.bg,
              border: `1px solid ${tok.border}`,
              borderRadius: 10,
              boxShadow: tok.shadowMd,
              width: 160,
              overflow: "hidden",
              zIndex: 20,
            }}
          >
            {["Profile", "Settings", "Sign out"].map((item, i) => (
              <div
                key={item}
                style={{
                  padding: "9px 14px",
                  fontSize: 12,
                  fontFamily: OS,
                  fontWeight: 600,
                  color: i === 2 ? tok.error : tok.textSub,
                  cursor: "pointer",
                  borderBottom: i < 2 ? `1px solid ${tok.border}22` : "none",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </CompCard>
  );
}

function DatePickerComp({ tok }: { tok: Tok }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const today = 15;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  const startOffset = 2; // month starts on Wednesday

  return (
    <CompCard
      name="Date Picker"
      variant={open ? (selected ? 2 : 1) : 0}
      total={3}
      tok={tok}
      onClick={() => setOpen((o) => !o)}
      minH={open ? 280 : 120}
    >
      <div style={{ width: "100%", position: "relative" }}>
        {/* Input trigger */}
        <div
          style={{
            width: "100%",
            height: 44,
            border: `1.5px solid ${open ? tok.primary : tok.border}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            background: tok.bg,
            cursor: "pointer",
            transition: "border-color 180ms",
          }}
        >
          <span style={{ fontSize: 13, fontFamily: OS, color: selected ? tok.textSub : tok.textMuted }}>
            {selected ? `${String(selected).padStart(2, "0")}/08/2025` : "DD / MM / YYYY"}
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: tok.textMuted }}>
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>

        {/* Calendar */}
        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              background: tok.bg,
              border: `1px solid ${tok.border}`,
              borderRadius: 10,
              boxShadow: tok.shadowMd,
              padding: "12px",
              zIndex: 10,
            }}
          >
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ cursor: "pointer", color: tok.textMuted }}>
                <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 12, fontFamily: OS, fontWeight: 700, color: tok.text }}>August 2025</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ cursor: "pointer", color: tok.textMuted }}>
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {days.map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 10, fontFamily: OS, fontWeight: 700, color: tok.textMuted, padding: "2px 0" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Date grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
              {dates.map((d) => {
                const isToday = d === today;
                const isSel = d === selected;
                return (
                  <div
                    key={d}
                    onClick={() => { setSelected(d); }}
                    style={{
                      textAlign: "center",
                      fontSize: 11,
                      fontFamily: OS,
                      fontWeight: isSel || isToday ? 700 : 400,
                      color: isSel ? tok.textInv : isToday ? tok.primary : tok.textSub,
                      background: isSel ? tok.primary : isToday ? tok.primaryLight : "transparent",
                      borderRadius: "50%",
                      padding: "4px 0",
                      cursor: "pointer",
                      transition: "all 120ms",
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </CompCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WIDGETS
═══════════════════════════════════════════════════════════════════ */

function CardTotalIncidentsComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(3);
  const states = ["Default", "Edit", "Focus"];
  const rings = [null, `0 0 0 2px ${tok.info}`, `0 0 0 2px ${tok.primary}`];
  return (
    <CompCard name="Total Incidents" variant={v} total={3} tok={tok} onClick={next} minH={140}>
      <div
        style={{
          width: 130,
          background: tok.surfaceCard ?? tok.bg,
          borderRadius: 20,
          padding: "16px 16px 12px",
          boxShadow: v === 0 ? tok.shadowCard : tok.shadow,
          outline: rings[v] ?? "none",
          transition: "box-shadow 200ms, outline 200ms",
          position: "relative",
        }}
      >
        {v === 1 && (
          <div style={{ position: "absolute", top: 8, right: 8, color: tok.info, opacity: 0.8 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 2L7 .5 1.5 6v1.5H3L9 2z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <div style={{ fontSize: 13, fontFamily: OS, fontWeight: 600, color: tok.textMuted, marginBottom: 4 }}>
          Total Incidents
        </div>
        <div style={{ fontSize: 32, fontFamily: OS, fontWeight: 400, color: tok.text, lineHeight: 1 }}>
          164
        </div>
        <div style={{ fontSize: 12, fontFamily: OS, fontWeight: 400, color: tok.textSub, marginTop: 4, opacity: 0.7 }}>
          last 24 hours
        </div>
        <div style={{ marginTop: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontFamily: OS,
              fontWeight: 700,
              color: tok.error,
              background: tok.errorLight,
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            +12
          </span>
        </div>
        <div style={{ fontSize: 10, color: tok.textMuted, fontFamily: OS, marginTop: 4 }}>{states[v]}</div>
      </div>
    </CompCard>
  );
}

function CardTypologyComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(2);
  const dataviz = ["#057b80", "#e7660f", "#d7312b", "#e0c602", "#3b71d5", "#3a8732", "#9074b3", "#b23b8e", "#a86450"];
  const labels = ["HTTP", "Browser", "Scripted", "API", "Mobile", "Perf", "Security", "Custom", "Other"];
  const pcts = [28, 18, 14, 12, 10, 7, 5, 4, 2];
  let cumAngle = -90;
  const segments = pcts.map((pct, i) => {
    const angle = (pct / 100) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    const r = 36;
    const cx = 44;
    const cy = 44;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: dataviz[i], label: labels[i], pct };
  });

  return (
    <CompCard name="Card Typology" variant={v} total={2} tok={tok} onClick={next} minH={160}>
      <div
        style={{
          width: "100%",
          background: tok.surfaceCard ?? tok.bg,
          borderRadius: 16,
          padding: "12px 14px",
          boxShadow: v === 0 ? tok.shadow : tok.shadowMd,
          transition: "box-shadow 200ms",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Donut */}
        <div style={{ flexShrink: 0 }}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            {segments.map((seg, i) => (
              <path key={i} d={seg.path} fill={seg.color} />
            ))}
            <circle cx="44" cy="44" r="22" fill={tok.surfaceCard ?? tok.bg} />
          </svg>
        </div>
        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          {segments.slice(0, 6).map((seg) => (
            <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontFamily: OS, fontWeight: 400, color: tok.textSub, flex: 1 }}>{seg.label}</span>
              <span style={{ fontSize: 10, fontFamily: OS, fontWeight: 700, color: tok.textMuted }}>{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </CompCard>
  );
}

function CardEkaraGreenComp({ tok }: { tok: Tok }) {
  const [v, next] = useVariant(2);
  const score = 98.5;
  const bar = score / 100;
  return (
    <CompCard name="Ekara Score" variant={v} total={2} tok={tok} onClick={next} minH={140}>
      <div
        style={{
          width: 130,
          background: v === 0 ? tok.surfaceCard ?? tok.bg : tok.primaryLight,
          borderRadius: 20,
          padding: "16px 16px 14px",
          boxShadow: tok.shadow,
          border: v === 1 ? `2px solid ${tok.primary}` : "2px solid transparent",
          transition: "all 220ms ease",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: tok.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 9l3 3 5-6" stroke="#fefefe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: 11, fontFamily: OS, fontWeight: 600, color: tok.textMuted, marginBottom: 2 }}>
          Ekara Score
        </div>
        <div style={{ fontSize: 26, fontFamily: OS, fontWeight: 700, color: tok.primary, lineHeight: 1 }}>
          {score}%
        </div>
        <div
          style={{
            marginTop: 8,
            height: 4,
            borderRadius: 2,
            background: tok.border,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${bar * 100}%`,
              borderRadius: 2,
              background: tok.primary,
            }}
          />
        </div>
      </div>
    </CompCard>
  );
}

function CardTop5Comp({ tok }: { tok: Tok }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const pages = [
    { name: "/reports/annual", time: 4280 },
    { name: "/scenarios/run", time: 3120 },
    { name: "/mesures/live", time: 2840 },
    { name: "/api/incidents", time: 1960 },
    { name: "/dashboard", time: 1340 },
  ];
  const max = pages[0].time;
  return (
    <CompCard name="Top 5 Slowest" variant={hovered !== null ? 1 : 0} total={2} tok={tok} minH={180}>
      <div
        style={{
          width: "100%",
          background: tok.surfaceCard ?? tok.bg,
          borderRadius: 14,
          padding: "12px 14px",
          boxShadow: tok.shadow,
        }}
      >
        <div style={{ fontSize: 11, fontFamily: OS, fontWeight: 700, color: tok.text, marginBottom: 10 }}>
          Top 5 Slowest Pages
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pages.map((p, i) => (
            <div
              key={p.name}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                cursor: "default",
                padding: "3px 0",
                transition: "opacity 150ms",
                opacity: hovered !== null && hovered !== i ? 0.4 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontFamily: OS, fontWeight: 400, color: tok.textSub, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 10, fontFamily: OS, fontWeight: 700, color: i === 0 ? tok.error : i === 1 ? tok.warning : tok.textMuted }}>
                  {p.time} ms
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: tok.bgAlt, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(p.time / max) * 100}%`,
                    borderRadius: 2,
                    background: i === 0 ? tok.error : i === 1 ? tok.warning : tok.primary,
                    opacity: hovered === i ? 1 : 0.7,
                    transition: "opacity 150ms",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CompCard>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   SECTION LAYOUT
═══════════════════════════════════════════════════════════════════ */

function Section({
  label,
  tok,
  children,
}: {
  label: string;
  tok: Tok;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
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
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: `${tok.primary}30` }} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */

export default function EkaraUIKit() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const tok = theme === "light" ? LIGHT : DARK;

  return (
    <div
      style={{
        background: tok.bg,
        borderRadius: 16,
        padding: "24px 20px",
        border: `1px solid ${tok.border}`,
        fontFamily: OS,
        transition: "background 280ms ease, border-color 280ms ease",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: tok.text, letterSpacing: "-0.01em" }}>
            UI Kit
          </div>
          <div style={{ fontSize: 11, color: tok.textMuted, marginTop: 1, fontWeight: 400 }}>
            Click components to cycle states
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 20,
            border: `1.5px solid ${tok.border}`,
            background: tok.bgAlt,
            cursor: "pointer",
            transition: "all 200ms",
            color: tok.textSub,
            fontFamily: OS,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {theme === "light" ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1.05 1.05M10.35 10.35l1.05 1.05M2.6 11.4l1.05-1.05M10.35 3.65l1.05-1.05" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M12 8.4A5.4 5.4 0 015.6 2a5.4 5.4 0 100 10 5.4 5.4 0 006.4-3.6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Dark
            </>
          )}
        </button>
      </div>

      {/* Atom section */}
      <Section label="Atomes" tok={tok}>
        <TagComp tok={tok} />
        <CheckboxComp tok={tok} />
        <SwitchComp tok={tok} />
        <ButtonComp tok={tok} />
      </Section>

      {/* Molecule section */}
      <Section label="Molécules" tok={tok}>
        <InputFieldComp tok={tok} />
        <SelectComp tok={tok} />
        <AccordionComp tok={tok} />
        <SnackbarComp tok={tok} />
        <KebabMenuComp tok={tok} />
      </Section>

      {/* Organism section */}
      <Section label="Organismes" tok={tok}>
        <HeaderComp tok={tok} />
        <TableHeaderComp tok={tok} />
        <TableCellComp tok={tok} />
        <DatePickerComp tok={tok} />
      </Section>

      {/* Widget section */}
      <Section label="Widgets" tok={tok}>
        <CardTotalIncidentsComp tok={tok} />
        <CardTypologyComp tok={tok} />
        <CardEkaraGreenComp tok={tok} />
        <CardTop5Comp tok={tok} />
      </Section>
    </div>
  );
}
