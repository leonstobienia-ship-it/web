const siteIndexableEnv = import.meta.env.VITE_SITE_INDEXABLE;

export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://www.stobienia.com.br").replace(
  /\/$/,
  "",
);

export const SITE_INDEXABLE =
  siteIndexableEnv === undefined ? false : siteIndexableEnv === "true";

export const SITE_ROBOTS = SITE_INDEXABLE
  ? ["index", "follow"].join(", ")
  : "noindex, nofollow, noarchive";

export function siteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
