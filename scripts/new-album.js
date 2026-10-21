/* 快捷创建相册：复制图片 + 写入 galleryConfig + 开启相册页 + 提示推送
   用法:
     pnpm new-album <相册id> <名称> <图片目录> [日期 YYYY-MM-DD]
   例:
     pnpm new-album trip-2026 "旅行照片" "D:\\Pictures\\trip"
     pnpm new-album trip-2026 "旅行照片" "D:\\Pictures\\trip" 2026-10-21

   做四件事:
     1. 把图片复制到 public/gallery/<id>/
     2. 在 src/config/galleryConfig.ts 的 albums 数组顶部插入一项
     3. 把 siteConfig.ts 的 pages.gallery 打开（原本是 false）
     4. 把「相册」加进导航栏「我的」子菜单（src/config/navBarConfig.ts）
*/

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

if (args.length < 3) {
	console.error(`Error: 参数不够
Usage: pnpm new-album <相册id> <名称> <图片目录> [日期 YYYY-MM-DD]
Example: pnpm new-album trip-2026 "旅行照片" "D:\\\\Pictures\\\\trip"`);
	process.exit(1);
}

const [id, name, imgDir] = args;
const dateArg = args[3];

// id 只允许英文小写、数字、连字符（用于目录和 URL）
if (!/^[a-z0-9-]+$/.test(id)) {
	console.error(`Error: 相册 id "${id}" 只能用小写英文、数字、连字符（如 trip-2026）`);
	process.exit(1);
}

if (dateArg && !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
	console.error(`Error: 日期格式应为 YYYY-MM-DD，收到 "${dateArg}"`);
	process.exit(1);
}

const galleryDir = path.join("./public/gallery", id);
const configPath = "./src/config/galleryConfig.ts";
const siteConfigPath = "./src/config/siteConfig.ts";
const navBarConfigPath = "./src/config/navBarConfig.ts";
const IMG_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

// ---------- 1. 校验图片目录 ----------
if (!fs.existsSync(imgDir)) {
	console.error(`Error: 图片目录不存在: ${imgDir}`);
	process.exit(1);
}
const images = fs.readdirSync(imgDir).filter((f) => IMG_EXT.test(f)).sort();

if (images.length === 0) {
	console.error(`Error: 目录里没有图片（支持 jpg/png/webp/avif/gif）: ${imgDir}`);
	process.exit(1);
}

// ---------- 2. 复制图片 ----------
if (fs.existsSync(galleryDir) && fs.readdirSync(galleryDir).length > 0) {
	console.error(`Error: public/gallery/${id}/ 里已经有东西了，换个 id 或者先手动清掉`);
	process.exit(1);
}
fs.mkdirSync(galleryDir, { recursive: true });
let totalBytes = 0;
for (const img of images) {
	const src = path.join(imgDir, img);
	fs.copyFileSync(src, path.join(galleryDir, img));
	totalBytes += fs.statSync(src).size;
	console.log(`  [图片] ${img}`);
}

// ---------- 3. 写 galleryConfig.ts ----------
const today = new Date();
const dateStr =
	dateArg ??
	`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

let cfg = fs.readFileSync(configPath, "utf-8");

// 防重名
if (cfg.includes(`id: "${id}"`)) {
	console.error(`Error: 相册 id "${id}" 已存在于 galleryConfig.ts`);
	process.exit(1);
}

const entry = `\t\t{
\t\t\tid: "${id}",
\t\t\tname: "${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",
\t\t\tdescription: "",
\t\t\tlocation: "",
\t\t\tdate: "${dateStr}",
\t\t\ttags: [],
\t\t},
`;

const marker = "albums: [";
const idx = cfg.indexOf(marker);
if (idx === -1) {
	console.error("Error: 在 galleryConfig.ts 里没找到 albums: [");
	process.exit(1);
}
cfg =
	cfg.slice(0, idx + marker.length) +
	"\n" +
	entry.trimEnd() +
	cfg.slice(idx + marker.length);
fs.writeFileSync(configPath, cfg, "utf-8");

// ---------- 4. 打开相册页开关 ----------
let siteCfg = fs.readFileSync(siteConfigPath, "utf-8");
if (/gallery:\s*true/.test(siteCfg)) {
	console.log("  [开关] 相册页已经是开启状态");
} else if (/gallery:\s*false/.test(siteCfg)) {
	siteCfg = siteCfg.replace(/gallery:\s*false/, "gallery: true");
	fs.writeFileSync(siteConfigPath, siteCfg, "utf-8");
	console.log("  [开关] siteConfig.ts 里 pages.gallery 已改为 true");
} else {
	console.log("  [提示] siteConfig.ts 里没找到 gallery 开关，请手动确认");
}

// ---------- 5. 导航栏加上「相册」入口 ----------
if (fs.existsSync(navBarConfigPath)) {
	let navCfg = fs.readFileSync(navBarConfigPath, "utf-8");
	if (navCfg.includes("LinkPresets.Gallery")) {
		console.log("  [导航] 导航栏里已经有「相册」入口");
	} else if (navCfg.includes("LinkPresets.Booknav,")) {
		navCfg = navCfg.replace(
			"LinkPresets.Booknav,",
			"LinkPresets.Booknav,\n\n\t\t\t// 相册\n\t\t\tLinkPresets.Gallery,",
		);
		fs.writeFileSync(navBarConfigPath, navCfg, "utf-8");
		console.log("  [导航] 「相册」已加进导航栏「我的」子菜单");
	} else {
		console.log(
			"  [提示] navBarConfig.ts 里没找到 LinkPresets.Booknav，请手动加 LinkPresets.Gallery",
		);
	}
}

// ---------- 收尾 ----------
const sizeMB = (totalBytes / 1024 / 1024).toFixed(2);
console.log(`\n相册「${name}」(${id}) 创建成功`);
console.log(`  图片目录: public/gallery/${id}/  (${images.length} 张，${sizeMB} MB)`);
console.log(`  相册日期: ${dateStr}`);
console.log(`  配置已写入: src/config/galleryConfig.ts`);
if (sizeMB > 20) {
	console.log(
		`\n  ⚠ 图片一共 ${sizeMB} MB，GitHub 单仓建议控制在 1GB 内、单文件 100MB 内，`,
	);
	console.log(`     太多的话考虑先压一下再传。`);
}
console.log(`\n下一步（本地预览 / 推送上线）:`);
console.log(`  pnpm dev`);
console.log(`  git add -A && git commit -m "album: ${name}" && git push`);
