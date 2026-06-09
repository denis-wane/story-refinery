import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-100">Story Refinery</h1>
        <p className="text-gray-400 mt-2">
          AI-powered pipeline for generating and refining user stories with
          acceptance criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate Card */}
        <Link
          href="/generate"
          className="group relative p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-blue-600/20">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-100">Generate</h2>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Start from a raw description or idea. The pipeline will analyze,
            decompose into features and stories, write acceptance criteria, and
            generate test specs.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-400 group-hover:text-blue-300">
            Start generating
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Refine Card */}
        <Link
          href="/refine"
          className="group relative p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-600/20">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-100">Refine</h2>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Import existing stories from Jira or local files. The pipeline
            performs gap analysis, rewrites, and produces improved stories with
            complete acceptance criteria.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400 group-hover:text-emerald-300">
            Start refining
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-2xl font-bold text-gray-100">--</p>
          <p className="text-xs text-gray-500 mt-1">Total Runs</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-2xl font-bold text-gray-100">--</p>
          <p className="text-xs text-gray-500 mt-1">Stories Generated</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-2xl font-bold text-gray-100">--</p>
          <p className="text-xs text-gray-500 mt-1">Stories Refined</p>
        </div>
      </div>
    </div>
  );
}
