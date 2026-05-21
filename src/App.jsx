import { LangProvider } from './i18n/LangContext'
import Nav from './components/sections/Nav'
import Hero from './components/sections/Hero'
import Marquee from './components/sections/Marquee'
import Collection from './components/sections/Collection'
import Story from './components/sections/Story'
import Process from './components/sections/Process'
import Lookbook from './components/sections/Lookbook'
import Values from './components/sections/Values'
import Contact from './components/sections/Contact'
import Footer from './components/sections/Footer'
import FloatWA from './components/sections/FloatWA'

export default function App() {
  return (
    <LangProvider>
      <Nav />
      <Hero />
      <Marquee />
      <Collection />
      <Story />
      <Process />
      <Lookbook />
      <Values />
      <Contact />
      <Footer />
      <FloatWA />
    </LangProvider>
  )
}
