import React from "react";
import { Sparkles, User, Award } from "lucide-react";

import EmptyState from "./EmptyState";

export default function RecommendationPanel({
  profile,
  recommendations,
}) {
  const getScoreColor = (score) => {
    const value = Number(score);

    if (value >= 90)
      return "bg-green-100 text-green-700";

    if (value >= 70)
      return "bg-yellow-100 text-yellow-700";

    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">

        <div className="flex items-center gap-4">

          <div className="rounded-2xl bg-white/20 p-4">
            <Sparkles size={34} />
          </div>

          <div>

            <h1 className="text-3xl font-bold">
              AI Recommendations
            </h1>

            <p className="mt-2 text-blue-100">
              Personalized recommendations based on your academic profile and performance.
            </p>

          </div>

        </div>

      </div>

      {/* Student Card */}

      {profile && (

        <div className="rounded-3xl bg-white p-6 shadow-lg">

          <div className="mb-4 flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3">

              <User className="text-blue-600" />

            </div>

            <div>

              <h2 className="text-xl font-bold">
                Student Information
              </h2>

              <p className="text-slate-500">
                Recommendations generated for
              </p>

            </div>

          </div>

          <h3 className="text-lg font-semibold text-slate-800">
            {profile.name}
          </h3>

          <p className="text-slate-500">
            {profile.student_id}
          </p>

        </div>

      )}

      {/* Empty */}

      {!recommendations?.recommendations?.length ? (

        <EmptyState
          icon={Sparkles}
          title="No Recommendations"
          description="AI recommendations will appear here once they have been generated."
        />

      ) : (

        <div className="grid gap-6 lg:grid-cols-2">

          {recommendations.recommendations.map((item) => (

            <div
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >

              <div className="flex items-start justify-between">

                <div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {item.type}
                  </span>

                  <h3 className="mt-4 text-xl font-bold text-slate-800">
                    {item.title}
                  </h3>

                </div>

                <div
                  className={`rounded-full px-4 py-2 text-sm font-bold ${getScoreColor(item.score)}`}
                >
                  {item.score}% Match
                </div>

              </div>

              <p className="mt-5 leading-7 text-slate-600">
                {item.description}
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">

                <div className="mb-2 flex items-center gap-2">

                  <Award
                    size={18}
                    className="text-blue-600"
                  />

                  <h4 className="font-semibold">
                    Why this recommendation?
                  </h4>

                </div>

                <p className="text-sm leading-6 text-slate-500">
                  {item.reason}
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}