import React from "react";

import StudentOverview from "./StudentOverview";
import QuickActions from "./QuickActions";
import UpcomingSchedule from "./UpcomingSchedule";

export default function Dashboard({
  profile,
  enrolledUnits,
  timetable,
  setActiveTab,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      {/* Student Overview */}
      <div className="space-y-6">
        <StudentOverview
          profile={profile}
          enrolledUnits={enrolledUnits}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <QuickActions
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Upcoming Schedule */}
      <div className="space-y-6">
        <UpcomingSchedule
          timetable={timetable}
        />
      </div>

    </div>
  );
}