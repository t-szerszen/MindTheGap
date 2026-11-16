import { HashRouter, Route, Routes } from 'react-router'
import { Page } from './components/Page'
import { Shell } from './components/Shell'
import { AuthProvider } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { pl } from './i18n/pl'
import { AttemptsProvider } from './features/exercises/AttemptsProvider'
import { ExercisesPage } from './features/exercises/ExercisesPage'
import { ProgressPage } from './features/exercises/ProgressPage'
import { SessionPage } from './features/exercises/SessionPage'
import { PrefsSync } from './features/settings/PrefsSync'
import { LeechesPage } from './features/vocabulary/LeechesPage'
import { ReviewPage } from './features/vocabulary/ReviewPage'
import { WordsPage } from './features/vocabulary/WordsPage'
import { WordsProvider } from './features/vocabulary/WordsProvider'
import { NotFound } from './components/States'
import { GrammarIndexPage } from './features/grammar/GrammarIndexPage'
import { GrammarPage } from './features/grammar/GrammarPage'
import { HomePage } from './features/home/HomePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TensePage } from './features/tenses/TensePage'
import { TensesIndexPage } from './features/tenses/TensesIndexPage'
import { MorePage } from './features/topics/MorePage'
import { PhraseSetPage } from './features/topics/PhraseSetPage'
import { TopicPage } from './features/topics/TopicPage'
import { TranslatorPage } from './features/translator/TranslatorPage'
import { ExamPage } from './features/exam/ExamPage'
import { ExamRunPage } from './features/exam/ExamRunPage'
import { ReadingListPage } from './features/reading/ReadingListPage'
import { ReadingPage } from './features/reading/ReadingPage'
import { WritingListPage } from './features/writing/WritingListPage'
import { WritingPage } from './features/writing/WritingPage'

export function App() {
  // HashRouter, bo GitHub Pages nie ma fallbacku na index.html
  return (
    <AuthProvider>
      <PrefsSync />
      <WordsProvider>
        <AttemptsProvider>
          <HashRouter>
            <Routes>
              <Route element={<Shell />}>
                <Route index element={<HomePage />} />
                <Route path="tenses" element={<TensesIndexPage />} />
                <Route path="tenses/:id" element={<TensePage />} />
                <Route path="grammar" element={<GrammarIndexPage />} />
                <Route path="grammar/:id" element={<GrammarPage />} />
                <Route
                  path="translator"
                  element={
                    <RequireAuth text={pl.auth.gateTranslator}>
                      <TranslatorPage />
                    </RequireAuth>
                  }
                />
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
                <Route path="exercises" element={<ExercisesPage />} />
                <Route path="writing" element={<WritingListPage />} />
                <Route path="writing/:id" element={<WritingPage />} />
                <Route path="reading" element={<ReadingListPage />} />
                <Route path="reading/:id" element={<ReadingPage />} />
                <Route path="exam" element={<ExamPage />} />
                <Route path="exam/run" element={<ExamRunPage />} />
                <Route path="exercises/session" element={<SessionPage />} />
                <Route
                  path="exercises/progress"
                  element={
                    <Page paper="ruled">
                      <RequireAuth>
                        <ProgressPage />
                      </RequireAuth>
                    </Page>
                  }
                />
                <Route path="more" element={<MorePage />} />
                <Route path="topics/:id" element={<TopicPage />} />
                <Route path="phrases/:id" element={<PhraseSetPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </HashRouter>
        </AttemptsProvider>
      </WordsProvider>
    </AuthProvider>
  )
}
