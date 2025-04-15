import "@/styles/globals.css"

import type { AppProps } from "next/app"
import { ThemeProvider } from "next-themes"

import { StateInitializer } from "@/components/state-initializer"
import { ModalProvider } from "@/providers/modal-provider"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StateInitializer>
        <ModalProvider>
          <Component {...pageProps} />
        </ModalProvider>
      </StateInitializer>
    </ThemeProvider>
  )
}
