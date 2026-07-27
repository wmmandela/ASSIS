import React from "react";
import { Bot } from "lucide-react";
import EmptyState from "./EmptyState";

export default function ChatbotPanel({
  question,
  setQuestion,
  askChatbot,
  chatbot,
}) {
  return (
    <div className="space-y-6">

      <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white shadow-xl">

        <h1 className="text-3xl font-bold">
          AI Chatbot
        </h1>

        <p className="mt-2 text-purple-100">
          Ask anything about your academic journey.
        </p>

      </div>

      <div className="rounded-3xl bg-white p-6 shadow-lg">

        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded-xl border border-slate-300 p-4 focus:border-blue-500 focus:outline-none"
        />

        <button
          onClick={askChatbot}
          className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Ask AI
        </button>

      </div>

      {!chatbot ? (

        <EmptyState
          title="No Conversation"
          description="Ask the chatbot a question to begin."
        />

      ) : (

        <div className="rounded-3xl bg-white p-6 shadow-lg">

          <div className="flex items-center gap-3">

            <Bot className="text-blue-600"/>

            <h2 className="font-bold text-xl">
              AI Response
            </h2>

          </div>

          <p className="mt-5 leading-8 text-slate-600">
            {chatbot.answer}
          </p>

        </div>

      )}

    </div>
  );
}