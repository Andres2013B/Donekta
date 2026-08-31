import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

async function loadGoogleFont(font: string, weight: number, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/)
  if (match) {
    const res = await fetch(match[1])
    if (res.ok) return await res.arrayBuffer()
  }
  throw new Error(`No se pudo cargar la fuente ${font}`)
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = (searchParams.get('name') || 'Donador').slice(0, 60)
  const amountRaw = searchParams.get('amount') || '0'
  const institution = (searchParams.get('institution') || 'una comunidad').slice(0, 80)

  const amountFormatted = Number(amountRaw).toLocaleString('es-MX')

  const bodyText = `Tu donación de $${amountFormatted} MXN a ${institution} ya está en camino para generar un cambio real en la vida de muchas personas. Gracias por ser parte de esta historia.`

  const allText = `DONEKTA CERTIFICADO DE DONACIÓN ${name} ¡Gracias por tu generosidad! ${bodyText} El equipo de Donekta Tú también puedes donar donekta.com 0123456789$`

  const [bodyFont, titleFont, scriptFont] = await Promise.all([
    loadGoogleFont('Poppins', 400, allText),
    loadGoogleFont('Poppins', 800, allText),
    loadGoogleFont('Dancing Script', 700, name + ' '),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '850px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#FBFEFC',
          position: 'relative',
          fontFamily: 'Poppins',
          padding: '70px 90px',
        }}
      >
        <div style={{ position: 'absolute', top: -120, left: -120, width: 420, height: 420, borderRadius: '50%', background: '#55B584', opacity: 0.15, display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -160, right: -160, width: 520, height: 520, borderRadius: '50%', background: '#55B584', opacity: 0.12, display: 'flex' }} />
        <div style={{ position: 'absolute', top: 30, right: -50, width: 150, height: 150, borderRadius: '50%', background: '#55B584', opacity: 0.10, display: 'flex' }} />

        <div style={{ fontSize: 54, fontWeight: 800, color: '#0B3D2E', letterSpacing: 6, display: 'flex' }}>
          DONEKTA
        </div>
        <div style={{ fontSize: 16, fontWeight: 400, color: '#55B584', letterSpacing: 4, marginTop: 8, display: 'flex' }}>
          CERTIFICADO DE DONACIÓN
        </div>

        <div style={{ fontFamily: 'Dancing Script', fontSize: 84, color: '#0B3D2E', marginTop: 40, display: 'flex' }}>
          {name}
        </div>

        <div style={{ width: 420, height: 3, background: '#55B584', marginTop: 18, marginBottom: 32, display: 'flex' }} />

        <div style={{ fontSize: 26, fontWeight: 800, color: '#0B3D2E', display: 'flex' }}>
          ¡Gracias por tu generosidad!
        </div>
        <div style={{ fontSize: 19, color: '#2E5F49', textAlign: 'center', maxWidth: 820, marginTop: 16, lineHeight: 1.6, display: 'flex' }}>
          {bodyText}
        </div>
        <div style={{ fontSize: 17, color: '#2E5F49', marginTop: 20, fontWeight: 400, display: 'flex' }}>
          — El equipo de Donekta
        </div>

        <div style={{ marginTop: 30, fontSize: 17, color: '#fff', background: '#55B584', padding: '12px 30px', borderRadius: 100, fontWeight: 600, display: 'flex' }}>
          🌱 Tú también puedes donar: donekta.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 850,
      fonts: [
        { name: 'Poppins', data: bodyFont, weight: 400, style: 'normal' },
        { name: 'Poppins', data: titleFont, weight: 800, style: 'normal' },
        { name: 'Dancing Script', data: scriptFont, weight: 700, style: 'normal' },
      ],
    }
  )
}
