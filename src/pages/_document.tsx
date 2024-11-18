import { Head, Html, Main, NextScript } from "next/document"
import { ThemeProvider } from "next-themes"

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <Main />
          <NextScript />
        </ThemeProvider>
      </body>
    </Html>
  )
}
