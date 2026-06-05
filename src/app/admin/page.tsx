export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-4xl font-bold text-slate-900">
          Admin Panel
        </h1>

        <p className="mb-8 text-slate-600">
          Admins can update real match results and calculate player points.
        </p>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            Update Match Result
          </h2>

          <form className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block font-medium text-slate-700">
                Match Number
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700">
                Team 1 Score
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700">
                Team 2 Score
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Save Result
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}