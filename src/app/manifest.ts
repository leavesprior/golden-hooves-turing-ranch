import type { MetadataRoute } from 'next'

// Arcade cabinet: home-screen launch is the ranch, not the old game hub.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Back of Beyond Ranch',
    short_name: 'BOBR',
    description:
      'Book a stay at Back of Beyond Ranch, or play the Golden Frog Trail for the first discount.',
    start_url: '/',
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
