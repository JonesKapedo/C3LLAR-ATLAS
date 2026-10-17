import { createContext, useContext } from 'react'
import { formatMoney } from './logic'

/** Discretion mode hides every monetary figure in the interface. */
export const DiscretionContext = createContext(false)

export function useDiscreet(): boolean {
  return useContext(DiscretionContext)
}

export function useMoney(): (value: number) => string {
  const discreet = useDiscreet()
  return (value: number) => (discreet ? '••••' : formatMoney(value))
}
