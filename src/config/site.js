export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://www.stobienia.com.br").replace(
  /\/$/,
  "",
);

export const SITE_INDEXABLE = import.meta.env.VITE_SITE_INDEXABLE === "true";

export const SITE_ROBOTS = SITE_INDEXABLE
  ? "index, follow"
  : "noindex, nofollow, noarchive";

export function siteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
