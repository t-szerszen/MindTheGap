import { pl } from '../../i18n/pl'
import { Cover } from './Cover'

const dateFmt = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

export function HomePage() {
  return (
    <div className="home">
      <Cover />
      <div className="sheet ruled page-in home-sheet">
        <div className="hdr">
          <h1 className="h-l">{pl.home.title}</h1>
          <p className="note blue" style={{ paddingBottom: 4 }}>
            {dateFmt.format(new Date())}
          </p>
        </div>
      </div>
    </div>
  )
}
