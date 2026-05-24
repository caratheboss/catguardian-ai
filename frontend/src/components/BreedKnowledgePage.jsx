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

const fallbackSignals = {
  Persian: ['Kidney wellness context', 'Eye and tear tracking', 'Breathing comfort', 'Coat matting changes', 'Appetite shifts'],
  'British Shorthair': ['Weight control', 'Joint comfort', 'Dental care', 'Activity baseline', 'Heart-health context'],
  'Maine Coon': ['Heart-health context', 'Large-breed weight tracking', 'Joint comfort', 'Coat care', 'Activity baseline'],
  Siamese: ['Dental care', 'Respiratory comfort', 'High activity baseline', 'Appetite shifts', 'Stress sensitivity'],
  Ragdoll: ['Heart-health context', 'Weight control', 'Low-activity baseline', 'Coat care', 'Urinary habits'],
  Bengal: ['High activity baseline', 'Environmental enrichment', 'Appetite shifts', 'Stool changes', 'Stress behavior'],
  Sphynx: ['Skin oil buildup', 'Temperature comfort', 'Ear cleaning', 'Appetite shifts', 'Heart-health context'],
  'Scottish Fold': ['Joint comfort', 'Mobility changes', 'Weight control', 'Pain-hiding behavior', 'Activity decline'],
  Abyssinian: ['High activity baseline', 'Dental care', 'Weight changes', 'Appetite shifts', 'Stress behavior'],
  'Russian Blue': ['Weight control', 'Quiet behavior changes', 'Urinary habits', 'Coat condition', 'Appetite shifts'],
  'Norwegian Forest Cat': ['Large-breed weight tracking', 'Coat care', 'Joint comfort', 'Activity baseline', 'Heart-health context'],
  'American Shorthair': ['Weight control', 'Dental care', 'Urinary habits', 'Activity baseline', 'Appetite shifts'],
  Birman: ['Weight control', 'Coat care', 'Kidney wellness context', 'Quiet behavior changes', 'Appetite shifts'],
  'Devon Rex': ['Skin and coat condition', 'Temperature comfort', 'Dental care', 'Appetite shifts', 'Activity baseline'],
  'Oriental Shorthair': ['High activity baseline', 'Dental care', 'Respiratory comfort', 'Stress behavior', 'Appetite shifts'],
}

const trustedSources = [
  ['Cornell Feline Health Center', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center'],
  ['VCA Animal Hospitals', 'https://vcahospitals.com/know-your-pet/cat-breeds'],
  ['International Cat Care', 'https://icatcare.org/advice/cat-breeds/'],
  ['PetMD', 'https://www.petmd.com/cat/breeds'],
  ['CFA Breed Profiles', 'https://cfa.org/breeds/'],
]

const buildFallbackKnowledge = (breed) => {
  const signals = (fallbackSignals[breed] || fallbackSignals.Persian).slice(0, 2)

  return {
    breed,
    llm_agent: 'demo fallback until backend connects',
    insights: signals.map((signal, index) => {
      const [source, sourceUrl] = trustedSources[index]

      return {
        title: `${breed}: ${signal}`,
        summary: '',
        source,
        source_url: sourceUrl,
        source_count: 0,
        evidence_urls: [sourceUrl],
      }
    }),
  }
}

function BreedKnowledgePage({ selectedBreed, updateBreed }) {
  const [knowledge, setKnowledge] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const loadBreedKnowledge = async () => {
      setLoading(true)
      setError('')
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 35000)

      try {
        const response = await fetch(`${API_BASE_URL}/breed-knowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ breed: selectedBreed }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Breed knowledge request failed')
        }

        const data = await response.json()
        if (!ignore) {
          setKnowledge(data)
        }
      } catch (knowledgeError) {
        if (!ignore) {
          setError('Backend is offline, so this page is showing demo cards. Check backend deployment or VITE_API_BASE_URL.')
          setKnowledge(null)
        }
        console.error(knowledgeError)
      } finally {
        window.clearTimeout(timeout)
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadBreedKnowledge()

    return () => {
      ignore = true
    }
  }, [selectedBreed])

  const displayKnowledge = knowledge || (loading ? { insights: [] } : buildFallbackKnowledge(selectedBreed))

  return (
    <section className="breed-knowledge-layout">
      <section className="lovely-panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#d86b78]">Breed Knowledge Base</p>
            <div className="breed-title-row mt-2">
              <img className="breed-title-paw" src="/kitten-paw-cutout.png" alt="" />
              <h2>Know More About Your Cat's Breed</h2>
            </div>
          </div>
          <label className="cute-label min-w-[240px]">
            Choose breed
            <select className="cute-input" value={selectedBreed} onChange={(event) => updateBreed(event.target.value)}>
              {breeds.map((breed) => <option key={breed}>{breed}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-[22px] border border-[#f5d8d3] bg-[#fff8f1] p-4">
          <p className="text-sm font-black text-[#3d2b2f]">
            {loading ? 'Finding two useful breed resources...' : `${selectedBreed} selected resources`}
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-[#6d5960]">
            This page uses OpenAI web search to directly select two useful pages about the chosen breed. It shows source titles and URLs only, with no generated medical summary.
          </p>
          {loading && (
            <span className="mt-3 inline-flex rounded-full bg-[#ddf1ed] px-3 py-1 text-xs font-black text-[#35665f]">
              Agent mode: OpenAI web search running
            </span>
          )}
          {!loading && knowledge?.llm_agent && (
            <span className="mt-3 inline-flex rounded-full bg-[#ddf1ed] px-3 py-1 text-xs font-black text-[#35665f]">
              Agent mode: {knowledge.llm_agent}
            </span>
          )}
          {!loading && !knowledge?.llm_agent && (
            <span className="mt-3 inline-flex rounded-full bg-[#fff3e4] px-3 py-1 text-xs font-black text-[#8b5b37]">
              Agent mode: demo fallback
            </span>
          )}
        </div>

        {error && <p className="mt-4 rounded-2xl border border-[#f5d8d3] bg-[#fff3e4] p-3 text-sm font-semibold text-[#8b5b37]">{error}</p>}
        {loading && !knowledge && (
          <p className="mt-4 rounded-2xl border border-[#f5d8d3] bg-[#fff8f1] p-3 text-sm font-semibold text-[#7c6670]">
            Searching the web now. This can take a few seconds.
          </p>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {displayKnowledge.insights.map((item, index) => (
            <article className="knowledge-card" key={`${item.title}-${item.source}`}>
              <p className="text-xs font-black uppercase tracking-wide text-[#d86b78]">Resource {index + 1} · {item.source}</p>
              <h3>{item.title}</h3>
              {item.summary && <p>{item.summary}</p>}
              <a href={item.source_url} target="_blank" rel="noreferrer">View trusted source</a>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default BreedKnowledgePage
