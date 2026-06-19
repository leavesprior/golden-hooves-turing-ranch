import type { MetadataRoute } from 'next'

// PWA manifest (2026-06-18) — makes the game installable as an app while the same
// build keeps serving as the normal website + Airbnb funnel. start_url is the game
// hub; scope is the whole site so booking pages still work inside the installed app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Golden Frog Trail — Back of Beyond Ranch',
    short_name: 'Golden Frog',
    description:
      'Play the Golden Frog Trail — Gold Country adventures, town investigations, and the ranch, from Back of Beyond Ranch.',
    start_url: '/hub',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#1a131f',
    theme_color: '#1a131f',
    categories: ['games', 'entertainment'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
