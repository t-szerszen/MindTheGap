import { useState, useSyncExternalStore } from 'react'
import { Button } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Card } from '../../components/Paper'
import { pl } from '../../i18n/pl'
import { flushWrites } from '../../lib/db/sync'
import { wordsToCsv } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { useAttempts } from '../exercises/useAttempts'
import { useWords } from '../vocabulary/useWords'

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

function downloadCsv(csv: string) {
  // BOM, żeby Excel nie zepsuł polskich znaków
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mind-the-gap-slowka.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function SyncSection() {
  const t = pl.settings
  const { user } = useAuth()
  const { words, fromCache, pending, error } = useWords()
  const { attempts } = useAttempts()
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine)
  const [flushing, setFlushing] = useState(false)
  const [flushed, setFlushed] = useState(false)
  if (!user) return null

  const status = !online
    ? t.syncOffline
    : error
      ? t.syncError
      : pending || flushing
        ? t.syncPending
        : fromCache
          ? t.syncConnecting
          : flushed
            ? t.syncJustNow
            : t.syncOk

  async function flush() {
    setFlushing(true)
    try {
      await flushWrites()
      setFlushed(true)
    } finally {
      setFlushing(false)
    }
  }

  return (
    <Card tilt={-1} tape={{ color: 'm', pos: 'tl' }} className="sync-card" aria-labelledby="sync-h">
      <div className="row" style={{ gap: 10 }}>
        <Icon name="cloud" size="l" className="sync-ico" />
        <div className="grow">
          <h2 id="sync-h" className="h-s">
            {t.sync}
          </h2>
          <p className="note blue" style={{ fontSize: 14 }} aria-live="polite">
            {status}
          </p>
        </div>
      </div>
      <dl className="kv sync-kv">
        <dt>{t.savedWords}</dt>
        <dd className="hand">{words.length}</dd>
        <dt>{t.attempts}</dt>
        <dd className="hand">{attempts.length}</dd>
        <dt>{t.offline}</dt>
        <dd className="hand">{t.offlineWhat}</dd>
      </dl>
      <div className="row wrap" style={{ gap: 12, marginTop: 12 }}>
        <Button size="sm" onClick={flush} disabled={!online || flushing}>
          {t.syncNow}
        </Button>
        {words.length > 0 && (
          <button type="button" className="link-pen" onClick={() => downloadCsv(wordsToCsv(words))}>
            {t.export}
          </button>
        )}
      </div>
    </Card>
  )
}
