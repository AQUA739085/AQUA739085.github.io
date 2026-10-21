# -*- coding: utf-8 -*-
"""把 D:\\Blog (hexo) 的 _posts 文章迁移到 Firefly (Astro) 的 src/content/posts"""
import os
import re
import shutil

SRC = r"D:\Blog\source\_posts"
DST = r"D:\FireflyBlog\src\content\posts"
BACKUP = r"D:\FireflyBlog\_sample-posts-backup"


def parse_frontmatter(text):
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, text
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return {}, text
    meta, cur = {}, None
    for ln in lines[1:end]:
        s = ln.strip()
        if not s:
            continue
        m = re.match(r"^([A-Za-z_][\w-]*)\s*:\s*(.*)$", ln)
        if m:
            cur, val = m.group(1), m.group(2).strip()
            meta[cur] = [] if val == "" else val
        elif s.startswith("- ") and cur:
            if not isinstance(meta.get(cur), list):
                meta[cur] = []
            meta[cur].append(s[2:].strip())
    return meta, "\n".join(lines[end + 1:])


def to_list(v):
    if v is None:
        return []
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()]
    s = str(v).strip()
    if s.startswith("[") and s.endswith("]"):
        return [x.strip().strip("'\"") for x in s[1:-1].split(",") if x.strip()]
    return [s] if s else []


def q(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


def make_description(body):
    for ln in body.split("\n"):
        s = ln.strip()
        if not s or s.startswith("#") or s.startswith("http") or s.startswith("```"):
            continue
        s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
        s = re.sub(r"[*`>]", "", s).strip()
        if len(s) < 4:
            continue
        return s[:70]
    return ""


def norm_date(v):
    s = str(v).strip()
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    return "%s-%s-%s" % m.groups() if m else "2026-01-01"


def main():
    # 1. 备份主题自带示例文章
    if not os.path.exists(BACKUP):
        os.makedirs(BACKUP)
    for name in os.listdir(DST):
        src_p = os.path.join(DST, name)
        dst_p = os.path.join(BACKUP, name)
        if os.path.exists(dst_p):
            continue
        shutil.move(src_p, dst_p)
        print("[备份示例] %s -> _sample-posts-backup/" % name)

    # 2. 迁移 hexo 文章
    os.makedirs(DST, exist_ok=True)
    files = [f for f in os.listdir(SRC) if f.lower().endswith((".md", ".mdx"))]
    print("\n共 %d 篇文章待迁移\n" % len(files))
    for fn in sorted(files):
        raw = open(os.path.join(SRC, fn), encoding="utf-8").read()
        meta, body = parse_frontmatter(raw)
        title = str(meta.get("title") or os.path.splitext(fn)[0]).strip()
        published = norm_date(meta.get("date", ""))
        tags = to_list(meta.get("tags"))
        cats = to_list(meta.get("categories"))
        category = cats[0] if cats else ""
        body = body.replace("<!-- more -->", "").strip()
        desc = make_description(body)

        fm = ["---", "title: " + q(title), "published: " + published]
        if tags:
            fm.append("tags: [" + ", ".join(q(t) for t in tags) + "]")
        if category:
            fm.append("category: " + q(category))
        if desc:
            fm.append("description: " + q(desc))
        fm.append("---")

        out = "\n".join(fm) + "\n\n" + body + "\n"
        slug = os.path.splitext(fn)[0].replace(" ", "-")
        with open(os.path.join(DST, slug + ".md"), "w", encoding="utf-8") as f:
            f.write(out)
        print("[迁移] %-42s %s  tags=%s  category=%s"
              % (fn, published, tags, category or "-"))

    print("\n完成：示例文章已备份到 _sample-posts-backup，新文章在 src/content/posts")


if __name__ == "__main__":
    main()
