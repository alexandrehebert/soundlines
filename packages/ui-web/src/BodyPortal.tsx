import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const subscribe = () => () => {}
const getBody = () => document.body
const getServerBody = () => null

export function BodyPortal({ children }: { children: ReactNode }) {
  const body = useSyncExternalStore(subscribe, getBody, getServerBody)
  return body ? createPortal(children, body) : null
}
