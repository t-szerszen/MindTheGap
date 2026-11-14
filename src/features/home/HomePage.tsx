import { pl } from '../../i18n/pl'
import { useAuth } from '../auth/useAuth'
import { Cover } from './Cover'

const dateFmt = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

export function HomePage() {
  const { user } = useAuth()
  return (
    <div className="home">
      <Cover name={user?.name} />
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
