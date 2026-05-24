import { useState } from 'react'
import BreedKnowledgePage from './components/BreedKnowledgePage'
import CatProfileForm from './components/CatProfileForm'
import ClinicalPage from './components/ClinicalPage'
import DailyMonitoringPage from './components/DailyMonitoringPage'
import FeatureHub from './components/FeatureHub'
import MLRiskPredictPage from './components/MLRiskPredictPage'
import WelcomeScene from './components/WelcomeScene'
import VetRecommendations from './components/VetRecommendations'
import { API_BASE_URL } from './config'

const initialForm = {
  breed: 'Persian',
  sex: 'female',
  reproductive_status: 'spayed',
  age: 12,
  weight: 4.2,
  city: 'Shanghai',
  water_intake: 310,
  food_intake: 42,
  activity: 22,
  litter_frequency: 5,
  appetite: 'low',
  vomiting: 1,
  hiding_behavior: 1,
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [entered, setEntered] = useState(false)
  const [activePage, setActivePage] = useState('hub')

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const analyze = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          weight: Number(form.weight),
          water_intake: Number(form.water_intake),
          food_intake: Number(form.food_intake),
          activity: Number(form.activity),
          litter_frequency: Number(form.litter_frequency),
          vomiting: Number(form.vomiting),
          hiding_behavior: Number(form.hiding_behavior),
        }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      setResult(await response.json())
    } catch (analysisError) {
      setError('Analysis service is unavailable. Check backend deployment or VITE_API_BASE_URL.')
      console.error(analysisError)
    } finally {
      setLoading(false)
    }
  }

  if (!entered) {
    return <WelcomeScene onEnter={() => setEntered(true)} />
  }

  const runAnalysisButton = (
    <button
      className="w-full rounded-full bg-[#ee7d8a] px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(216,107,120,0.26)] transition hover:-translate-y-0.5 hover:bg-[#d86b78] disabled:cursor-not-allowed disabled:bg-[#c8b8b3]"
      disabled={loading}
      onClick={analyze}
      type="button"
    >
      {loading ? 'Analyzing...' : 'Analyze Hidden Risk Signals'}
    </button>
  )

  const renderActivePage = () => {
    if (activePage === 'hub') {
      return <FeatureHub onOpen={setActivePage} />
    }

    if (activePage === 'cat-profile') {
      return (
        <section className="page-grid-single">
          <CatProfileForm form={form} updateForm={updateForm} />
        </section>
      )
    }

    if (activePage === 'daily-monitoring') {
      return <DailyMonitoringPage />
    }

    if (activePage === 'risk-predict') {
      return <MLRiskPredictPage />
    }

    if (activePage === 'breed-knowledge') {
      return <BreedKnowledgePage selectedBreed={form.breed} updateBreed={(breed) => updateForm('breed', breed)} />
    }

    if (activePage === 'clinical-reasoning') {
      return <ClinicalPage />
    }

    return (
      <section className="space-y-5">
        {!result && runAnalysisButton}
        <section className="lovely-panel p-6">
          <p className="text-sm font-black uppercase tracking-wide text-[#d86b78]">TriageAgent</p>
          <h2 className="mt-2 text-3xl font-black text-[#3d2b2f]">{result?.triage_recommendation || 'Waiting for analysis'}</h2>
          <p className="mt-5 text-sm font-medium leading-6 text-[#6d5960]">
            Rule-based next step recommendation: Monitor, Vet within 72h, Vet within 24h, or Emergency.
          </p>
        </section>
        <VetRecommendations vets={result?.nearby_vets || []} />
      </section>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff8f1]">
      <section className="relative border-b border-rose-100 bg-[#fffdf8]">
        <div className="cat-ear-mark left-4 top-5 hidden md:block" aria-hidden="true" />
        <div className="cat-ear-mark right-8 top-16 hidden md:block" aria-hidden="true" />
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#d86b78]">Feline Early Warning Intelligence</p>
            <h1 className="mt-1 text-4xl font-black leading-none text-[#3d2b2f] md:whitespace-nowrap md:text-5xl">CatGuardian AI</h1>
          </div>
          <div className="max-w-2xl">
            <p className="text-sm font-medium leading-6 text-[#6d5960]">
              Detect hidden feline health deterioration before owners notice obvious symptoms.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="positioning-chip">Personalized baseline anomaly</span>
              <span className="positioning-chip">Structured ML risk engine</span>
              <span className="positioning-chip">Explainable triage</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-6">
        {activePage !== 'hub' && (
          <button className="back-button" onClick={() => setActivePage('hub')} type="button">
            Back to home
          </button>
        )}
        {renderActivePage()}
      </div>
    </main>
  )
}

export default App
