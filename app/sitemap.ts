import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const SITE_URL = 'https://svgcrush.shop';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
