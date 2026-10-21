import type { BooknavGroup, BooknavPageConfig } from "../types/booknavConfig";

// 书签导航页面配置
export const booknavPageConfig: BooknavPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// favicon 自动获取配置
	favicon: {
		// 书签未填写 icon 时，是否自动获取目标站点的 favicon 图标
		enabled: true,

		// favicon 接口地址，{domain} 为占位符，会被替换成目标站点域名
		// 更换接口只需保证地址里含有 {domain}，例如：
		//   https://a.favicon.im/{domain}
		//   https://favicon.im/{domain}
		api: "https://a.favicon.im/{domain}",
	},
};

// 书签导航配置
// 每个数组项是一个分类组，分类组内的 items 是该分类下的书签
export const booknavConfig: BooknavGroup[] = [
	{
		id: "mine",
		name: "我的东西",
		icon: "material-symbols:rocket-launch-rounded",
		desc: "自己做的项目和主页",
		weight: 100,
		items: [
			{
				title: "drink-picker",
				url: "https://aqua739085.github.io/drink-picker/",
				desc: "鸡尾酒选择测试，101 款 IBA 配方",
				weight: 10,
			},
			{
				title: "lol-soul",
				url: "https://aqua739085.github.io/lol-soul/",
				desc: "英雄联盟灵魂英雄匹配，22 个英雄 / 6 维度",
				weight: 9,
			},
			{
				title: "GitHub",
				url: "https://github.com/AQUA739085",
				desc: "我的 GitHub 主页",
				icon: "fa7-brands:github",
				weight: 8,
			},
			{
				title: "博客源码",
				url: "https://github.com/AQUA739085/AQUA739085.github.io",
				desc: "本站仓库，Astro + Firefly",
				icon: "material-symbols:code",
				weight: 7,
			},
		],
	},
	{
		id: "dev",
		name: "开发",
		icon: "material-symbols:code-rounded",
		desc: "写代码时离不开的站点",
		weight: 90,
		items: [
			{
				title: "MDN Web Docs",
				url: "https://developer.mozilla.org",
				desc: "最权威的 Web 技术文档",
				weight: 10,
			},
			{
				title: "Vue 3",
				url: "https://cn.vuejs.org",
				desc: "Vue 3 中文文档",
				weight: 9,
			},
			{
				title: "Vite",
				url: "https://cn.vite.dev",
				desc: "下一代前端构建工具",
				weight: 8,
			},
			{
				title: "Tailwind CSS",
				url: "https://tailwindcss.com",
				desc: "一个功能强大且灵活的 CSS 框架",
				weight: 7,
			},
			{
				title: "Iconify",
				url: "https://icon-sets.iconify.design",
				desc: "海量开源图标集合搜索",
				weight: 6,
			},
		],
	},
	{
		id: "acg",
		name: "二次元",
		icon: "material-symbols:auto-stories-outline-rounded",
		desc: "追番、补档与情报站",
		weight: 80,
		items: [
			{
				title: "Bangumi 番组计划",
				url: "https://bgm.tv",
				desc: "动画、书籍、音乐条目库",
				weight: 10,
			},
			{
				title: "VNDB",
				url: "https://vndb.org",
				desc: "视觉小说数据库",
				weight: 9,
			},
		],
	},
	{
		id: "tools",
		name: "工具",
		icon: "material-symbols:build-outline-rounded",
		desc: "顺手的在线小工具",
		weight: 70,
		items: [
			{
				title: "TinyPNG",
				url: "https://tinypng.com",
				desc: "在线压缩 PNG / JPEG 图片",
				weight: 10,
			},
			{
				title: "Squoosh",
				url: "https://squoosh.app",
				desc: "Google 出品的图片压缩与格式转换",
				weight: 9,
			},
			{
				title: "Carbon",
				url: "https://carbon.now.sh",
				desc: "把代码片段生成漂亮的图片",
				weight: 8,
			},
		],
	},
];
