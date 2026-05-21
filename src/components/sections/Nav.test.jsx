import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../i18n/LangContext'
import Nav from './Nav'

function wrap(ui) { return render(<LangProvider>{ui}</LangProvider>) }

test('renders brand name', () => {
  wrap(<Nav />)
  expect(screen.getByText('Wewarna')).toBeInTheDocument()
})

test('hamburger opens mobile sheet', () => {
  wrap(<Nav />)
  const burger = screen.getByRole('button', { name: /open menu/i })
  fireEvent.click(burger)
  expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
})
