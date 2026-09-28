import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // TODO: replace with the real domain once deployed
  site: "https://siva-medicals.pages.example",
  i18n: {
    locales: ["en", "ta"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({ i18n: { defaultLocale: "en", locales: { en: "en-IN", ta: "ta-IN" } } }),
  ],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Noto Sans",
      cssVariable: "--font-noto-sans",
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Noto Sans Tamil",
      cssVariable: "--font-noto-tamil",
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["tamil"],
      fallbacks: ["sans-serif"],
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
