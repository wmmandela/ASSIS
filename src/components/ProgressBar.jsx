import React from "react";

export default function ProgressBar({
  label,
  percentage,
  color = "bg-blue-500",
}) {
  const value = Math.max(0, Math.min(100, percentage));

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium text-slate-600">
          {label}
        </span>

        <span className="text-sm font-bold text-slate-700">
          {value}%
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}