import React, { createContext, useContext, useState } from "react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbContextType {
  items: BreadcrumbItem[]
  setItems: React.Dispatch<React.SetStateAction<BreadcrumbItem[]>>
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<BreadcrumbItem[]>([])
  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) throw new Error("useBreadcrumb must be used within a BreadcrumbProvider")
  return ctx
} 