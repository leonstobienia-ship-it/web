import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const siteUrl = (process.env.VITE_SITE_URL || "https://www.stobienia.com.br").replace(/\/$/, "");
const siteIndexable = process.env.VITE_SITE_INDEXABLE === "true";

const publicDir = join(root, "public");
await mkdir(publicDir, { recursive: true });

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/politica-de-privacidade/</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
`;

const robots = siteIndexable
  ? `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
  : `User-agent: *
Allow: /
`;

await writeFile(join(publicDir, "sitemap.xml"), sitemap);
await writeFile(join(publicDir, "robots.txt"), robots);
