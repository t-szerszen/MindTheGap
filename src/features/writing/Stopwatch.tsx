import { useEffect, useState } from 'react'
import { Button } from '../../components/Controls'
import { pl } from '../../i18n/pl'

const LIMIT = 45 * 60

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// stoper liczy w górę; po 45 minutach tylko się czerwieni, pisać można dalej
export function Stopwatch({
  seconds,
  onChange,
}: {
  seconds: number
  onChange: (s: number) => void
}) {
  const t = pl.writing
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => onChange(seconds + 1), 1000)
    return () => clearInterval(id)
  }, [running, seconds, onChange])

  const over = seconds >= LIMIT
  return (
    <div className="stopwatch row wrap">
      <span className={`hand stopwatch-time${over ? ' red' : ''}`} aria-live="off">
        {fmt(seconds)}
      </span>
      <Button size="sm" onClick={() => setRunning(!running)}>
        {running ? t.timerPause : t.timerStart}
      </Button>
      <Button
        size="sm"
        onClick={() => {
          setRunning(false)
          onChange(0)
        }}
        disabled={!seconds}
      >
        {t.timerReset}
      </Button>
      <span className="note ink small">{over ? t.timeUp : t.timerHint}</span>
    </div>
  )
}
