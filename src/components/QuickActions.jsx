import React from "react";
import {
  Calendar,
  Bot,
  Search,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const actions = [
  {
    id: "timetable",
    title: "Timetable",
    icon: Calendar,
    color: "bg-blue-500",
  },
  {
    id: "recommendations",
    title: "AI Recommendations",
    icon: Sparkles,
    color: "bg-purple-500",
  },
  {
    id: "search",
    title: "Knowledge Search",
    icon: Search,
    color: "bg-green-500",
  },
  {
    id: "chatbot",
    title: "Chatbot",
    icon: Bot,
    color: "bg-orange-500",
  },
];

export default function QuickActions({
  setActiveTab,
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg">

      <h2 className="mb-6 text-2xl font-bold">
        Quick Actions
      </h2>

      <div className="space-y-4">

        {actions.map((action) => {

          const Icon = action.icon;

          return (
            <button
              key={action.id}
              onClick={() => setActiveTab(action.id)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >

              <div className="flex items-center gap-4">

                <div
                  className={`rounded-xl p-3 ${action.color} text-white`}
                >
                  <Icon size={22} />
                </div>

                <div className="text-left">

                  <p className="font-semibold text-slate-800">
                    {action.title}
                  </p>

                  <p className="text-sm text-slate-500">
                    Open
                  </p>

                </div>

              </div>

              <ChevronRight
                className="text-slate-400"
                size={20}
              />

            </button>
          );
        })}

      </div>

    </div>
  );
}