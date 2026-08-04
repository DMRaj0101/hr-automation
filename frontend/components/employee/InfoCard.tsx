"use client";

import React from "react";

export interface InfoField {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function handleRowMouseMove(e: React.MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  e.currentTarget.style.setProperty("--mx", `${x}%`);
  e.currentTarget.style.setProperty("--my", `${y}%`);
}

export function InfoCard({
  title,
  icon: HeaderIcon,
  headerIconBg,
  headerIconColor,
  accentColor,
  fields,
  layout = "list",
}: {
  title: string;
  icon: React.ElementType;
  headerIconBg: string;
  headerIconColor: string;
  accentColor: string;
  fields: InfoField[];
  layout?: "list" | "grid";
}) {
  return (
    <div className="ep-glass ep-info-card">
      <div className="ep-info-header">
        <div className="ep-info-header-left">
          <span
            className="ep-info-header-icon"
            style={{ background: headerIconBg, color: headerIconColor }}
          >
            <HeaderIcon size={16} />
          </span>
          <h3 className="ep-info-title">{title}</h3>
        </div>
      </div>

      <div className="ep-info-underline" style={{ background: accentColor }} />

      {layout === "list" ? (
        <div className="ep-info-list">
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="ep-info-row"
                onMouseMove={handleRowMouseMove}
              >
                <span
                  className="ep-info-row-icon"
                  style={{ background: f.iconBg, color: f.iconColor }}
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0 ep-info-text">
                  <div className="ep-info-label">{f.label}</div>
                  <div className="ep-info-value">{f.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ep-info-grid2">
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="ep-info-cell"
                onMouseMove={handleRowMouseMove}
              >
                <span
                  className="ep-info-row-icon ep-info-row-icon--circle"
                  style={{ background: f.iconBg, color: f.iconColor }}
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0 ep-info-text">
                  <div className="ep-info-label">{f.label}</div>
                  <div className="ep-info-value">{f.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}