import { createContext, ReactNode, useContext, useState } from "react"

interface DisplayTimeContextType {
  displayTime: number
  setDisplayTime: (time: number) => void
}

const DisplayTimeContext = createContext<DisplayTimeContextType | undefined>(undefined)

export function DisplayTimeProvider({ children }: { children: ReactNode }) {
  const [displayTime, setDisplayTime] = useState(0)

  return (
    <DisplayTimeContext.Provider value={{ displayTime, setDisplayTime }}>
      {children}
    </DisplayTimeContext.Provider>
  )
}

export function useDisplayTime() {
  const context = useContext(DisplayTimeContext)
  if (context === undefined) {
    throw new Error("useDisplayTime must be used within a DisplayTimeProvider")
  }
  return context
}
