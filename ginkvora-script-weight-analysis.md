# ginkvora.com 首屏脚本 1.6MB 来源定位报告

> 检测时间：2026-08-12
> 检测方式：直接抓取线上 HTML 与脚本资源实测（curl 直连 Cloudflare 后方），全程只读，未修改任何代码/配置
> 关联报告：见同目录 `ginkvora-performance-report.html`（全站性能检测）

---

## 一、结论摘要

1. **1.6MB 不是单一脚本**，而是页面首屏脚本**总载荷**（约 1.35MB 核心脚本 + 零散项累计）。
2. **与 Cloudflare Zaraz 无关**：页面 HTML 中无任何 `zaraz` / `__zaraz` 标记，Zaraz 处于非活动状态后不会再注入脚本。
3. **最大元凶：GTM 容器 `GTM-PSMZBB3H` 被加载两次，合计约 940KB，占总量约 60%**。
4. **Cloudflare Web Analytics 确实处于开启状态**（`beacon.min.js` 注入每个页面），但实测仅 **31KB**，不是 1.6MB 的来源。
5. 未发现 Rocket Loader（无 `cf-rocket-loader` 标记）；Cloudflare Email Obfuscation 注入的 `email-decode.min.js` 出现 **2 次**（重复注入，体量很小）。

---

## 二、首屏脚本载荷构成

| 来源 | 大小 | 数据口径 | 说明 |
|---|---|---|---|
| GTM 容器 `/hry7/`（首屏立即加载） | **471KB** | 实测 | Cloudflare 首方 GTM 代理，head 内联加载器，返回完整容器 JS |
| GTM 容器官方 `gtm.js`（延迟加载） | ~470KB | 实测容器/推断 | `requestIdleCallback` 后 1.5s 或首次交互触发，同一容器再拉一遍 |
| GA4 `gtag.js` | ~150KB | 估算 | GTM 容器内 tag 运行时拉取 |
| reCAPTCHA | ~150KB | 估算 | 仅联系页/产品页表单出现，非全站 |
| Cloudflare Web Analytics `beacon.min.js` | 31KB | 实测 | `static.cloudflareinsights.com`，CF 自动注入 |
| Clarity | ~30KB | 估算 | `www.clarity.ms` |
| Chatwoot SDK | 29KB | 实测 | `chat.ginkvora.com`，async 加载，正常 |
| 内联脚本（20 个块） | 21KB | 实测 | Astro 页面内联 JS |
| `email-decode.min.js` | ~2KB | 实测 | CF Email Obfuscation 注入，**出现 2 次** |

> 核心问题项（红色）：GTM 容器两次加载合计 ~940KB。

---

## 三、GTM 双份加载证据链

### 3.1 页面中存在两套独立加载器（同一容器 GTM-PSMZBB3H）

**① 首屏立即加载 Cloudflare 首方代理（head 内联，335B）：**

```js
(function(w,d,s,l){w[l]=w[l]||[];(function(){w[l].push(arguments);})('set', 'developer_id.dYzg1YT', true);
    w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s);j.async=true;j.src='/hry7/';
    f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer');
```

**② 空闲/交互后加载官方 gtm.js（页面底部延迟加载器，1,762B）：**

```js
(function(){const gtmId = "GTM-PSMZBB3H";
    function loadGTM() {
        // ...
        j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);
        // ...
    }
    // requestIdleCallback 后 1500ms，或 click/mousedown/scroll 等首次交互立即触发
})();
```

### 3.2 实测数据

- `https://ginkvora.com/hry7/` → 返回 **471,549 字节**完整 GTM 容器 JS（curl `--compressed` 解压后实测）。
- 页面另有 `google_tags_first_party` dataLayer 初始化（128B），这是 Cloudflare 首方 GTM 方案的标准入口标记。
- 两个加载器**无互斥**：`gtmLoaded` 防重标记仅存在于②内部，管不到①。→ 每页白下载 ~470KB，且 **GA4 事件可能翻倍上报**。

### 3.3 GTM 容器内部引用（471KB 容器里有什么）

| 引用 | 次数 |
|---|---|
| `gtag` 相关 | 47 |
| `doubleclick`（广告） | 8 |
| `youtube`（视频跟踪） | 8 |
| `clarity` | 7 |
| `googletagmanager` | 6 |
| 外部 .js 链接 | `cct.google/taggy/agent.js` 等 |

---

## 四、如何自行验证（Chrome DevTools）

1. 打开 `https://ginkvora.com` → F12 → **Network** 标签 → 刷新。
2. 按 **Size** 列排序（显示为"传输大小 / 解压后大小"两行）。
3. 找到 ~470KB（解压后）的请求：
   - URL 为 `ginkvora.com/hry7/` → Cloudflare 首方 GTM 代理；
   - URL 为 `googletagmanager.com/gtm.js?id=GTM-PSMZBB3H` → 官方直连。
4. 两个请求并存即坐实双份加载。

---

## 五、修复建议（按优先级）

| 优先级 | 问题 | 建议 | 预期收益 |
|---|---|---|---|
| **P0** | GTM 容器加载两次 | 保留一套加载器（二选一）：保留 `/hry7/` 首方代理则删除延迟加载器，或反之。注意 GA4 事件目前可能双份上报 | 每页省 ~470KB，数据翻倍问题同步解决 |
| P2 | Cloudflare Web Analytics 开启 | 若未使用，在 Cloudflare 后台 Analytics 设置关闭 | 每页省 31KB + 一次跨域请求 |
| P2 | `email-decode.min.js` 注入两次 | 排查重复注入来源（源码手动添加 + CF 自动注入重叠？） | 消除冗余请求 |
| P3 | reCAPTCHA `render=undefined` | 修复 site key 变量注入问题（详见性能报告） | 表单页省 ~150KB 脚本与无效加载 |

> ⚠️ 以上均为建议，**尚未修改任何代码/配置**。确认动手后先出 diff 再落盘。

---

## 六、数据可信度说明

| 数据 | 口径 |
|---|---|
| GTM 容器 471KB、CF beacon 31KB、Chatwoot 29KB、内联 JS 21KB、email-decode 双份 | **实测**（下载后 `wc -c`） |
| 第二次 GTM 加载 ~470KB | 同容器推断（可靠） |
| GA4 ~150KB、recaptcha ~150KB、Clarity ~30KB | **估算**（第三方运行时加载，未逐一实测） |

总计约 1.35MB 已测/推断核心脚本，叠加运行时 tag 与零散项后即构成页面呈现的 ~1.6MB 脚本总量。
