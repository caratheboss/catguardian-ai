import { useMemo, useState } from 'react'
import TrendChart from './TrendChart'

const buildDemoLogs = () => {
  const logs = []
  const today = new Date()

  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    const wave = Math.sin((29 - index) / 4)

    logs.push({
      date: date.toISOString().slice(0, 10),
      water: Math.round(176 + wave * 14 + (index % 5)),
      food: Math.round(53 + wave * 3),
      activity: Math.round(58 + wave * 8 - (index > 23 ? 10 : 0)),
      litter: Math.max(1, Math.round(3 + wave)),
      weight: Number((4.35 + wave * 0.05 + (29 - index) * 0.004).toFixed(2)),
    })
  }

  return logs
}

const latestDemoLog = buildDemoLogs().at(-1)

function DailyMonitoringPage() {
  const [logs, setLogs] = useState(buildDemoLogs)
  const [dailyForm, setDailyForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    water: latestDemoLog.water,
    food: latestDemoLog.food,
    activity: latestDemoLog.activity,
    litter: latestDemoLog.litter,
    weight: latestDemoLog.weight,
  })

  const updateDailyForm = (field, value) => {
    setDailyForm((current) => ({ ...current, [field]: value }))
  }

  const addDailyRecord = (event) => {
    event.preventDefault()

    const nextLog = {
      date: dailyForm.date,
      water: Number(dailyForm.water),
      food: Number(dailyForm.food),
      activity: Number(dailyForm.activity),
      litter: Number(dailyForm.litter),
      weight: Number(dailyForm.weight),
    }

    setLogs((current) => {
      const withoutSameDate = current.filter((item) => item.date !== nextLog.date)
      return [...withoutSameDate, nextLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-60)
    })
  }

  const sevenDayLogs = useMemo(() => logs.slice(-7), [logs])
  const thirtyDayLogs = useMemo(() => logs.slice(-30), [logs])
  const latestLog = logs.at(-1)

  return (
    <section className="daily-monitoring-layout">
      <form className="lovely-panel p-5" onSubmit={addDailyRecord}>
        <p className="text-sm font-black uppercase tracking-wide text-[#d86b78]">Daily Monitoring</p>
        <div className="risk-title-row mt-2">
          <img className="risk-title-paw" src="/kitten-paw-cutout.png" alt="" />
          <h2>Daily Kitten Clues</h2>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#6d5960]">
          Add one daily record. The 7-day and 30-day trend charts update automatically.
        </p>

        <div className="mt-5 grid gap-3">
          <label className="cute-label">
            Date
            <input className="cute-input" type="date" value={dailyForm.date} onChange={(event) => updateDailyForm('date', event.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Water ml/day" field="water" value={dailyForm.water} updateForm={updateDailyForm} />
            <NumberField label="Food g/day" field="food" value={dailyForm.food} updateForm={updateDailyForm} />
            <NumberField label="Activity score" field="activity" value={dailyForm.activity} updateForm={updateDailyForm} />
            <NumberField label="Litter/day" field="litter" value={dailyForm.litter} updateForm={updateDailyForm} />
            <NumberField label="Weight kg" field="weight" step="0.01" value={dailyForm.weight} updateForm={updateDailyForm} />
          </div>
        </div>

        <button className="mt-5 w-full rounded-full bg-[#ee7d8a] px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(216,107,120,0.26)] transition hover:-translate-y-0.5 hover:bg-[#d86b78]" type="submit">
          Add Daily Record
        </button>

        {latestLog && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricTile label="Latest weight" value={`${latestLog.weight} kg`} />
            <MetricTile label="Records stored" value={logs.length} />
          </div>
        )}
      </form>

      <div className="grid gap-5">
        <TrendChart data={sevenDayLogs} title="7-Day Track Chart" />
        <TrendChart data={thirtyDayLogs} title="30-Day Track Chart" />
      </div>
    </section>
  )
}

function NumberField({ label, field, value, updateForm, step = '1' }) {
  return (
    <label className="cute-label">
      {label}
      <input className="cute-input" type="number" min="0" step={step} value={value} onChange={(event) => updateForm(field, event.target.value)} />
    </label>
  )
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#f5d8d3] bg-[#fffaf5] p-3">
      <p className="text-xs font-black uppercase tracking-wide text-[#d86b78]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#3d2b2f]">{value}</p>
    </div>
  )
}

export default DailyMonitoringPage
