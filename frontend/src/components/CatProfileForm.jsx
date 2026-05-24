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

function CatProfileForm({ form, updateForm }) {
  return (
    <section className="lovely-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-[#3d2b2f]">Cat Profile</h2>
        <span className="mini-kitten-face" aria-hidden="true" />
      </div>
      <div className="mt-4 grid gap-3">
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
      </div>
    </section>
  )
}

export default CatProfileForm
