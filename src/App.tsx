import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/useAuthStore'
import { useHabitsStore } from './features/habits/habitsStore'
import { useJournalStore } from './features/journal/journalStore'
import { usePeopleStore } from './features/people/peopleStore'
import { useForgeStore } from './features/forge/forgeStore'
import { Login } from './components/Login'
import { AppShell } from './components/AppShell'
import { SplashScreen } from './components/SplashScreen'
import { HabitsPage } from './features/habits/HabitsPage'
import { CommandCenter } from './features/dashboard/CommandCenter'
import { PeoplePage } from './features/people/PeoplePage'
import { JournalPage } from './features/journal/JournalPage'
import { ForgePage } from './features/forge/ForgePage'

function App() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const setSession = useAuthStore((s) => s.setSession)
  const loadHabits = useHabitsStore((s) => s.load)
  const loadJournal = useJournalStore((s) => s.load)
  const loadPeople = usePeopleStore((s) => s.load)
  const loadForge = useForgeStore((s) => s.load)

  useEffect(() => {
    // Load the persisted session, then keep the store in sync with auth changes.
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => sub.subscription.unsubscribe()
  }, [setSession])

  // Load habit data once authenticated. Keyed on user id so a token refresh
  // (which produces a new session object) doesn't trigger a redundant reload.
  const userId = session?.user?.id ?? null
  useEffect(() => {
    if (userId) {
      loadHabits()
      loadJournal()
      loadPeople()
      loadForge()
    }
  }, [userId, loadHabits, loadJournal, loadPeople, loadForge])

  let content
  if (loading) {
    content = (
      <main className="flex min-h-full items-center justify-center bg-neutral-950 text-neutral-500" />
    )
  } else if (!session) {
    content = <Login />
  } else {
    content = (
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<CommandCenter />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="forge" element={<ForgePage />} />
        </Route>
      </Routes>
    )
  }

  return (
    <>
      <SplashScreen />
      {content}
    </>
  )
}

export default App
