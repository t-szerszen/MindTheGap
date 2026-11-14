import { HashRouter, Route, Routes } from 'react-router'

export function App() {
  // HashRouter, bo GitHub Pages nie ma fallbacku na index.html
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<h1>Mind the Gap</h1>} />
      </Routes>
    </HashRouter>
  )
}
