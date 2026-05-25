import { useEffect, useMemo, useState } from 'react'

function WelcomeScene({ onEnter }) {
  const [progress, setProgress] = useState(0)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [exiting, setExiting] = useState(false)
  const meetPosition = useMemo(() => `${progress / 2}%`, [progress])

  useEffect(() => {
    const duration = 4200
    const intervalMs = 32
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

  useEffect(() => {
    const handleMove = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2
      const y = (event.clientY / window.innerHeight - 0.5) * 2
      setMouse({ x, y })
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const stageLabel =
    progress < 70 ? 'Meow, I am waiting for you.........' : "What's up, my guardian?"

  const handleEnter = () => {
    if (exiting) {
      return
    }
    setExiting(true)
    window.setTimeout(() => onEnter(), 420)
  }

  return (
    <main className={`welcome-scene${exiting ? ' is-exiting' : ''}`}>
      <div
        className="welcome-parallax"
        style={{
          '--mx': mouse.x.toFixed(4),
          '--my': mouse.y.toFixed(4),
          '--progress': `${progress}%`,
          '--meet': meetPosition,
        }}
      >
        <img className="welcome-home-bg welcome-layer-back" src="/home.jpg" alt="" aria-hidden="true" />
        <img className="welcome-home-bg welcome-layer-mid" src="/home.jpg" alt="" aria-hidden="true" />
        <div className="welcome-vignette" aria-hidden="true" />

        <section className="welcome-stage photo-stage loading-stage" aria-label="CatGuardian AI loading animation">
          <div className="loading-card">
            <p className="loading-kicker">CatGuardian AI</p>
            <h1>{stageLabel}</h1>

            <div className="loading-track" aria-label={`Loading data ${progress}%`}>
              <span className="loading-fill" />
              <span className="loading-midpoint" />
              <div className="loading-characters" aria-hidden="true">
                <img className="loading-person" src="/person-cutout.png" alt="" />
                <img className="loading-kitten" src="/kitten-cutout.png" alt="" />
              </div>
            </div>

            <div className="loading-status">
              <span>Reading hidden kitten signals</span>
              <strong>{progress}%</strong>
            </div>

            {progress >= 100 && (
              <button className="enter-button loading-enter" type="button" onClick={handleEnter}>
                Enter
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default WelcomeScene
