import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/rentals/availability'],
      },
    ],
    sitemap: 'https://backofbeyondranch.farm/sitemap.xml',
  }
}
