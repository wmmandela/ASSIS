import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function Notice({
  text,
  type = "info",
}) {
  const variants = {
    error: {
      icon: AlertCircle,
      container:
        "border-red-200 bg-red-50 text-red-700",
      iconBg: "bg-red-100",
    },

    success: {
      icon: CheckCircle2,
      container:
        "border-green-200 bg-green-50 text-green-700",
      iconBg: "bg-green-100",
    },

    warning: {
      icon: AlertTriangle,
      container:
        "border-yellow-200 bg-yellow-50 text-yellow-700",
      iconBg: "bg-yellow-100",
    },

    info: {
      icon: Info,
      container:
        "border-blue-200 bg-blue-50 text-blue-700",
      iconBg: "bg-blue-100",
    },
  };

  const current = variants[type];
  const Icon = current.icon;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`mb-6 flex items-start gap-4 rounded-2xl border p-5 shadow-sm ${current.container}`}
    >
      <div
        className={`rounded-xl p-2 ${current.iconBg}`}
      >
        <Icon size={22} />
      </div>

      <div>
        <h3 className="font-semibold">
          {type.charAt(0).toUpperCase() +
            type.slice(1)}
        </h3>

        <p className="mt-1 text-sm">
          {text}
        </p>
      </div>
    </div>
  );
}