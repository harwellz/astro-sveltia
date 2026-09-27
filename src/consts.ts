// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import type { Multilingual } from "@/i18n";

export const BRAND_NAME: string | Multilingual = "meganode";
export const SITE_TITLE: string | Multilingual = "meganode";
export const SITE_TAGLINE: string | Multilingual = "scale your ideas";

export const SITE_DESCRIPTION: string | Multilingual = {
	en: "meganode — scale your ideas. Projects and long-form notes on IT hardware and networking, digital marketing, data analytics and web3 building.",
	es: "meganode — escala tus ideas. Proyectos y artículos sobre hardware y redes, marketing digital, análisis de datos y desarrollo web3.",
	ja: "meganode — アイデアをスケールさせよう。ITハードウェアとネットワーク、デジタルマーケティング、データ分析、web3開発に関するプロジェクトと記事。",
	"zh-cn":
		"meganode — 让你的想法规模化。关于 IT 硬件与网络、数字营销、数据分析和 web3 开发的项目与长文。",
	ar: "meganode — طوّر أفكارك على نطاق واسع. مشاريع ومقالات حول عتاد تقنية المعلومات والشبكات والتسويق الرقمي وتحليل البيانات وتطوير web3.",
};

export const X_ACCOUNT: string | Multilingual = "@harwellzz";

export const NOT_TRANSLATED_CAUTION: string | Multilingual = {
	en: "This page is not available in your language.",
	es: "Esta página no está disponible en tu idioma.",
};
