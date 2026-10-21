import type { APIRoute } from "astro";

export const prerender = true;

// 注意：不要屏蔽 /_astro/，否则搜索引擎抓不到 CSS/JS，会影响渲染后的页面索引
const robotsTxt = `
User-agent: *
Disallow: /archive/?tag=
Disallow: /archive/?category=
Disallow: /archive/?uncategorized=

Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
