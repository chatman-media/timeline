import "@/styles/globals.css"

import type { AppProps } from "next/app"
import { ThemeProvider } from "next-themes"

import { RootProvider } from "@/providers/root-provider"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RootProvider>
        <Component {...pageProps} />
      </RootProvider>
    </ThemeProvider>
  )
}
