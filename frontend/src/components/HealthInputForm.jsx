function HealthInputForm({ form, updateForm }) {
  return (
    <section className="lovely-panel p-4">
      <h2 className="text-base font-black text-[#3d2b2f]">Daily Kitten Clues</h2>
      <div className="mt-4 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Water ml/day" field="water_intake" value={form.water_intake} updateForm={updateForm} />
          <NumberField label="Food g/day" field="food_intake" value={form.food_intake} updateForm={updateForm} />
          <NumberField label="Activity score" field="activity" value={form.activity} updateForm={updateForm} />
          <NumberField label="Litter/day" field="litter_frequency" value={form.litter_frequency} updateForm={updateForm} />
          <NumberField label="Vomiting/day" field="vomiting" value={form.vomiting} updateForm={updateForm} />
          <NumberField label="Hiding" field="hiding_behavior" value={form.hiding_behavior} updateForm={updateForm} />
        </div>
        <label className="cute-label">
          Appetite
          <select className="cute-input" value={form.appetite} onChange={(event) => updateForm('appetite', event.target.value)}>
            <option value="normal">normal</option>
            <option value="low">low</option>
            <option value="high">high</option>
          </select>
        </label>
      </div>
    </section>
  )
}

function NumberField({ label, field, value, updateForm }) {
  return (
    <label className="cute-label">
      {label}
      <input className="cute-input" type="number" min="0" value={value} onChange={(event) => updateForm(field, event.target.value)} />
    </label>
  )
}

export default HealthInputForm
