import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* viewport-fit=cover: aprovecha toda la pantalla del iPhone incluyendo el área del notch */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Donekta" />
        <meta name="theme-color" content="#55B584" />
        <link rel="apple-touch-icon" href="/logo-marca-corazon.svg" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
