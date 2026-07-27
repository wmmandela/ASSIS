import React from "react";
import {
  CalendarDays,
  Clock3,
  Calendar,
} from "lucide-react";

import EmptyState from "./EmptyState";

export default function UpcomingSchedule({
  timetable,
}) {
  if (!timetable.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No Classes Scheduled"
        description="Enroll in your units to automatically generate and manage your class timetable."
        buttonText="Go to Timetable"
      />
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg">

      <div className="mb-6 flex items-center gap-3">

        <div className="rounded-xl bg-blue-100 p-2">
          <CalendarDays className="text-blue-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Upcoming Classes
          </h2>

          <p className="text-sm text-slate-500">
            Your next scheduled classes
          </p>
        </div>

      </div>

      <div className="space-y-4">

        {timetable.slice(0, 4).map((item, index) => (

          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
          >

            <h3 className="text-lg font-semibold text-slate-800">
              {item.unit.title}
            </h3>

            <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-600">

              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{item.day_of_week}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock3 size={16} />
                <span>
                  {item.start_time} - {item.end_time}
                </span>
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}