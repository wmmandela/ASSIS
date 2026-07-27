import React from "react";
import {
  User,
  Mail,
  GraduationCap,
  BookOpen,
} from "lucide-react";

export default function StudentOverview({
  profile,
  enrolledUnits,
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg">

      <h2 className="mb-5 text-2xl font-bold">
        Student Overview
      </h2>

      {/* Profile */}

      <div className="mb-6 flex items-center gap-4">

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
          <User
            className="text-blue-600"
            size={30}
          />
        </div>

        <div>

          <h3 className="text-xl font-bold text-slate-800">
            {profile?.name || "Guest User"}
          </h3>

          <p className="text-sm text-slate-500">
            Student Profile
          </p>

        </div>

      </div>

      {/* Details */}

      <div className="space-y-3">

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">

          <Mail
            size={18}
            className="text-blue-600"
          />

          <div>

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Email
            </p>

            <p className="font-medium">
              {profile?.email || "Email unavailable"}
            </p>

          </div>

        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">

          <GraduationCap
            size={18}
            className="text-purple-600"
          />

          <div>

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Programme
            </p>

            <p className="font-medium">
              {profile?.programme || "Software Engineering"}
            </p>

          </div>

        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">

          <BookOpen
            size={18}
            className="text-green-600"
          />

          <div>

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Registered Units
            </p>

            <p className="font-medium">
              {enrolledUnits.length}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}