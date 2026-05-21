import { LangProvider } from './i18n/LangContext'
import Nav from './components/sections/Nav'
import Hero from './components/sections/Hero'

export default function App() {
  return (
    <LangProvider>
      <Nav />
      <Hero />
    </LangProvider>
  )
}
