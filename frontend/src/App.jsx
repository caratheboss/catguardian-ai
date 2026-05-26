import { useEffect, useState } from 'react'
import BreedKnowledgePage from './components/BreedKnowledgePage'
import CatProfileForm from './components/CatProfileForm'
import ClinicalPage from './components/ClinicalPage'
import DailyMonitoringPage from './components/DailyMonitoringPage'
import FeatureHub from './components/FeatureHub'
import MLRiskPredictPage from './components/MLRiskPredictPage'
import WelcomeScene from './components/WelcomeScene'

const initialForm = {
  cat_name: 'Luna',
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
const PROFILE_STORAGE_KEY = 'catguardian_profile_v1'

function App() {
  const [form, setForm] = useState(initialForm)
  const [entered, setEntered] = useState(false)
  const [activePage, setActivePage] = useState('hub')
  const [profileSavedAt, setProfileSavedAt] = useState('')

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
      if (!raw) {
        return
      }
      const parsed = JSON.parse(raw)
      setForm((current) => ({ ...current, ...parsed }))
      if (parsed._savedAt) {
        setProfileSavedAt(parsed._savedAt)
      }
    } catch (error) {
      console.error('Unable to load saved cat profile', error)
    }
  }, [])

  const saveProfile = () => {
    const savedAt = new Date().toLocaleString()
    try {
      window.localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          ...form,
          _savedAt: savedAt,
        }),
      )
      setProfileSavedAt(savedAt)
    } catch (error) {
      console.error('Unable to save cat profile', error)
    }
  }

  if (!entered) {
    return <WelcomeScene onEnter={() => setEntered(true)} />
  }

  const renderActivePage = () => {
    if (activePage === 'hub') {
      return <FeatureHub onOpen={setActivePage} />
    }

    if (activePage === 'cat-profile') {
      return (
        <section className="page-grid-single">
          <CatProfileForm form={form} onSave={saveProfile} savedAt={profileSavedAt} updateForm={updateForm} />
        </section>
      )
    }

    if (activePage === 'daily-monitoring') {
      return <DailyMonitoringPage profile={form} />
    }

    if (activePage === 'risk-predict') {
      return <MLRiskPredictPage profile={form} />
    }

    if (activePage === 'breed-knowledge') {
      return <BreedKnowledgePage selectedBreed={form.breed} updateBreed={(breed) => updateForm('breed', breed)} />
    }

    if (activePage === 'clinical-reasoning') {
      return <ClinicalPage catName={form.cat_name} profileCity={form.city} />
    }
    return <FeatureHub onOpen={setActivePage} />
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
              CatGuardian AI is a feline early-warning intelligence system designed to detect subtle health deterioration before obvious symptoms appear. It combines cat profile context, daily monitoring trends, structured ML risk prediction, trusted breed knowledge, and city-based veterinary recommendations with care reminders to support faster, safer owner decisions.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="positioning-chip">Baseline trend monitoring</span>
              <span className="positioning-chip">Structured ML risk prediction</span>
              <span className="positioning-chip">Trusted breed intelligence</span>
              <span className="positioning-chip">Veterinary recommendation and reminders</span>
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
