import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import netlify from "@netlify/vite-plugin";

function siteHtmlEnv(siteUrl, robots) {
  return {
    name: "enac-site-html-env",
    transformIndexHtml(html) {
      return html.replaceAll("%SITE_URL%", siteUrl).replaceAll("%SITE_ROBOTS%", robots);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = (env.VITE_SITE_URL || env.SITE_URL || "https://www.stobienia.com.br").replace(
    /\/$/,
    "",
  );
  const siteIndexable =
    env.VITE_SITE_INDEXABLE === undefined && env.SITE_INDEXABLE === undefined
      ? false
      : (env.VITE_SITE_INDEXABLE || env.SITE_INDEXABLE) === "true";
  const robots = siteIndexable ? ["index", "follow"].join(", ") : "noindex, nofollow, noarchive";

  return {
    plugins: [react(), siteHtmlEnv(siteUrl, robots), netlify()],
  };
});
