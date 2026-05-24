const agentOrder = ['MonitoringAgent', 'MLRiskAgent', 'BreedKnowledgeAgent', 'ClinicalReasoningAgent', 'TriageAgent']

function AgentPipeline({ pipeline }) {
  return (
    <section className="lovely-panel p-5">
      <h2 className="text-lg font-black text-[#3d2b2f]">Multi-Agent Pipeline</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {agentOrder.map((agent) => {
          const step = pipeline.find((item) => item.agent === agent)
          return (
            <div key={agent} className="relative rounded-2xl border border-[#f5d8d3] bg-[#fffaf5] p-3 shadow-sm">
              <span className="pipeline-dot" aria-hidden="true" />
              <p className="pl-4 text-sm font-black text-[#3d2b2f]">{agent}</p>
              <p className="mt-2 break-words text-xs font-medium leading-5 text-[#7c6670]">
                {step ? JSON.stringify(step.output).slice(0, 130) : 'Pending'}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default AgentPipeline
