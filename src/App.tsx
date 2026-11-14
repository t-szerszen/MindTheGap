import { HashRouter, Route, Routes } from 'react-router'
import { Shell } from './components/Shell'
import { AuthProvider } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { PrefsSync } from './features/settings/PrefsSync'
import { NotFound } from './components/States'
import { HomePage } from './features/home/HomePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TensePage } from './features/tenses/TensePage'
import { TensesIndexPage } from './features/tenses/TensesIndexPage'
import { MorePage } from './features/topics/MorePage'

export function App() {
  // HashRouter, bo GitHub Pages nie ma fallbacku na index.html
  return (
    <AuthProvider>
      <PrefsSync />
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="tenses" element={<TensesIndexPage />} />
            <Route path="tenses/:id" element={<TensePage />} />
            <Route path="more" element={<MorePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
