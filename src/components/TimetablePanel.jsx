import React from "react";
import {
  CalendarDays,
  Clock3,
  BookOpen,
} from "lucide-react";

import EmptyState from "./EmptyState";

export default function TimetablePanel({
  timetable,
  unitRecommendations,
  enrollUnit,
}) {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white shadow-xl">

        <div className="flex items-center gap-4">

          <div className="rounded-2xl bg-white/20 p-4">
            <CalendarDays size={34} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Timetable
            </h1>

            <p className="mt-2 text-blue-100">
              Manage your classes and enroll in
              recommended units.
            </p>
          </div>

        </div>

      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Current timetable */}
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-lg">

          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <Clock3 />
            Current Schedule
          </h2>

          {!timetable.length ? (
            <EmptyState
              title="No Timetable"
              description="You haven't enrolled in any classes yet."
            />
          ) : (

            <div className="space-y-4">

              {timetable.map((session, index) => (

                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 p-5 hover:shadow-md transition"
                >

                  <div className="flex justify-between">

                    <div>

                      <h3 className="text-lg font-bold">
                        {session.unit.title}
                      </h3>

                      <p className="text-slate-500">
                        {session.unit.unit_id}
                      </p>

                    </div>

                    <BookOpen className="text-blue-600" />

                  </div>

                  <div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-600">

                    <span>
                      📅 {session.day_of_week}
                    </span>

                    <span>
                      🕒 {session.start_time} - {session.end_time}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* Recommended units */}
        <div className="rounded-3xl bg-white p-6 shadow-lg">

          <h2 className="mb-6 text-xl font-bold">
            Recommended Units
          </h2>

          {!unitRecommendations.length ? (

            <EmptyState
              title="No Recommendations"
              description="There are no recommended units available."
            />

          ) : (

            <div className="space-y-5">

              {unitRecommendations.map((item) => (

                <div
                  key={item.unit.unit_id}
                  className="rounded-2xl border border-slate-200 p-5"
                >

                  <div className="flex justify-between">

                    <div>

                      <h3 className="font-bold">
                        {item.unit.title}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {item.unit.unit_id}
                      </p>

                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                      {item.score}
                    </span>

                  </div>

                  <p className="mt-4 text-sm text-slate-600">
                    {item.reason}
                  </p>

                  <button
                    onClick={() =>
                      enrollUnit(
                        item.unit.unit_id,
                        item.unit.title
                      )
                    }
                    className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Enroll
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}