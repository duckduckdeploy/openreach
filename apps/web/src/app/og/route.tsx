import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/**
 * The social preview image for any page: /og?t=<title>&s=<section>.
 * pageMeta() points every page here, so each page gets its own image in the site's style.
 */
export const dynamic = 'force-dynamic';

const PUBLIC = join(process.cwd(), 'public');

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 600 | 700; style: 'normal' }[]> | null = null;
const loadFonts = () =>
  (fonts ??= Promise.all([
    readFile(join(PUBLIC, 'fonts/bricolage-700.ttf')).then((data) => ({ name: 'Bricolage', data, weight: 700 as const, style: 'normal' as const })),
    readFile(join(PUBLIC, 'fonts/plex-sans-500.ttf')).then((data) => ({ name: 'Plex', data, weight: 500 as const, style: 'normal' as const })),
    readFile(join(PUBLIC, 'fonts/plex-sans-600.ttf')).then((data) => ({ name: 'Plex', data, weight: 600 as const, style: 'normal' as const })),
  ]));

const C = { cream: '#fbf8f3', ink: '#17130f', muted: '#544c44', pink: '#c81e64', peach: '#fdeee2', peachStrong: '#f8cfae', peachText: '#8a3a0a', orange: '#f2681c', night: '#15110e', nightText: '#f7f0e7' };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const title = (params.get('t') || 'Open-source lead generation tool').slice(0, 140);
  const section = (params.get('s') || '').slice(0, 40);

  const long = title.length;
  const size = long <= 40 ? 80 : long <= 70 ? 66 : 54;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Plex',
          // Opaque stops only (the renderer turns transparent stops black): sunset yellow left, cream middle, pink right.
          backgroundColor: C.cream,
          backgroundImage: 'linear-gradient(120deg, #fde3b0 0%, #fbf8f3 34%, #fbf8f3 62%, #f7cde0 100%)',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '56px 72px 40px', gap: 48 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {section ? (
              <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', background: C.peach, border: `2px solid ${C.peachStrong}`, color: C.peachText, fontSize: 24, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', borderRadius: 999, padding: '8px 20px' }}>
                  {section}
                </div>
              </div>
            ) : null}
            <div style={{ display: 'flex', marginTop: section ? 28 : 0, fontFamily: 'Bricolage', fontWeight: 700, fontSize: size, lineHeight: 1.04, letterSpacing: -size * 0.03, color: C.ink }}>{title}</div>
            <div style={{ display: 'flex', marginTop: 28, width: 120, height: 8, borderRadius: 8, backgroundImage: 'linear-gradient(90deg, #f9b530, #f5713a, #d6246e, #8a2fb8)' }} />
          </div>
        </div>

        {/* Night bar: logo and address */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.night, padding: '26px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="44" height="44" viewBox="0 0 32 32">
              <defs>
                <linearGradient id="g" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#f9b530" />
                  <stop offset="0.3" stopColor="#f5713a" />
                  <stop offset="0.62" stopColor="#d6246e" />
                  <stop offset="1" stopColor="#8a2fb8" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#g)" />
              <path d="M11 21 22.5 10.5M11 21l12.5 2" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="11" cy="21" r="5" fill="#ffffff" />
              <circle cx="22.5" cy="10.5" r="3.4" fill="#ffffff" />
              <circle cx="24" cy="23" r="2.6" fill="#ffffff" />
            </svg>
            <div style={{ display: 'flex', fontFamily: 'Bricolage', fontWeight: 700, fontSize: 34, color: C.nightText }}>OpenReach</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, color: '#c6b9ab' }}>
            <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 10, background: C.orange }} />
            Open source · openreach.gg
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: await loadFonts(),
      headers: { 'cache-control': 'public, max-age=86400, s-maxage=2592000, immutable' },
    },
  );
}
