import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider, useT, LangToggle } from './LangContext'

function Probe() {
  const { t, lang } = useT()
  return <span data-testid="lang">{lang}:{t.whatsapp.number}</span>
}

test('defaults to EN, exposes correct WA number', () => {
  render(<LangProvider><Probe /></LangProvider>)
  expect(screen.getByTestId('lang').textContent).toBe('en:6281252762200')
})

test('LangToggle switches to ID', () => {
  render(<LangProvider><LangToggle /><Probe /></LangProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'ID' }))
  expect(screen.getByTestId('lang').textContent).toBe('id:6281252762200')
})
