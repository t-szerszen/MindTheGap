import { HashRouter, Route, Routes } from 'react-router'
import { Page } from './components/Page'
import { Shell } from './components/Shell'
import { AuthProvider } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { PrefsSync } from './features/settings/PrefsSync'
import { LeechesPage } from './features/vocabulary/LeechesPage'
import { ReviewPage } from './features/vocabulary/ReviewPage'
import { WordsPage } from './features/vocabulary/WordsPage'
import { WordsProvider } from './features/vocabulary/WordsProvider'
import { NotFound } from './components/States'
import { HomePage } from './features/home/HomePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TensePage } from './features/tenses/TensePage'
import { TensesIndexPage } from './features/tenses/TensesIndexPage'
import { MorePage } from './features/topics/MorePage'
import { TranslatorPage } from './features/translator/TranslatorPage'

export function App() {
  // HashRouter, bo GitHub Pages nie ma fallbacku na index.html
  return (
    <AuthProvider>
      <PrefsSync />
      <WordsProvider>
        <HashRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<HomePage />} />
              <Route path="tenses" element={<TensesIndexPage />} />
              <Route path="tenses/:id" element={<TensePage />} />
              <Route path="translator" element={<TranslatorPage />} />
              <Route
                path="words"
                element={
                  <Page>
                    <RequireAuth>
                      <WordsPage />
                    </RequireAuth>
                  </Page>
                }
              />
              <Route
                path="leeches"
                element={
                  <Page>
                    <RequireAuth>
                      <LeechesPage />
                    </RequireAuth>
                  </Page>
                }
              />
              <Route
                path="review"
                element={
                  <Page paper="desk">
                    <RequireAuth>
                      <ReviewPage />
                    </RequireAuth>
                  </Page>
                }
              />
              <Route path="more" element={<MorePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </WordsProvider>
    </AuthProvider>
  )
}
