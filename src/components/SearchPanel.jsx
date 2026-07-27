import React from "react";
import { Search } from "lucide-react";
import EmptyState from "./EmptyState";

export default function SearchPanel({
  searchQuery,
  setSearchQuery,
  runSearch,
  searchResults,
}) {
  return (
    <div className="space-y-6">

      <div className="rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-600 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold">
          Intelligent Knowledge Search
        </h1>

        <p className="mt-2 text-blue-100">
          Search academic support resources and student services.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-lg">

        <div className="flex gap-4">

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search support resources..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />

          <button
            onClick={runSearch}
            className="rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-700"
          >
            <Search size={20} />
          </button>

        </div>

      </div>

      {!searchResults ? (

        <EmptyState
          title="Search Resources"
          description="Find tutoring, counselling, advising and academic resources."
        />

      ) : (

        <div className="rounded-3xl bg-white p-6 shadow-lg">

          <h2 className="mb-5 text-xl font-bold">
            Search Results
          </h2>

          <pre className="whitespace-pre-wrap text-slate-600">
            {JSON.stringify(searchResults, null, 2)}
          </pre>

        </div>

      )}

    </div>
  );
}