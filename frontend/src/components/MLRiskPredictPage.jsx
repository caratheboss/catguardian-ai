import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

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

const medicalHistoryOptions = [
  'No known medical history',
  'Kidney disease history',
  'Urinary tract infection history',
  'Diabetes history',
  'Thyroid condition history',
  'Recent surgery',
  'Chronic digestive sensitivity',
  'Respiratory condition history',
]

const symptomOptions = [
  'None',
  'Increased thirst',
  'Excessive urination',
  'Unable to urinate',
  'Bloody urine',
  'Vomiting',
  'Diarrhea',
  'Loss of appetite',
  'Increased appetite',
  'Weight loss',
  'Rapid heart rate',
  'Coughing',
  'Noisy breathing',
  'Difficulty breathing',
  'Sneezing',
  'Pain',
  'Limping',
  'Sensitive to touch',
  'Inability to jump',
  'Change in gait',
  'Stumbling',
]

const initialMlForm = {
  breed: 'Ragdoll',
  age: 5,
  weight_kg: 4.8,
  medical_history: 'No known medical history',
  symptom_1: 'Increased thirst',
  symptom_2: 'Excessive urination',
  symptom_3: 'Weight loss',
  symptom_4: 'None',
  symptom_5: 'None',
}

const labelNames = {
  healthy: 'Healthy / no strong risk signal',
  renal_risk: 'Renal risk',
  urinary_risk: 'Urinary risk',
  gastrointestinal_risk: 'Gastrointestinal risk',
  endocrine_risk: 'Endocrine risk',
  respiratory_risk: 'Respiratory risk',
  pain_injury_risk: 'Pain / injury risk',
}

function MLRiskPredictPage({ profile }) {
  const [mlForm, setMlForm] = useState(initialMlForm)
  const [prediction, setPrediction] = useState(null)
  const [careGuide, setCareGuide] = useState(null)
  const [careGuideLoading, setCareGuideLoading] = useState(false)
  const [careGuideError, setCareGuideError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) {
      return
    }

    setMlForm((current) => ({
      ...current,
      breed: profile.breed || current.breed,
      age: profile.age || current.age,
      weight_kg: profile.weight || current.weight_kg,
    }))
  }, [profile])

  const updateMlForm = (field, value) => {
    setMlForm((current) => ({ ...current, [field]: value }))
  }

  const predictDiseaseRisk = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setCareGuide(null)
    setCareGuideError('')

    try {
      const response = await fetch(`${API_BASE_URL}/ml-predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mlForm,
          age: Number(mlForm.age),
          weight_kg: Number(mlForm.weight_kg),
        }),
      })

      if (!response.ok) {
        throw new Error('ML prediction failed')
      }

      const predictionResult = await response.json()
      setPrediction(predictionResult)
      setCareGuideLoading(true)

      try {
        const guideResponse = await fetch(`${API_BASE_URL}/risk-care-guide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            risk_label: predictionResult.predicted_label,
            breed: mlForm.breed,
            medical_history: mlForm.medical_history,
            symptoms: [1, 2, 3, 4, 5]
              .map((index) => mlForm[`symptom_${index}`])
              .filter((symptom) => symptom && symptom !== 'None'),
          }),
        })

        if (!guideResponse.ok) {
          throw new Error('Risk care guide failed')
        }
        setCareGuide(await guideResponse.json())
      } catch (guideError) {
        setCareGuideError('Care guide is temporarily unavailable. Use the ML result as a monitoring signal and contact a veterinarian for guidance.')
        console.error(guideError)
      } finally {
        setCareGuideLoading(false)
      }
    } catch (predictionError) {
      setError('ML service is unavailable. Check backend deployment or VITE_API_BASE_URL.')
      console.error(predictionError)
    } finally {
      setLoading(false)
    }
  }

  const probabilities = prediction?.probabilities || {}

  return (
    <section className="page-grid-two">
      <form className="lovely-panel p-5" onSubmit={predictDiseaseRisk}>
        <p className="text-sm font-black uppercase tracking-wide text-[#d86b78]">ML Risk Prediction</p>
        <div className="risk-title-row mt-2">
          <img className="risk-title-paw" src="/kitten-paw-cutout.png" alt="" />
          <h2>Disease Signal Classifier</h2>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#6d5960]">
          Select the clinical inputs used by the XGBoost text classifier.
        </p>
        {profile?.cat_name && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="positioning-chip">Cat: {profile.cat_name}</span>
            <span className="positioning-chip">Profile synced</span>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <label className="cute-label">
            Breed
            <select className="cute-input" value={mlForm.breed} onChange={(event) => updateMlForm('breed', event.target.value)}>
              {breeds.map((breed) => <option key={breed}>{breed}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="cute-label">
              Age
              <input className="cute-input" min="0" step="0.1" type="number" value={mlForm.age} onChange={(event) => updateMlForm('age', event.target.value)} />
            </label>
            <label className="cute-label">
              Weight kg
              <input className="cute-input" min="0" step="0.1" type="number" value={mlForm.weight_kg} onChange={(event) => updateMlForm('weight_kg', event.target.value)} />
            </label>
          </div>

          <label className="cute-label">
            Medical history
            <select className="cute-input" value={mlForm.medical_history} onChange={(event) => updateMlForm('medical_history', event.target.value)}>
              {medicalHistoryOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          {[1, 2, 3, 4, 5].map((index) => (
            <label className="cute-label" key={index}>
              Symptom {index}
              <select className="cute-input" value={mlForm[`symptom_${index}`]} onChange={(event) => updateMlForm(`symptom_${index}`, event.target.value)}>
                {symptomOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>

        <button className="mt-5 w-full rounded-full bg-[#ee7d8a] px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(216,107,120,0.26)] transition hover:-translate-y-0.5 hover:bg-[#d86b78]" type="submit">
          {loading ? 'Predicting...' : 'Predict Disease Signal'}
        </button>

        {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      </form>

      <section className="lovely-panel p-5">
        <p className="text-sm font-black uppercase tracking-wide text-[#d86b78]">XGBoost Output</p>
        <div className="risk-title-row mt-2">
          <img className="risk-title-paw" src="/kitten-paw-cutout.png" alt="" />
          <h2>{prediction ? labelNames[prediction.predicted_label] || prediction.predicted_label : 'Waiting for prediction'}</h2>
        </div>
        <p className="mt-2 inline-flex rounded-full bg-[#ddf1ed] px-3 py-1 text-xs font-black text-[#35665f]">
          Model mode: {prediction?.model_status || 'not run'}
        </p>

        {prediction && (
          <>
            <div className="mt-5 rounded-2xl bg-[#fff3e4] p-4">
              <p className="text-sm font-black text-[#3d2b2f]">Confidence</p>
              <p className="mt-2 text-4xl font-black text-[#d86b78]">{Math.round(prediction.confidence * 100)}%</p>
            </div>

            <div className="mt-5 grid gap-3">
              {Object.entries(probabilities).map(([label, score]) => (
                <div className="rounded-2xl border border-[#f5d8d3] bg-[#fffaf5] p-3" key={label}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#3d2b2f]">{labelNames[label] || label}</p>
                    <p className="text-sm font-black text-[#d86b78]">{Math.round(score * 100)}%</p>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-[#f9e5dc]">
                    <div className="h-3 rounded-full bg-[#ee7d8a]" style={{ width: `${Math.round(score * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="lovely-panel p-5 md:col-span-2">
        <p className="text-sm font-black uppercase tracking-wide text-[#d86b78]">RiskCareGuideAgent</p>
        <div className="risk-title-row mt-2">
          <img className="risk-title-paw" src="/kitten-paw-cutout.png" alt="" />
          <h2>{careGuide?.title || 'Care information for the top risk signal'}</h2>
        </div>

        {!prediction && (
          <p className="mt-3 text-sm font-medium leading-6 text-[#6d5960]">
            Run the disease signal classifier to receive a short, source-grounded care guide for the highest-percentage risk category.
          </p>
        )}

        {careGuideLoading && (
          <p className="mt-4 rounded-2xl bg-[#fff3e4] p-4 text-sm font-bold text-[#6d5960]">
            Finding relevant veterinary care resources...
          </p>
        )}

        {careGuideError && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {careGuideError}
          </p>
        )}

        {careGuide && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="positioning-chip">Top signal: {labelNames[careGuide.risk_label] || careGuide.risk_label}</span>
              <span className="positioning-chip">Agent mode: {careGuide.mode}</span>
            </div>
            {careGuide.debug_error && (
              <p className="mt-4 rounded-2xl border border-[#f5d8d3] bg-[#fff3e4] p-4 text-sm font-semibold leading-6 text-[#7c6670]">
                OpenAI search fallback reason: {careGuide.debug_error}
              </p>
            )}
            <p className="mt-4 text-sm font-medium leading-7 text-[#6d5960]">{careGuide.summary}</p>
            {careGuide.urgent_signs && (
              <p className="mt-4 rounded-2xl bg-[#fff3e4] p-4 text-sm font-bold leading-6 text-[#6d5960]">
                {careGuide.urgent_signs}
              </p>
            )}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {careGuide.resources.map((resource) => (
                <a
                  className="rounded-2xl border border-[#f5d8d3] bg-[#fffaf5] p-4 transition hover:-translate-y-0.5 hover:border-[#ee7d8a]"
                  href={resource.url}
                  key={resource.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-[#d86b78]">{resource.source}</p>
                  <p className="mt-2 text-sm font-black text-[#3d2b2f]">{resource.title}</p>
                  <p className="mt-3 text-sm font-black text-[#d86b78]">Open care resource</p>
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold text-[#7c6670]">{careGuide.safety_note}</p>
          </>
        )}
      </section>
    </section>
  )
}

export default MLRiskPredictPage
