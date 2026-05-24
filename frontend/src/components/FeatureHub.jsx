const features = [
  {
    id: 'cat-profile',
    label: 'Cat Profile',
    description: 'Breed, sex, reproductive status, age, and weight.',
  },
  {
    id: 'daily-monitoring',
    label: 'Daily Monitoring',
    description: 'Water, food, activity, litter, appetite, vomiting, and weight.',
  },
  {
    id: 'risk-predict',
    label: 'Risk Predict',
    description: 'Structured ML scores for hidden deterioration risk.',
  },
  {
    id: 'breed-knowledge',
    label: 'Breed Knowledge',
    description: 'Known breed-specific vulnerability lookup.',
  },
  {
    id: 'clinical-reasoning',
    label: 'Clinical Reasoning',
    description: 'AI explanation based only on structured agent outputs.',
  },
  {
    id: 'triage',
    label: 'Triage',
    description: 'Next-step urgency and nearby vet recommendation.',
  },
]

function FeatureHub({ onOpen }) {
  return (
    <section className="hub-wrap">
      <div className="hub-heading">
        <img className="hub-paw" src="/kitten-paw-cutout.png" alt="Cat paw" />
        <h2>Our journey starts here.......</h2>
      </div>

      <div className="hub-button-grid">
        {features.map((feature, index) => (
          <button
            className="hub-pill-button"
            key={feature.id}
            onClick={() => onOpen(feature.id)}
            style={{ '--delay': `${index * 70}ms` }}
            type="button"
          >
            <span>{feature.label}</span>
            <small>{feature.description}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

export default FeatureHub
