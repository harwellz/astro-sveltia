import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { DEFAULT_LOCALE_SETTING, LOCALES_SETTING } from "./src/i18n/locales";

// https://astro.build/config
export default defineConfig({
	// TODO(HG-1): confirm production URL; switch to https://meganode.org at go-live (HG-9)
	site: "https://astro-sveltia.cloudflare-domain-ca0.workers.dev",
	i18n: {
		defaultLocale: DEFAULT_LOCALE_SETTING,
		locales: Object.keys(LOCALES_SETTING),
		routing: {
			prefixDefaultLocale: true,
			redirectToDefaultLocale: false,
		},
	},
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => new URL(page).pathname !== "/admin/",
			i18n: {
				defaultLocale: DEFAULT_LOCALE_SETTING,
				locales: Object.fromEntries(
					Object.entries(LOCALES_SETTING).map(([key, value]) => [
						key,
						value.lang ?? key,
					]),
				),
			},
		}),
	],
});
