function VetRecommendations({ vets }) {
  return (
    <section className="lovely-panel p-5">
      <h2 className="text-lg font-black text-[#3d2b2f]">Nearby Vet Recommendation</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {vets.length === 0 && <p className="text-sm font-medium text-[#7c6670]">Run analysis to see nearby clinics.</p>}
        {vets.map((vet) => (
          <div key={`${vet.city}-${vet.clinic_name}`} className="rounded-2xl border border-[#f5d8d3] bg-[#fffaf5] p-4 shadow-sm">
            <p className="font-black text-[#3d2b2f]">{vet.clinic_name}</p>
            <p className="mt-1 text-sm font-medium text-[#7c6670]">{vet.city}</p>
            <p className="mt-3 inline-flex rounded-full bg-[#ddf1ed] px-3 py-1 text-sm font-black text-[#347b75]">{vet.rating} rating</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default VetRecommendations
