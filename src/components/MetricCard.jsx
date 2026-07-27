import React from "react";

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  bgColor = "bg-blue-50",
  borderColor = "border-blue-100",
}) {
  return (
    <div
      className={`rounded-3xl border ${borderColor} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl`}
    >
      {/* Icon */}
      <div className="mb-4 flex justify-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bgColor}`}
        >
          {Icon && (
            <Icon
              className={`h-7 w-7 ${iconColor}`}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-center">

        <h2 className="text-5xl font-bold tracking-tight text-slate-900">
          {value}
        </h2>

        <p className="mt-2 text-base font-semibold text-slate-800">
          {title}
        </p>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}

      </div>
    </div>
  );
}