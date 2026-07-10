import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/useAuthStore'
import { useHabitsStore } from './features/habits/habitsStore'
import { useJournalStore } from './features/journal/journalStore'
import { usePeopleStore } from './features/people/peopleStore'
import { useKbStore } from './features/kb/kbStore'
import { useGoalsStore } from './features/goals/goalsStore'
import { useTasksStore } from './features/tasks/tasksStore'
import { useFocusStore } from './features/focus/focusStore'
import { useCreedStore } from './features/creed/creedStore'
import { Login } from './components/Login'
import { AppShell } from './components/AppShell'
import { SplashScreen } from './components/SplashScreen'
import { HabitsPage } from './features/habits/HabitsPage'
import { CommandCenter } from './features/dashboard/CommandCenter'
import { PeoplePage } from './features/people/PeoplePage'
import { JournalPage } from './features/journal/JournalPage'
import { KbPageView } from './features/kb/KbPage'
import { GoalsPage } from './features/goals/GoalsPage'
import { TasksPage } from './features/tasks/TasksPage'
import { FocusPage } from './features/focus/FocusPage'
import { CreedPage } from './features/creed/CreedPage'

function App() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const setSession = useAuthStore((s) => s.setSession)
  const loadHabits = useHabitsStore((s) => s.load)
  const loadJournal = useJournalStore((s) => s.load)
  const loadPeople = usePeopleStore((s) => s.load)
  const loadKb = useKbStore((s) => s.load)
  const loadGoals = useGoalsStore((s) => s.load)
  const loadTasks = useTasksStore((s) => s.load)
  const loadFocus = useFocusStore((s) => s.load)
  const loadCreed = useCreedStore((s) => s.load)

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
      loadKb()
      loadGoals()
      loadTasks()
      loadFocus()
      loadCreed()
    }
  }, [userId, loadHabits, loadJournal, loadPeople, loadKb, loadGoals, loadTasks, loadFocus, loadCreed])

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
          <Route path="knowledge" element={<KbPageView />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="focus" element={<FocusPage />} />
          <Route path="creed" element={<CreedPage />} />
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
