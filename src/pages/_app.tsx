import type { AppProps } from "next/app"
import "@/styles/globals.css"
import { ThemeProvider } from "next-themes"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
