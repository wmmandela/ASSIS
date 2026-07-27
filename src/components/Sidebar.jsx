import React from "react";
import {
  Home,
  Lightbulb,
  Calendar,
  Search,
  Bot,
  BarChart3,
  HelpCircle,
  Settings,
  GraduationCap,
} from "lucide-react";

const menu = [
  {
    id: "dashboard",
    label: "Overview",
    icon: Home,
  },
  {
    id: "recommendations",
    label: "Recommendations",
    icon: Lightbulb,
  },
  {
    id: "timetable",
    label: "Timetable",
    icon: Calendar,
  },
  {
    id: "search",
    label: "Knowledge Search",
    icon: Search,
  },
  {
    id: "chatbot",
    label: "Chatbot",
    icon: Bot,
  },
  {
    id: "sentiment",
    label: "Sentiment",
    icon: BarChart3,
  },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
}) {
  return (
    <aside className="sticky top-5 flex h-[95vh] w-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

      <div>

        <div className="mb-10 flex items-center gap-3">

          <div className="rounded-2xl bg-blue-600 p-3 text-white">
            <GraduationCap size={28} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              ASSIS
            </h2>

            <p className="text-sm text-slate-500">
              AI Student Support
            </p>

          </div>

        </div>

        <nav className="space-y-2">

          {menu.map((item) => {

            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left font-medium transition ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={20} />

                {item.label}
              </button>
            );
          })}
        </nav>

      </div>

      <div className="space-y-2 border-t pt-6">

        <button className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-slate-600 hover:bg-slate-100">
          <HelpCircle size={20} />
          Help & Support
        </button>

        <button className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-slate-600 hover:bg-slate-100">
          <Settings size={20} />
          Settings
        </button>

      </div>

    </aside>
  );
}