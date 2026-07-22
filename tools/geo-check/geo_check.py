#!/usr/bin/env python3
"""
geo_check.py — 发布前 GEO 检查工具 (Pre-publish GEO gate)

改造自 zubair-trabzada/geo-seo-claude (MIT) 的两个脚本：
  - scripts/citability_scorer.py  -> 本地文件的 citability 评分
  - scripts/llmstxt_generator.py  -> 本地站点生成 llms.txt / llms-full.txt

原版只能抓线上 URL；本工具改为直接吃「本地文件」：
  - Astro 构建产物 (dist/ 下的 *.html)
  - Markdown 内容源 (*.md / *.mdx，读 frontmatter)
因此无需联网即可在 CI / pre-commit 里跑。

子命令:
  geo_check.py citability <path|url> [--json]        # 评本地文件/目录 或 线上URL
  geo_check.py llms <site_dir> --site-url URL [--out DIR]
  geo_check.py audit <path> [--min-score N] [--min-optimal M] [--json]
                                                     # CI 闸门：不达标 exit 1
  geo_check.py fetch <url> [--mode auto|always|never] [--out DIR]
                                                     # 抓取+渲染线上页(SPA感知),
                                                     # 存 HTML 后可喂给 citability

渲染能力(子命令 fetch / citability 传 URL 时启用)改造自
AgriciDaniel/claude-seo 的 render_page.py (MIT): Playwright 无头渲染,
自动检测 SPA 水合壳(React/Next/Vue/Nuxt/Svelte/Astro islands)并等 DOM 稳定,
解决纯 SPA / Astro 岛屿站点抓不到内容的问题。

依赖: beautifulsoup4, lxml   (pip install -r requirements.txt)
渲染(可选): playwright        (pip install playwright && playwright install chromium)
"""

import sys
import os
import re
import json
import time
import argparse
from typing import Optional

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.stderr.write("ERROR: 需要 beautifulsoup4+lxml。先跑: pip install -r requirements.txt\n")
    sys.exit(2)

# Playwright 是可选依赖(仅 fetch 子命令 / citability 传 URL 时需要), 懒加载。
try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout  # type: ignore[import-not-found,import-untyped]
except ImportError:  # pragma: no cover
    sync_playwright = None
    PlaywrightTimeout = Exception  # type: ignore[assignment,misc]


# ----------------------------------------------------------------------------
# 1) Citability 评分核心逻辑 (来自 geo-seo-claude/citability_scorer.py, MIT)
#    纯函数，无网络依赖。最优被引段落: 134-167 词、自包含、事实密集。
# ----------------------------------------------------------------------------
def score_passage(text: str, heading: Optional[str] = None) -> dict:
    """Score a single passage for AI citability (0-100)."""
    words = text.split()
    word_count = len(words)

    scores = {
        "answer_block_quality": 0,
        "self_containment": 0,
        "structural_readability": 0,
        "statistical_density": 0,
        "uniqueness_signals": 0,
    }

    # === 1. Answer Block Quality (30%) ===
    abq_score = 0
    definition_patterns = [
        r"\b\w+\s+is\s+(?:a|an|the)\s",
        r"\b\w+\s+refers?\s+to\s",
        r"\b\w+\s+means?\s",
        r"\b\w+\s+(?:can be |are )?defined\s+as\s",
        r"\bin\s+(?:simple|other)\s+(?:terms|words)\s*,",
    ]
    for pattern in definition_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            abq_score += 15
            break

    first_60_words = " ".join(words[:60])
    if any(
        re.search(p, first_60_words, re.IGNORECASE)
        for p in [
            r"\b(?:is|are|was|were|means?|refers?)\b",
            r"\d+%",
            r"\$[\d,]+",
            r"\d+\s+(?:million|billion|thousand)",
        ]
    ):
        abq_score += 15

    if heading and heading.endswith("?"):
        abq_score += 10

    sentences = re.split(r"[.!?]+", text)
    short_clear_sentences = sum(1 for s in sentences if 5 <= len(s.split()) <= 25)
    if sentences:
        clarity_ratio = short_clear_sentences / len(sentences)
        abq_score += int(clarity_ratio * 10)

    if re.search(
        r"(?:according to|research shows|studies? (?:show|indicate|suggest|found)|data (?:shows|indicates|suggests))",
        text, re.IGNORECASE,
    ):
        abq_score += 10
    scores["answer_block_quality"] = min(abq_score, 30)

    # === 2. Self-Containment (25%) ===
    sc_score = 0
    if 134 <= word_count <= 167:
        sc_score += 10
    elif 100 <= word_count <= 200:
        sc_score += 7
    elif 80 <= word_count <= 250:
        sc_score += 4
    elif word_count < 30 or word_count > 400:
        sc_score += 0
    else:
        sc_score += 2

    pronoun_count = len(
        re.findall(r"\b(?:it|they|them|their|this|that|these|those|he|she|his|her)\b", text, re.IGNORECASE)
    )
    if word_count > 0:
        pronoun_ratio = pronoun_count / word_count
        if pronoun_ratio < 0.02:
            sc_score += 8
        elif pronoun_ratio < 0.04:
            sc_score += 5
        elif pronoun_ratio < 0.06:
            sc_score += 3

    proper_nouns = len(re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text))
    if proper_nouns >= 3:
        sc_score += 7
    elif proper_nouns >= 1:
        sc_score += 4
    scores["self_containment"] = min(sc_score, 25)

    # === 3. Structural Readability (20%) ===
    sr_score = 0
    if sentences:
        avg_sentence_length = word_count / len(sentences)
        if 10 <= avg_sentence_length <= 20:
            sr_score += 8
        elif 8 <= avg_sentence_length <= 25:
            sr_score += 5
        else:
            sr_score += 2
    if re.search(r"(?:first|second|third|finally|additionally|moreover|furthermore)", text, re.IGNORECASE):
        sr_score += 4
    if re.search(r"(?:\d+[\.\)]\s|\b(?:step|tip|point)\s+\d+)", text, re.IGNORECASE):
        sr_score += 4
    if "\n" in text:
        sr_score += 4
    scores["structural_readability"] = min(sr_score, 20)

    # === 4. Statistical Density (15%) ===
    sd_score = 0
    pct_count = len(re.findall(r"\d+(?:\.\d+)?%", text))
    sd_score += min(pct_count * 3, 6)
    dollar_count = len(re.findall(r"\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|M|B|K))?", text))
    sd_score += min(dollar_count * 3, 5)
    number_count = len(re.findall(
        r"\b\d+(?:,\d{3})*(?:\.\d+)?\s+(?:users|customers|pages|sites|companies|businesses|people|percent|times|x\b)",
        text, re.IGNORECASE))
    sd_score += min(number_count * 2, 4)
    if re.findall(r"\b20(?:2[3-6]|1\d)\b", text):
        sd_score += 2
    source_patterns = [
        r"(?:according to|per|from|by)\s+[A-Z]",
        r"(?:Gartner|Forrester|McKinsey|Harvard|Stanford|MIT|Google|Microsoft|OpenAI|Anthropic)",
        r"\([A-Z][a-z]+(?:\s+\d{4})?\)",
    ]
    for pattern in source_patterns:
        if re.search(pattern, text):
            sd_score += 2
    scores["statistical_density"] = min(sd_score, 15)

    # === 5. Uniqueness Signals (10%) ===
    us_score = 0
    if re.search(r"(?:our (?:research|study|data|analysis|survey|findings)|we (?:found|discovered|analyzed|surveyed|measured))", text, re.IGNORECASE):
        us_score += 5
    if re.search(r"(?:case study|for example|for instance|in practice|real-world|hands-on)", text, re.IGNORECASE):
        us_score += 3
    if re.search(r"(?:using|with|via|through)\s+[A-Z][a-z]+", text):
        us_score += 2
    scores["uniqueness_signals"] = min(us_score, 10)

    total = sum(scores.values())
    if total >= 80:
        grade = "A"; label = "Highly Citable"
    elif total >= 65:
        grade = "B"; label = "Good Citability"
    elif total >= 50:
        grade = "C"; label = "Moderate Citability"
    elif total >= 35:
        grade = "D"; label = "Low Citability"
    else:
        grade = "F"; label = "Poor Citability"

    return {
        "heading": heading,
        "word_count": word_count,
        "total_score": total,
        "grade": grade,
        "label": label,
        "breakdown": scores,
        "preview": " ".join(words[:30]) + ("..." if word_count > 30 else ""),
    }


# ----------------------------------------------------------------------------
# 2) 本地内容块抽取
# ----------------------------------------------------------------------------
def extract_blocks_from_html(html_text: str):
    soup = BeautifulSoup(html_text, "lxml")
    for el in soup.find_all(["script", "style", "nav", "footer", "header", "aside", "form"]):
        el.decompose()
    blocks = []
    current_heading = "Introduction"
    current_paragraphs = []
    for element in soup.find_all(["h1", "h2", "h3", "h4", "p", "ul", "ol", "table"]):
        if element.name.startswith("h"):
            if current_paragraphs:
                combined = " ".join(current_paragraphs)
                if len(combined.split()) >= 20:
                    blocks.append({"heading": current_heading, "content": combined})
            current_heading = element.get_text(strip=True)
            current_paragraphs = []
        else:
            text = element.get_text(strip=True)
            if text and len(text.split()) >= 5:
                current_paragraphs.append(text)
    if current_paragraphs:
        combined = " ".join(current_paragraphs)
        if len(combined.split()) >= 20:
            blocks.append({"heading": current_heading, "content": combined})
    return blocks


def _read_frontmatter(md_text: str):
    """返回 (meta_dict, body)。支持 --- 包裹的 YAML 简易 frontmatter。"""
    meta = {}
    body = md_text
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?", md_text, re.DOTALL)
    if m:
        fm = m.group(1)
        body = md_text[m.end():]
        for line in fm.splitlines():
            kv = re.match(r"^([A-Za-z0-9_\-]+):\s*(.*)$", line)
            if kv:
                val = kv.group(2).strip().strip('"').strip("'")
                meta[kv.group(1).lower()] = val
    return meta, body


def extract_blocks_from_markdown(md_text: str):
    _, body = _read_frontmatter(md_text)
    # 去掉代码块
    body = re.sub(r"```.*?```", "", body, flags=re.DOTALL)
    blocks = []
    current_heading = "Introduction"
    buf = []
    for raw in body.splitlines():
        line = raw.strip()
        if line.startswith("#"):
            if buf:
                combined = " ".join(buf)
                if len(combined.split()) >= 20:
                    blocks.append({"heading": current_heading, "content": combined})
                buf = []
            current_heading = re.sub(r"^#+\s*", "", line).strip()
        elif line == "":
            if buf:
                combined = " ".join(buf)
                if len(combined.split()) >= 20:
                    blocks.append({"heading": current_heading, "content": combined})
                buf = []
        else:
            buf.append(re.sub(r"[*_`>#-]", "", line))
    if buf:
        combined = " ".join(buf)
        if len(combined.split()) >= 20:
            blocks.append({"heading": current_heading, "content": combined})
    return blocks


def score_file(path: str) -> Optional[dict]:
    if not os.path.isfile(path):
        return None
    ext = os.path.splitext(path)[1].lower()
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    except Exception as e:
        sys.stderr.write(f"  ! 无法读取 {path}: {e}\n")
        return None

    if ext in (".html", ".htm"):
        blocks = extract_blocks_from_html(text)
    elif ext in (".md", ".mdx", ".markdown"):
        blocks = extract_blocks_from_markdown(text)
    else:
        return None

    if not blocks:
        return {"file": path, "total_blocks_analyzed": 0, "average_citability_score": 0.0,
                "optimal_length_passages": 0, "grade_distribution": {}, "top_5_citable": [], "bottom_5_citable": []}

    scored = [score_passage(b["content"], b["heading"]) for b in blocks]
    avg = sum(b["total_score"] for b in scored) / len(scored)
    optimal = sum(1 for b in scored if 134 <= b["word_count"] <= 167)
    grade_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    for b in scored:
        grade_dist[b["grade"]] += 1
    return {
        "file": path,
        "total_blocks_analyzed": len(scored),
        "average_citability_score": round(avg, 1),
        "optimal_length_passages": optimal,
        "grade_distribution": grade_dist,
        "top_5_citable": sorted(scored, key=lambda x: x["total_score"], reverse=True)[:5],
        "bottom_5_citable": sorted(scored, key=lambda x: x["total_score"])[:5],
    }


# ----------------------------------------------------------------------------
# 3) SPA 感知渲染 (改造自 AgriciDaniel/claude-seo/render_page.py, MIT)
#    去掉 url_safety 重模块依赖, 内置轻量私网拦截; 保留核心:
#    水合壳检测 -> DOM 稳定等待 -> Playwright 渲染 -> JSON-LD 提取。
# ----------------------------------------------------------------------------
_SPA_SHELL_PATTERNS = (
    '<div id="root"></div>',
    '<div id="__next">',
    '<div id="app"></div>',
    '<div id="__nuxt">',
    'data-svelte-h=',
    '<astro-island ',
    'you need to enable javascript',
    'please enable javascript',
)

_VIEWPORTS = {
    "desktop": {"width": 1920, "height": 1080, "device_scale": 1},
    "mobile": {"width": 375, "height": 812, "device_scale": 2},
}

_RENDER_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/150.0.7871.115 Safari/537.36 GeoCheck/1.0"
)

_TAG_STRIP = re.compile(r"<[^>]+>")
_WHITESPACE = re.compile(r"\s+")
_NON_VISIBLE_STRIP = re.compile(
    r"<(script|style|template|noscript)\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL
)


def _is_spa(raw_html: Optional[str]) -> bool:
    """保守的 SPA 水合壳检测。任一信号命中即为 True。"""
    if not raw_html:
        return True
    lc = raw_html.lower()
    if any(p in lc for p in _SPA_SHELL_PATTERNS):
        return True
    body_start = lc.find("<body")
    body_end = lc.rfind("</body>")
    if body_start != -1 and body_end > body_start:
        body = _NON_VISIBLE_STRIP.sub(" ", lc[body_start:body_end])
        visible = _WHITESPACE.sub(" ", _TAG_STRIP.sub(" ", body)).strip()
        if len(visible) < 100:
            return True
    return False


def _wait_for_dom_stability(page, timeout_ms: int) -> bool:
    """最多等 5s, 直到正文文本与节点数连续两次不变。"""
    budget_ms = max(250, min(timeout_ms, 5000))
    previous = None
    stable = 0
    elapsed = 0
    while elapsed < budget_ms:
        try:
            sig = tuple(page.evaluate(
                "() => ["
                "(document.body && document.body.innerText || '').trim().length,"
                "document.querySelectorAll('*').length"
                "]"
            ))
        except Exception:
            return False
        if sig == previous and sig[0] >= 100:
            stable += 1
            if stable >= 2:
                return True
        else:
            stable = 0
        previous = sig
        page.wait_for_timeout(250)
        elapsed += 250
    return False


def _private_ip_route_handler(blocked: set):
    """轻量 SSRF 防护: 拦截解析到私网/环回地址的子资源请求。"""
    import ipaddress
    from urllib.parse import urlparse

    def handler(route, request):  # type: ignore[no-untyped-def]
        rtype = request.resource_type
        if rtype in blocked:
            route.abort()
            return
        host = urlparse(request.url).hostname or ""
        try:
            if host:
                ip = ipaddress.ip_address(host)
                if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                    route.abort()
                    return
        except ValueError:
            pass  # 域名, 无法静态判断, 放行交给 Chromium resolver
        route.continue_()
    return handler


def render_url(
    url: str,
    *,
    mode: str = "auto",
    viewport: str = "desktop",
    timeout_ms: int = 15000,
    block_resources: Optional[list] = None,
) -> dict:
    """渲染或抓取 ``url``。mode: auto(检测到SPA才渲染)/always/never。"""
    result = {
        "url": url, "status_code": None, "content": None, "raw_content": None,
        "is_spa": None, "render_engine": None, "render_ms": None,
        "mode_used": None, "console_errors": [], "diagnostics": [], "error": None,
    }
    if mode not in ("auto", "always", "never"):
        result["error"] = f"无效 mode: {mode!r}"
        return result
    if viewport not in _VIEWPORTS:
        result["error"] = f"无效 viewport: {viewport!r}"
        return result

    # Step 1 — 原始抓取 (raw fetch, 用于 SPA 检测与基线)
    import urllib.request
    req = urllib.request.Request(url, headers={"User-Agent": _RENDER_UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result["raw_content"] = resp.read().decode("utf-8", errors="ignore")
            result["status_code"] = resp.status
            result["url"] = resp.url
    except Exception as exc:
        result["error"] = f"原始抓取失败: {exc}"
        return result

    result["is_spa"] = _is_spa(result["raw_content"])
    should_render = mode == "always" or (mode == "auto" and result["is_spa"])

    if not should_render:
        result["mode_used"] = "raw"
        result["content"] = result["raw_content"]
        return result

    result["mode_used"] = "rendered"
    if sync_playwright is None:
        result["error"] = ("渲染模式需要 playwright。安装: "
                           "pip install playwright && playwright install chromium")
        return result

    vp = _VIEWPORTS[viewport]
    blocked = set(block_resources or [])
    start = time.monotonic()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                device_scale_factor=vp["device_scale"],
                user_agent=_RENDER_UA,
            )
            page = context.new_page()
            page.on("console", lambda msg: result["console_errors"].append(msg.text) if msg.type == "error" else None)
            page.route("**/*", _private_ip_route_handler(blocked))
            try:
                response = page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            except PlaywrightTimeout:
                response = None
                result["diagnostics"].append(f"DOMContentLoaded 超时({timeout_ms}ms), 取已有 DOM")
            if not _wait_for_dom_stability(page, timeout_ms):
                result["diagnostics"].append("DOM 未达稳定阈值, 取已有 DOM")
            result["url"] = page.url
            result["content"] = page.content()
            result["status_code"] = response.status if response else result["status_code"]
            result["render_engine"] = "playwright-chromium"
            browser.close()
    except Exception as exc:
        result["error"] = f"playwright 错误: {exc}"
        return result
    finally:
        result["render_ms"] = (time.monotonic() - start) * 1000.0
    return result


def extract_json_ld(html_text: Optional[str]) -> list:
    """提取页面所有 JSON-LD 块的 @type 列表 (SEO/GEO 结构化数据体检)。"""
    if not html_text:
        return []
    soup = BeautifulSoup(html_text, "html.parser")
    out = []
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = (script.string if script.string is not None else script.get_text() or "").strip()
        if not raw:
            continue
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            out.append({"valid": False})
            continue
        types = set()
        stack = [parsed]
        while stack:
            v = stack.pop()
            if isinstance(v, dict):
                t = v.get("@type")
                if isinstance(t, str):
                    types.add(t)
                elif isinstance(t, list):
                    types.update(x for x in t if isinstance(x, str))
                stack.extend(v.values())
            elif isinstance(v, list):
                stack.extend(v)
        out.append({"valid": True, "types": sorted(types)})
    return out


# ----------------------------------------------------------------------------
# 4) llms.txt 本地生成 (改造自 llmstxt_generator.py, 不联网)
# ----------------------------------------------------------------------------
def _categorize(path_lower: str):
    if any(k in path_lower for k in ["/pricing", "/feature", "/product", "/solution", "/demo"]):
        return "Products & Services"
    if any(k in path_lower for k in ["/blog", "/article", "/resource", "/guide", "/learn", "/docs", "/documentation", "/post"]):
        return "Resources & Blog"
    if any(k in path_lower for k in ["/about", "/team", "/career", "/contact", "/press", "/partner"]):
        return "Company"
    if any(k in path_lower for k in ["/help", "/support", "/faq", "/status"]):
        return "Support"
    return "Main Pages"


def _clean_title(title_text: str) -> str:
    """去掉品牌后缀: 'Name — Tagline' / 'Name | Tagline' / 'Name - Tagline'。"""
    if not title_text:
        return ""
    return re.split(r"\s[|—–-]\s", title_text)[0].strip()


def _html_meta(html_text: str):
    soup = BeautifulSoup(html_text, "lxml")
    title = soup.find("title")
    site_name = _clean_title(title.get_text(strip=True)) if title else ""
    desc = soup.find("meta", attrs={"name": "description"})
    desc = desc.get("content", "").strip() if desc else ""
    h1 = soup.find("h1")
    h1 = h1.get_text(strip=True) if h1 else ""
    return site_name or h1, desc


def generate_llms_from_local(site_dir: str, site_url: str) -> dict:
    pages = {"Main Pages": [], "Products & Services": [], "Resources & Blog": [], "Company": [], "Support": []}
    site_name = ""
    site_desc = ""
    for root, _, files in os.walk(site_dir):
        for fn in files:
            ext = os.path.splitext(fn)[1].lower()
            if ext not in (".html", ".htm", ".md", ".mdx", ".markdown"):
                continue
            full = os.path.join(root, fn)
            try:
                with open(full, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            except Exception:
                continue
            rel = os.path.relpath(full, site_dir).replace(os.sep, "/")
            rel_url = rel[:-len(ext)] if ext != ".html" else rel
            if rel_url.endswith("index.html"):
                rel_url = rel_url[: -len("index.html")]
            abs_url = site_url.rstrip("/") + "/" + rel_url.lstrip("/")

            if ext in (".html", ".htm"):
                name, desc = _html_meta(text)
            else:
                meta, _ = _read_frontmatter(text)
                name = meta.get("title", "")
                desc = meta.get("description", "")
            if not name:
                name = rel_url or "/"
            pages[_categorize(rel.lower())].append({"url": abs_url, "title": name, "desc": desc})

    if not site_name:
        # 优先取首页/根路径作为站点名与描述
        home = None
        base = site_url.rstrip("/")
        for sec in pages.values():
            for it in sec:
                u = it["url"].rstrip("/")
                if u == base or u.endswith("index.html") or u.endswith("index.htm"):
                    home = it
                    break
            if home:
                break
        if home:
            site_name = home["title"] or site_name
            site_desc = home["desc"] or site_desc
    if not site_name:
        for sec in pages.values():
            if sec:
                site_name = sec[0]["title"]
                break
    site_name = site_name or site_url
    site_desc = site_desc or f"Official website of {site_name}"

    concise = [f"# {site_name}", f"> {site_desc}", ""]
    full = [f"# {site_name}", f"> {site_desc}", ""]
    for section, items in pages.items():
        if not items:
            continue
        concise.append(f"## {section}")
        full.append(f"## {section}")
        for it in items[:10]:
            concise.append(f"- [{it['title']}]({it['url']})")
            full.append(f"- [{it['title']}]({it['url']}): {it['desc']}" if it["desc"] else f"- [{it['title']}]({it['url']})")
        concise.append("")
        full.append("")
    concise += ["## Contact", f"- Website: {site_url}", ""]
    full += ["## Contact", f"- Website: {site_url}", ""]

    return {"llms_txt": "\n".join(concise), "llms_full_txt": "\n".join(full),
            "sections": {k: len(v) for k, v in pages.items()}}


# ----------------------------------------------------------------------------
# 5) CLI
# ----------------------------------------------------------------------------
def _is_url(s: str) -> bool:
    return s.startswith("http://") or s.startswith("https://")


def cmd_citability(args):
    results = []
    if _is_url(args.path):
        # 线上 URL: 先渲染再评分 (SPA 感知)
        if sync_playwright is None:
            sys.stderr.write("ERROR: 评线上 URL 需要 playwright。安装: pip install playwright && playwright install chromium\n")
            return 2
        res = render_url(args.path, mode=args.mode, viewport=args.viewport, timeout_ms=args.timeout_ms)
        if res["error"]:
            sys.stderr.write(f"ERROR: {res['error']}\n")
            return 1
        html = res["content"] or res["raw_content"] or ""
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as tf:
            tf.write(html)
            tmp_path = tf.name
        try:
            r = score_file(tmp_path)
            if r:
                r["file"] = args.path
                r["render"] = {"is_spa": res["is_spa"], "mode_used": res["mode_used"],
                               "render_ms": round(res["render_ms"], 0) if res["render_ms"] else None,
                               "structured_data": extract_json_ld(html)}
                results = [r]
        finally:
            os.unlink(tmp_path)
    elif os.path.isfile(args.path):
        r = score_file(args.path)
        if r:
            results = [r]
    else:
        for root, _, files in os.walk(args.path):
            for fn in files:
                ext = os.path.splitext(fn)[1].lower()
                if ext in (".html", ".htm", ".md", ".mdx", ".markdown"):
                    r = score_file(os.path.join(root, fn))
                    if r:
                        results.append(r)
    if args.json:
        print(json.dumps(results, indent=2, default=str))
    else:
        for r in results:
            print(f"\n📄 {r['file']}")
            print(f"   平均可引用性: {r['average_citability_score']}  |  最优长度段落(134-167词): {r['optimal_length_passages']}  |  块数: {r['total_blocks_analyzed']}")
            print(f"   评级分布: {r['grade_distribution']}")
            if "render" in r:
                rd = r["render"]
                print(f"   渲染: is_spa={rd['is_spa']} mode={rd['mode_used']} render_ms={rd['render_ms']}")
                types = [t for b in rd["structured_data"] if b.get("valid") for t in b.get("types", [])]
                if types:
                    print(f"   结构化数据(JSON-LD): {', '.join(sorted(set(types)))}")
                else:
                    print(f"   结构化数据(JSON-LD): 无 ⚠️")
    return 0


def cmd_llms(args):
    data = generate_llms_from_local(args.path, args.site_url)
    out_dir = args.out or args.path
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "llms.txt"), "w", encoding="utf-8") as f:
        f.write(data["llms_txt"])
    with open(os.path.join(out_dir, "llms-full.txt"), "w", encoding="utf-8") as f:
        f.write(data["llms_full_txt"])
    print(f"✅ 生成 llms.txt / llms-full.txt -> {out_dir}")
    print(f"   分区: {data['sections']}")
    return 0


def cmd_fetch(args):
    """抓取+渲染线上页(SPA感知), 存 HTML 到 --out 目录, 可后续喂给 citability/audit。"""
    if sync_playwright is None and args.mode != "never":
        sys.stderr.write("ERROR: 需要 playwright。安装: pip install playwright && playwright install chromium\n")
        return 2
    res = render_url(args.url, mode=args.mode, viewport=args.viewport,
                     timeout_ms=args.timeout_ms, block_resources=args.block or None)
    if res["error"]:
        sys.stderr.write(f"ERROR: {res['error']}\n")
        return 1
    html = res["content"] or res["raw_content"] or ""
    out_dir = args.out or "."
    os.makedirs(out_dir, exist_ok=True)
    # 文件名从 URL 推导, 默认 index.html
    from urllib.parse import urlparse
    path = urlparse(res["url"]).path.strip("/")
    fname = (path.split("/")[-1] if path else "") or "index.html"
    if not fname.endswith(".html"):
        fname = fname + ".html" if "." in fname else fname + "/index.html"
    out_path = os.path.join(out_dir, fname)
    os.makedirs(os.path.dirname(out_path), exist_ok=True) if os.path.dirname(fname) else None
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    if args.json:
        summary = {
            "url": res["url"], "status_code": res["status_code"], "is_spa": res["is_spa"],
            "mode_used": res["mode_used"], "render_ms": round(res["render_ms"], 0) if res["render_ms"] else None,
            "render_engine": res["render_engine"], "saved_to": out_path,
            "structured_data": extract_json_ld(html),
            "console_errors": res["console_errors"][:5], "diagnostics": res["diagnostics"],
        }
        print(json.dumps(summary, indent=2, default=str))
    else:
        print(f"✅ 已保存 -> {out_path}")
        print(f"   状态={res['status_code']}  is_spa={res['is_spa']}  mode={res['mode_used']}  render_ms={round(res['render_ms']) if res['render_ms'] else '-'}")
        types = [t for b in extract_json_ld(html) if b.get("valid") for t in b.get("types", [])]
        print(f"   结构化数据(JSON-LD): {', '.join(sorted(set(types))) if types else '无 ⚠️'}")
        if res["diagnostics"]:
            print(f"   诊断: {'; '.join(res['diagnostics'])}")
        if res["console_errors"]:
            print(f"   控制台错误({len(res['console_errors'])}): {res['console_errors'][0][:80]}")
        print(f"   下一步: python geo_check.py citability \"{out_path}\"")
    return 0


def cmd_audit(args):
    """CI 闸门: 低于阈值则 exit 1。"""
    results = []
    if os.path.isfile(args.path):
        r = score_file(args.path)
        if r:
            results = [r]
    else:
        for root, _, files in os.walk(args.path):
            for fn in files:
                ext = os.path.splitext(fn)[1].lower()
                if ext in (".html", ".htm", ".md", ".mdx", ".markdown"):
                    r = score_file(os.path.join(root, fn))
                    if r:
                        results.append(r)
    if not results:
        sys.stderr.write("未找到可分析的 HTML/Markdown 文件。\n")
        return 1

    failed = []
    for r in results:
        if r["average_citability_score"] < args.min_score or r["optimal_length_passages"] < args.min_optimal:
            failed.append(r)

    if args.json:
        print(json.dumps({"results": results, "failed": failed,
                          "pass": len(failed) == 0}, indent=2, default=str))
    else:
        for r in results:
            flag = "✅" if r not in failed else "❌"
            print(f"{flag} {r['file']}  均分={r['average_citability_score']}  最优段={r['optimal_length_passages']}")
        print(f"\n阈值: 均分≥{args.min_score}, 最优长度段≥{args.min_optimal}")
        print(f"通过 {len(results)-len(failed)}/{len(results)}")

    return 0 if not failed else 1


def main():
    p = argparse.ArgumentParser(description="发布前 GEO 检查工具 (citability + llms.txt)")
    sub = p.add_subparsers(dest="cmd", required=True)

    pc = sub.add_parser("citability", help="评本地文件/目录 或 线上URL 的 AI 可引用性")
    pc.add_argument("path", help="本地文件/目录路径, 或 http(s):// URL")
    pc.add_argument("--json", action="store_true")
    pc.add_argument("--mode", choices=("auto", "always", "never"), default="auto",
                    help="URL 渲染模式 (仅当 path 是 URL 时生效)")
    pc.add_argument("--viewport", choices=list(_VIEWPORTS), default="desktop")
    pc.add_argument("--timeout-ms", type=int, default=15000)
    pc.set_defaults(func=cmd_citability)

    pf = sub.add_parser("fetch", help="抓取+渲染线上页(SPA感知)存为本地HTML")
    pf.add_argument("url", help="http(s):// URL")
    pf.add_argument("--mode", choices=("auto", "always", "never"), default="auto",
                    help="auto:检测到SPA才渲染; always:总是渲染; never:仅原始HTML")
    pf.add_argument("--viewport", choices=list(_VIEWPORTS), default="desktop")
    pf.add_argument("--timeout-ms", type=int, default=15000)
    pf.add_argument("--block", action="append", default=[],
                    choices=("image", "media", "font", "stylesheet"), help="渲染时屏蔽的资源类型")
    pf.add_argument("--out", default=None, help="输出目录 (默认当前目录)")
    pf.add_argument("--json", action="store_true")
    pf.set_defaults(func=cmd_fetch)

    pl = sub.add_parser("llms", help="从本地站点生成 llms.txt")
    pl.add_argument("path", help="构建产物目录或内容目录")
    pl.add_argument("--site-url", required=True, help="站点正式 URL, 用于拼接绝对链接")
    pl.add_argument("--out", default=None, help="输出目录 (默认与 path 相同)")
    pl.set_defaults(func=cmd_llms)

    pa = sub.add_parser("audit", help="CI 闸门: 不达标 exit 1")
    pa.add_argument("path")
    pa.add_argument("--min-score", type=float, default=50.0, help="平均可引用性最低分 (默认50)")
    pa.add_argument("--min-optimal", type=int, default=1, help="至少要有几个 134-167 词最优段 (默认1)")
    pa.add_argument("--json", action="store_true")
    pa.set_defaults(func=cmd_audit)

    args = p.parse_args()
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
