"use client";

export function BackgroundEffects() {
  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: "var(--am-radial-bg)" }} />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--am-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--am-grid-line) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </>
  );
}
