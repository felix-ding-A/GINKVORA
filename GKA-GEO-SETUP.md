# GINKVORA GEO Citability 闸门 — 接入说明

## 你的站点实况

| 项 | 值 |
|---|---|
| 域名 | ginkvora.com |
| 框架 | Astro 6 SSR (`output: 'server'` + Vercel adapter) |
| 语言 | en (默认) / ru / ar / es |
| 内容源 | Sanity CMS |
| 已有 GEO 资产 | llms.txt (手动维护)、robots.txt (已放行 GPTBot/ClaudeBot/PerplexityBot)、JSON-LD (11 种类型)、i18n sitemap、IndexNow |
| 英文内容页 | 111 个 (41 insights + 70 products) |

**关键**：因为是 SSR 模式，`astro build` 不产出静态 `dist/*.html`。workflow 改为**抓取线上渲染页**（AI 爬虫看到的也是这个），再跑 citability 审计。

## 接入步骤（3 步）

### 1. 把 geo-check 工具放进 GKA 仓库

```bash
# 在 GKA 仓库根目录
mkdir -p tools/geo-check/assets/schema

# 从 Git Auto SEO 项目拷贝
cp "E:/WorkBuddyData/Git Auto SEO/tools/geo-check/geo_check.py"   tools/geo-check/
cp "E:/WorkBuddyData/Git Auto SEO/tools/geo-check/requirements.txt" tools/geo-check/
cp -r "E:/WorkBuddyData/Git Auto SEO/tools/geo-check/assets/schema/"* tools/geo-check/assets/schema/

git add tools/geo-check/
git commit -m "add geo-check citability audit tool"
```

工具是纯 Python（bs4+lxml+playwright），不改你的 Astro 代码、不碰 Sanity schema。

### 2. 放入 workflow 文件

```bash
# 把 GKA-geo-check-workflow.yml 放到 GKA 仓库的 .github/workflows/
cp "E:/WorkBuddyData/Git Auto SEO/GKA-geo-check-workflow.yml" \
   .github/workflows/geo-check.yml

git add .github/workflows/geo-check.yml
git commit -m "add GEO citability audit workflow"
git push
```

### 3. 确认权限（无需额外 Secret）

workflow 只用 `GITHUB_TOKEN`（自动提供），需要 `issues: write` 权限开 issue——已在 YAML 里声明。**不需要任何额外 Secret。**

## workflow 做什么

```
sitemap-0.xml → 筛选英文内容页 (111个)
    ↓ 4 并发 Playwright 抓取 (raw 模式, Astro SSR 直出 HTML)
rendered/*.html
    ↓ geo_check.py audit --min-score 50 --min-optimal 1
通过 → exit 0, 关闭已有失败 issue
未通过 → exit 1, 开/更新 issue 列出每页分数, 上传 artifact
```

- **触发**：每天北京时间 14:00 自动跑 + 手动 dispatch
- **手动参数**：语言(en/ru/ar/es/all)、页面类型(insights/products/all)、阈值分数、最多页数
- **耗时**：~2-3 分钟 (111 页 × 4 并发)
- **失败不阻塞部署**：只开 issue 通知，不卡 Vercel

## 实测结果（ginkvora.com 真实文章）

```
文章: /insights/ghk-cu-benefits-science-guide
抓取: HTTP 200, raw 模式 (Astro SSR 直出), is_spa=False
JSON-LD: Answer, BlogPosting, BreadcrumbList, ContactPoint,
         FAQPage, ImageObject, ListItem, Organization,
         Person, Question, WebPage  (11 种 — 结构化数据覆盖极好)
Citability: 51.3 分 | 3 个最优段落 (134-167词) | 18 块
评级: A=0 B=4 C=7 D=5 F=2
```

站点 GEO 基础已经很好（JSON-LD 全覆盖、robots.txt 已放行 AI 爬虫、llms.txt 已有）。
citability 的提升空间在于：把 C/D/F 级段落改写成 134-167 词的自包含定义/结论段落。

## 阈值建议

| 参数 | 推荐值 | 含义 |
|---|---|---|
| `--min-score 50` | 每页平均分不低于 50 | 拦下内容稀薄页 |
| `--min-optimal 1` | 每页至少 1 个最优长度段落 | 确保每篇有可被 AI 引用的自包含块 |

先从 `50/1` 开始，跑一周看基线分布，再根据数据调高。
insights 文章通常比 products 页更容易达标（products 页内容偏规格表）。

## 跟现有 SEO 流程的关系

- 你已有 `ginkvora-daily-seo-audit` skill（查 Sanity CMS 审 meta 字段）→ 管 **元数据完整性**
- 你已有 `submit-indexnow.js` → 管 **索引推送**
- 本 workflow → 管 **AI 可引用性 (GEO citability)**

三者互补，不冲突。
