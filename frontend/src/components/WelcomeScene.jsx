import { useEffect, useMemo, useState } from 'react'

function WelcomeScene({ onEnter }) {
  const [progress, setProgress] = useState(0)
  const meetPosition = useMemo(() => `${progress / 2}%`, [progress])

  useEffect(() => {
    const duration = 4300
    const intervalMs = 40
    const startedAt = Date.now()

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min(100, Math.round((elapsed / duration) * 100))
      setProgress(nextProgress)

      if (nextProgress >= 100) {
        window.clearInterval(timer)
      }
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <main className="welcome-scene">
      <img className="welcome-home-bg" src="/home.jpg" alt="" aria-hidden="true" />
      <div className="welcome-vignette" aria-hidden="true" />

      <section
        className="welcome-stage photo-stage loading-stage"
        aria-label="CatGuardian AI loading animation"
        style={{ '--progress': `${progress}%`, '--meet': meetPosition }}
      >
        <div className="loading-card">
          <p className="loading-kicker">CatGuardian AI</p>
          <h1>Meow, I am waiting for you.........</h1>

          <div className="loading-track" aria-label={`Loading data ${progress}%`}>
            <span className="loading-fill" />
            <span className="loading-midpoint" />
            <div className="loading-characters" aria-hidden="true">
              <img className="loading-person" src="/person-cutout.png" alt="" />
              <img className="loading-kitten" src="/kitten-cutout.png" alt="" />
            </div>
          </div>

          <div className="loading-status">
            <span>Loading data</span>
            <strong>{progress}%</strong>
          </div>

          {progress >= 100 && (
            <button className="enter-button loading-enter" type="button" onClick={onEnter}>
              Enter
            </button>
          )}
        </div>
      </section>
    </main>
  )
}

export default WelcomeScene
