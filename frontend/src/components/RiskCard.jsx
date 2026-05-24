function RiskCard({ result }) {
  const risks = result?.ml_risk_score || {
    kidney_risk: 0,
    urinary_risk: 0,
    metabolic_risk: 0,
  }

  return (
    <section className="lovely-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#3d2b2f]">Structured ML Risk Engine</h2>
          <p className="mt-1 inline-flex rounded-full bg-[#fce7cf] px-3 py-1 text-sm font-bold text-[#9b5c3c]">{result?.triage_recommendation || 'Waiting for analysis'}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {Object.entries(risks).map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-[#f5d8d3] bg-[#fffaf5] p-4 shadow-sm">
            <p className="text-sm font-bold capitalize text-[#7c6670]">{key.replace('_', ' ')}</p>
            <p className="mt-2 text-3xl font-black text-[#3d2b2f]">{Math.round(value * 100)}%</p>
            <div className="mt-3 h-3 rounded-full bg-[#f9e5dc]">
              <div className="h-3 rounded-full bg-[#ee7d8a]" style={{ width: `${Math.round(value * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-2xl bg-[#fff3e4] p-4 text-sm font-medium leading-6 text-[#6d5960]">
        {result?.ai_explanation || 'Run analysis to generate an explanation from structured agent outputs. This is not a generic chatbot answer.'}
      </p>
    </section>
  )
}

export default RiskCard
