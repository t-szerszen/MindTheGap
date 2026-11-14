import { useEffect, useState } from 'react'
import { Progress } from '../../components/Controls'
import { pl } from '../../i18n/pl'
import { fetchUsage, type Usage } from '../../lib/translate'

const nf = new Intl.NumberFormat('pl-PL')

// pokazuje się tylko, jeśli worker ma /usage i odpowiedział
export function UsageSection() {
  const [usage, setUsage] = useState<Usage | null>(null)
  useEffect(() => {
    let alive = true
    fetchUsage({ url: import.meta.env.VITE_TRANSLATE_API_URL }).then((u) => alive && setUsage(u))
    return () => {
      alive = false
    }
  }, [])
  if (!usage || !usage.limit) return null
  const left = Math.max(0, usage.limit - usage.count)
  const t = pl.settings
  return (
    <section style={{ marginTop: 26 }} aria-labelledby="deepl-h">
      <h2 id="deepl-h" className="h-m">
        {t.deepl}
      </h2>
      <p className="small" style={{ marginTop: 6 }}>
        {t.deeplLeft(nf.format(left), nf.format(usage.limit))}
      </p>
      <div style={{ marginTop: 6 }}>
        <Progress value={usage.count / usage.limit} label={t.deeplUsed} />
      </div>
    </section>
  )
}
