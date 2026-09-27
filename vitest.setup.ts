import { vi } from "vitest";

// Default language for tests (read by src/i18n via import.meta.env.LANG).
// vi.stubEnv updates import.meta.env; stubbing the "import.meta" global does not.
vi.stubEnv("LANG", "en");

// Mock getRelativeLocaleUrl from astro:i18n
vi.mock("astro:i18n", () => ({
	getRelativeLocaleUrl: vi.fn((lang, path) => `/${lang}${path}`),
}));
