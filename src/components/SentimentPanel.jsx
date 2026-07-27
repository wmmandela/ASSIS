import React from "react";
import { BarChart3 } from "lucide-react";

export default function SentimentPanel({
  feedback,
  setFeedback,
  runSentiment,
  sentiment,
}) {
  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="rounded-3xl bg-gradient-to-r from-pink-600 to-rose-600 p-8 text-white shadow-xl">

        <h1 className="text-3xl font-bold">
          Sentiment Analysis
        </h1>

        <p className="mt-2 text-pink-100">
          Analyze student feedback using AI to better understand opinions and experiences.
        </p>

      </div>

      {/* Input */}

      <div className="rounded-3xl bg-white p-6 shadow-lg">

        <label className="mb-3 block font-semibold text-slate-700">
          Student Feedback
        </label>

        <textarea
          rows={8}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Type or paste student feedback here..."
          className="w-full rounded-xl border border-slate-300 p-4 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        />

        <button
          onClick={runSentiment}
          className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-blue-700"
        >
          Analyze Feedback
        </button>

      </div>

      {/* Results */}

      {sentiment && (

        <div className="rounded-3xl bg-white p-6 shadow-lg">

          <div className="mb-5 flex items-center gap-3">

            <BarChart3 className="text-blue-600" />

            <h2 className="text-2xl font-bold">
              Analysis Results
            </h2>

          </div>

          <div className="rounded-2xl bg-slate-50 p-5">

            <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-slate-700">
              {JSON.stringify(sentiment, null, 2)}
            </pre>

          </div>

        </div>

      )}

    </div>
  );
}