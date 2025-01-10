'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { SidebarProvider, SidebarTrigger } from '@y/ui/components/sidebar'
import { useSidebar } from '@y/store/hooks/use-sidebar'
import { AppSidebar } from '@y/ui/containers/app-sidebar'

export function Providers({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useSidebar()

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <SidebarProvider open={isOpen} onOpenChange={toggle}>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </NextThemesProvider>
  )
}
