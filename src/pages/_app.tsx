import "@/styles/globals.css"

import type { AppProps } from "next/app"
import { ThemeProvider } from "next-themes"
import { Providers } from "@/media-editor/providers"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Providers>
        <Component {...pageProps} />
      </Providers>
    </ThemeProvider>
  )
}
