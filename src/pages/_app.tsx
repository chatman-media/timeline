import "@/styles/globals.css"

import type { AppProps } from "next/app"
import { ThemeProvider } from "next-themes"

import { Providers } from "@/media-editor/providers"
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/coi-serviceworker.js");
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Providers>
        <Component {...pageProps} />
      </Providers>
    </ThemeProvider>
  )
}
