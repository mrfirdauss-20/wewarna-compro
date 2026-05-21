import { LangProvider } from './i18n/LangContext'
import Nav from './components/sections/Nav'

export default function App() {
  return (
    <LangProvider>
      <Nav />
    </LangProvider>
  )
}
