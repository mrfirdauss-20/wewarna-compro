import { LangProvider } from './i18n/LangContext'
import Nav from './components/sections/Nav'
import Hero from './components/sections/Hero'
import Marquee from './components/sections/Marquee'
import Collection from './components/sections/Collection'
import Story from './components/sections/Story'
import Process from './components/sections/Process'

export default function App() {
  return (
    <LangProvider>
      <Nav />
      <Hero />
      <Marquee />
      <Collection />
      <Story />
      <Process />
    </LangProvider>
  )
}
