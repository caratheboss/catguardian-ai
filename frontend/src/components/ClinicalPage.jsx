import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

const cities = ['上海', '深圳', '北京', '广州']

function ClinicalPage({ catName }) {
  const [city, setCity] = useState('上海')
  const [vetResult, setVetResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reminder, setReminder] = useState({
    owner_email: '',
    cat_name: catName || '',
    reminder_day: new Date().getDate(),
  })
  const [reminderResult, setReminderResult] = useState(null)

  useEffect(() => {
    setReminder((current) => ({
      ...current,
      cat_name: catName || '',
    }))
  }, [catName])

  const findVets = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/clinical-vets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      })

      if (!response.ok) {
        throw new Error('Vet finder failed')
      }

      setVetResult(await response.json())
    } catch (vetError) {
      setError('Vet service is unavailable. Check backend deployment or VITE_API_BASE_URL.')
      console.error(vetError)
    } finally {
      setLoading(false)
    }
  }

  const scheduleReminder = async (event) => {
    event.preventDefault()
    setReminderResult(null)
    if (!reminder.owner_email.trim() || !reminder.cat_name.trim()) {
      setReminderResult({
        status: 'input_required',
        message: 'Please enter both owner email and cat name before scheduling.',
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/care-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reminder, city, reminder_day: Number(reminder.reminder_day) }),
      })

      if (!response.ok) {
        throw new Error('Reminder scheduling failed')
      }

      setReminderResult(await response.json())
    } catch (reminderError) {
      setReminderResult({
        status: 'local_preview',
        message: 'Backend unavailable. Reminder preview is shown locally only.',
      })
      console.error(reminderError)
    }
  }

  return (
    <section className="clinical-layout">
      <section className="lovely-panel p-6">
        <p className="text-sm font-black uppercase tracking-wide text-[#d86b78]">Clinical Vet Finder</p>
        <div className="risk-title-row mt-2">
          <img className="risk-title-paw" src="/kitten-paw-cutout.png" alt="" />
          <h2>Find Trusted Veterinary Help</h2>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#6d5960]">
          VetFinderAgent searches Amap veterinary clinic POIs for the selected city, ranks by rating when available, then adds doctor/team background context.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="cute-label">
            City
            <select className="cute-input" value={city} onChange={(event) => setCity(event.target.value)}>
              {cities.map((cityOption) => <option key={cityOption}>{cityOption}</option>)}
            </select>
          </label>
          <button className="self-end rounded-full bg-[#ee7d8a] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(216,107,120,0.22)]" onClick={findVets} type="button">
            {loading ? 'Searching...' : 'Find Vets'}
          </button>
        </div>

        {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        {vetResult && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="positioning-chip">Agent mode: {vetResult.mode}</span>
            <span className="positioning-chip">{vetResult.ranking_rule}</span>
          </div>
        )}
        {vetResult?.amap_error && (
          <p className="mt-4 rounded-2xl border border-[#f5d8d3] bg-[#fff8f1] p-3 text-sm font-semibold text-[#7c6670]">
            Amap status: {vetResult.amap_error}
          </p>
        )}

        <div className="mt-5 grid gap-4">
          {(vetResult?.vets || []).map((vet, index) => (
            <article className="vet-finder-card" key={`${vet.clinic_name}-${index}`}>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#d86b78]">Rank {index + 1}</p>
                  <h3>{vet.clinic_name}</h3>
                  <p className="mt-1 text-sm font-bold text-[#7c6670]">{vet.address}</p>
                  {vet.phone && <p className="mt-1 text-sm font-bold text-[#7c6670]">{vet.phone}</p>}
                </div>
                <div className="clinic-score">
                  <strong>{vet.rating || 'POI'}</strong>
                  <span>{vet.rating ? 'Amap rating' : 'Amap rank'}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {vet.doctor_backgrounds.map((doctor) => (
                  <div className="doctor-card" key={doctor.name}>
                    <p>{doctor.name}</p>
                    <span>{doctor.background}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {vet.maps_url && <a className="inline-flex text-sm font-black text-[#d86b78]" href={vet.maps_url} target="_blank" rel="noreferrer">Open map</a>}
                {vet.website && <a className="inline-flex text-sm font-black text-[#d86b78]" href={vet.website} target="_blank" rel="noreferrer">Clinic website</a>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lovely-panel p-6">
        <p className="text-sm font-black uppercase tracking-wide text-[#d86b78]">CareReminderAgent</p>
        <div className="risk-title-row mt-2">
          <img className="risk-title-paw" src="/kitten-paw-cutout.png" alt="" />
          <h2>Monthly Care Planning Email</h2>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#6d5960]">
          Schedule a monthly reminder to review pet insurance billings and monthly appointments.
        </p>

        <form className="mt-5 grid gap-3" onSubmit={scheduleReminder}>
          <label className="cute-label">
            Owner email
            <input className="cute-input" type="email" value={reminder.owner_email} onChange={(event) => setReminder((current) => ({ ...current, owner_email: event.target.value }))} placeholder="owner@example.com" />
          </label>
          <label className="cute-label">
            Cat name
            <input className="cute-input" value={reminder.cat_name} onChange={(event) => setReminder((current) => ({ ...current, cat_name: event.target.value }))} placeholder="Type your cat's name" />
          </label>
          <label className="cute-label">
            Reminder day of month
            <input className="cute-input" min="1" max="28" type="number" value={reminder.reminder_day} onChange={(event) => setReminder((current) => ({ ...current, reminder_day: event.target.value }))} />
          </label>
          <button className="rounded-full bg-[#ee7d8a] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(216,107,120,0.22)]" type="submit">
            Schedule Reminder
          </button>
        </form>

        {reminderResult && (
          <p className="mt-4 rounded-2xl border border-[#f5d8d3] bg-[#fff8f1] p-4 text-sm font-bold leading-6 text-[#6d5960]">
            {reminderResult.message}
          </p>
        )}
      </section>
    </section>
  )
}

export default ClinicalPage
