const breeds = [
  'Persian',
  'British Shorthair',
  'Maine Coon',
  'Siamese',
  'Ragdoll',
  'Bengal',
  'Sphynx',
  'Scottish Fold',
  'Abyssinian',
  'Russian Blue',
  'Norwegian Forest Cat',
  'American Shorthair',
  'Birman',
  'Devon Rex',
  'Oriental Shorthair',
]
const sexes = ['female', 'male']
const reproductiveStatuses = ['intact', 'spayed', 'unknown']

function CatProfileForm({ form, onSave, savedAt, updateForm }) {
  return (
    <section className="lovely-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-[#3d2b2f]">Cat Profile</h2>
        <span className="mini-kitten-face" aria-hidden="true" />
      </div>
      <div className="mt-4 grid gap-3">
        <label className="cute-label">
          Cat name
          <input className="cute-input" value={form.cat_name} onChange={(event) => updateForm('cat_name', event.target.value)} placeholder="Type your cat's name" />
        </label>
        <label className="cute-label">
          Breed
          <select className="cute-input" value={form.breed} onChange={(event) => updateForm('breed', event.target.value)}>
            {breeds.map((breed) => <option key={breed}>{breed}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="cute-label">
            Sex
            <select className="cute-input" value={form.sex} onChange={(event) => updateForm('sex', event.target.value)}>
              {sexes.map((sex) => <option key={sex}>{sex}</option>)}
            </select>
          </label>
          <label className="cute-label">
            Reproductive status
            <select className="cute-input" value={form.reproductive_status} onChange={(event) => updateForm('reproductive_status', event.target.value)}>
              {reproductiveStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="cute-label">
            Age
            <input className="cute-input" type="number" min="0" value={form.age} onChange={(event) => updateForm('age', event.target.value)} />
          </label>
          <label className="cute-label">
            Weight kg
            <input className="cute-input" type="number" step="0.1" min="0" value={form.weight} onChange={(event) => updateForm('weight', event.target.value)} />
          </label>
        </div>
        <div className="mt-1 grid gap-2">
          <button
            className="w-full rounded-full bg-[#ee7d8a] px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(216,107,120,0.26)] transition hover:-translate-y-0.5 hover:bg-[#d86b78]"
            type="button"
            onClick={onSave}
          >
            Save Cat Profile
          </button>
          {savedAt && (
            <p className="text-xs font-semibold text-[#7c6670]">
              Saved at: {savedAt}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default CatProfileForm
