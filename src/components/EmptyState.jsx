import React from "react";
import { CalendarDays } from "lucide-react";

export default function EmptyState({
  title,
  description,
  buttonText,
  onClick,
  icon: Icon = CalendarDays,
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center shadow-sm">

      <div className="mb-6 rounded-full bg-blue-100 p-6">
        <Icon
          className="h-12 w-12 text-blue-600"
        />
      </div>

      <h3 className="text-2xl font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-3 max-w-sm leading-7 text-slate-500">
        {description}
      </p>

      {buttonText && (
        <button
          onClick={onClick}
          className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-lg"
        >
          {buttonText}
        </button>
      )}

    </div>
  );
}