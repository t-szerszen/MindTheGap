import { HashRouter, Route, Routes } from 'react-router'
import { Shell } from './components/Shell'
import { NotFound } from './components/States'
import { HomePage } from './features/home/HomePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { MorePage } from './features/topics/MorePage'

export function App() {
  // HashRouter, bo GitHub Pages nie ma fallbacku na index.html
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
