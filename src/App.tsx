import { HashRouter, Route, Routes } from 'react-router'
import { Shell } from './components/Shell'
import { NotFound } from './components/States'

export function App() {
  // HashRouter, bo GitHub Pages nie ma fallbacku na index.html
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
