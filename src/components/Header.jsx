import React from "react";
import {
  BookOpen,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import MetricCard from "./MetricCard";

export default function Header({
  profile,
  enrolledUnits,
  risk,
}) {
  const riskCount =
    risk?.predictions?.filter(
      (r) => r.risk_level !== "low"
    ).length || 0;

  return (
    <header className="mb-10 grid gap-8 lg:grid-cols-[55%_45%] lg:items-center">

      {/* Welcome */}
      <div className="max-w-xl">

        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          Welcome Back 👋
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {profile?.name || "Guest User"}
        </h1>

        <p className="mt-3 text-lg leading-7 text-slate-500">
          Monitor your academic progress, access AI-powered recommendations,
          manage your timetable, and discover student support services.
        </p>

      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">

        <MetricCard
          title="Study Units"
          value={enrolledUnits.length}
          subtitle="Registered units"
          icon={BookOpen}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
          borderColor="border-blue-100"
        />

        <MetricCard
          title="Risk Alerts"
          value={riskCount}
          subtitle="Students at risk"
          icon={AlertTriangle}
          bgColor="bg-red-100"
          iconColor="text-red-600"
          borderColor="border-red-100"
        />

        <MetricCard
          title="AI Modules"
          value="8"
          subtitle="Available modules"
          icon={Sparkles}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
          borderColor="border-purple-100"
        />

      </div>

    </header>
  );
}