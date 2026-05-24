import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function TrendChart({ data, title = 'Baseline Anomaly Signals' }) {
  return (
    <section className="lovely-panel p-5">
      <h2 className="text-lg font-black text-[#3d2b2f]">{title}</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#f3ddd4" />
            <XAxis dataKey="date" stroke="#8b747b" tickFormatter={(value) => String(value).slice(5)} />
            <YAxis stroke="#8b747b" />
            <Tooltip />
            <Line type="monotone" dataKey="water" stroke="#55a6a0" strokeWidth={3} dot={{ r: 5 }} />
            <Line type="monotone" dataKey="food" stroke="#d9a441" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="activity" stroke="#ee7d8a" strokeWidth={3} dot={{ r: 5 }} />
            <Line type="monotone" dataKey="litter" stroke="#8e7cc3" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="weight" stroke="#3d2b2f" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chart-legend legend-water">Water</span>
        <span className="chart-legend legend-food">Food</span>
        <span className="chart-legend legend-activity">Activity</span>
        <span className="chart-legend legend-litter">Litter</span>
        <span className="chart-legend legend-weight">Weight</span>
      </div>
    </section>
  )
}

export default TrendChart
