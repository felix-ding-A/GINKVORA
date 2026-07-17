<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>GINKVORA - XML Sitemap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style type="text/css">
          /* ── Google Fonts Import ── */
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&amp;family=DM+Sans:wght@400;500;700&amp;family=JetBrains+Mono&amp;display=swap');

          /* ── Variables &amp; Theme ── */
          :root {
            --color-bg: #0b0c0d;
            --color-bg-deep: #060708;
            --color-surface: #16181a;
            --color-surface-2: #1e2124;
            --color-surface-glass: rgba(22, 24, 26, 0.75);
            --color-border: rgba(255, 255, 255, 0.08);
            --color-border-strong: rgba(255, 255, 255, 0.16);
            --color-primary: #d4a654;
            --color-primary-light: #f0c878;
            --color-primary-dark: #a07830;
            --color-primary-glow: rgba(212, 166, 84, 0.08);
            --color-accent: #e07830;
            --color-accent-light: #f09050;
            --color-accent-dark: #b05818;
            --color-text: #ffffff;
            --color-text-secondary: rgba(255, 255, 255, 0.7);
            --color-text-muted: rgba(255, 255, 255, 0.45);
            --font-display: 'Cormorant Garamond', 'Georgia', serif;
            --font-body: 'DM Sans', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            --z-nav: 100;
            --z-float: 10;
          }

          /* ── Base Reset &amp; Layout ── */
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: var(--font-body);
            background-color: var(--color-bg);
            color: var(--color-text);
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow-x: hidden;
          }

          /* Subtle background noise and glow */
          body::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(212, 166, 84, 0.04) 0%, transparent 80%);
            pointer-events: none;
            z-index: 0;
          }

          .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding-inline: 1.5rem;
          }

          /* ── Navbar Replicated ── */
          .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: var(--z-nav);
            padding: 0.75rem 0;
            background: rgba(6, 7, 8, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--color-border);
            transition: all 0.3s ease;
          }
          .navbar.scrolled {
            padding: 0.6rem 0;
          }
          .nav-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2rem;
          }
          .nav-logo {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            text-decoration: none;
            color: var(--color-text);
          }
          .logo-mark {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
          }
          .logo-text {
            font-family: var(--font-display);
            font-size: 1.375rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            background: linear-gradient(135deg, #f0c878, #d4a654);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .nav-links {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            list-style: none;
          }
          .nav-link {
            padding: 0.5rem 0.875rem;
            border-radius: 6px;
            font-size: 0.9375rem;
            font-weight: 400;
            color: var(--color-text-secondary);
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .nav-link:hover {
            color: var(--color-text);
            background: var(--color-surface);
          }
          .nav-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1.5rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            border: none;
            cursor: pointer;
            transition: all 0.25s ease;
            text-decoration: none;
            white-space: nowrap;
          }
          .btn--primary {
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
            color: #fff;
            box-shadow: 0 4px 15px rgba(224, 120, 48, 0.3);
          }
          .btn--primary:hover {
            background: linear-gradient(135deg, var(--color-accent-light) 0%, var(--color-accent) 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(224, 120, 48, 0.45);
          }

          /* Mobile Nav Toggle */
          .nav-toggle {
            display: none;
            flex-direction: column;
            gap: 5px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
          }
          .toggle-bar {
            display: block;
            width: 22px;
            height: 2px;
            background: var(--color-text);
            border-radius: 1px;
            transition: all 0.3s ease;
          }
          .nav-toggle.open .toggle-bar:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
          .nav-toggle.open .toggle-bar:nth-child(2) { opacity: 0; }
          .nav-toggle.open .toggle-bar:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

          /* Mobile Menu Panel */
          .mobile-menu {
            display: none;
            padding: 1rem 0 1.5rem;
            border-bottom: 1px solid var(--color-border);
            background: var(--color-bg-deep);
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            z-index: 90;
          }
          .mobile-menu.open {
            display: block;
          }
          .mobile-links {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            list-style: none;
          }
          .mobile-link {
            display: block;
            padding: 0.75rem 0.5rem;
            font-size: 1.125rem;
            color: var(--color-text-secondary);
            text-decoration: none;
            border-bottom: 1px solid var(--color-border);
          }

          /* ── Main content (offset by fixed header) ── */
          main {
            flex-grow: 1;
            margin-top: 6.5rem;
            margin-bottom: 4rem;
            position: relative;
            z-index: 1;
          }

          /* ── Header Card ── */
          .sitemap-header {
            background: var(--color-surface-glass);
            border: 1px solid var(--color-border);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 2.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          }
          .sitemap-header h1 {
            font-family: var(--font-display);
            font-size: 2.5rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary-dark) 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .description {
            color: var(--color-text-secondary);
            font-size: 1.05rem;
            max-width: 800px;
            margin-bottom: 1.5rem;
          }

          /* Info Grid */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
            border-top: 1px solid var(--color-border);
            padding-top: 1.5rem;
          }
          .info-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--color-border);
            padding: 1rem;
            border-radius: 8px;
          }
          .info-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-muted);
            margin-bottom: 0.25rem;
          }
          .info-val {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-primary-light);
          }

          /* ── Search Bar ── */
          .search-wrapper {
            position: relative;
            margin-bottom: 1.5rem;
          }
          .search-input {
            width: 100%;
            padding: 0.875rem 1rem 0.875rem 2.75rem;
            background: var(--color-bg-deep);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            color: var(--color-text);
            font-size: 1rem;
            transition: all 0.25s ease;
          }
          .search-input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px rgba(212, 166, 84, 0.15);
          }
          .search-icon {
            position: absolute;
            left: 0.875rem;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            stroke: var(--color-text-muted);
            fill: none;
            stroke-width: 2.5;
            pointer-events: none;
          }

          /* ── Table Styling ── */
          .table-wrapper {
            background: var(--color-surface-glass);
            border: 1px solid var(--color-border);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9375rem;
          }
          th {
            background: rgba(255, 255, 255, 0.02);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-muted);
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--color-border-strong);
            font-weight: 700;
          }
          td {
            padding: 1.125rem 1.5rem;
            border-bottom: 1px solid var(--color-border);
            vertical-align: middle;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr.url-row:hover td {
            background: rgba(212, 166, 84, 0.02);
          }

          /* Links */
          .url-link {
            color: var(--color-primary-light);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
            word-break: break-all;
          }
          .url-link:hover {
            color: #ffffff;
          }

          /* Alternates languages */
          .alternates {
            margin-top: 0.35rem;
            font-size: 0.75rem;
            color: var(--color-text-muted);
          }
          .alt-badge {
            display: inline-block;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--color-border);
            padding: 0.05rem 0.35rem;
            border-radius: 4px;
            margin-left: 0.4rem;
            color: var(--color-text-secondary);
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .alt-badge:hover {
            border-color: var(--color-primary);
            color: var(--color-primary-light);
            background: var(--color-primary-glow);
          }

          /* Badges */
          .priority-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
          }
          .priority-badge[data-priority="1.0"] {
            background: rgba(212, 166, 84, 0.15);
            color: var(--color-primary-light);
            border: 1px solid rgba(212, 166, 84, 0.35);
          }
          .priority-badge[data-priority="0.9"] {
            background: rgba(212, 166, 84, 0.08);
            color: var(--color-primary-light);
            border: 1px solid rgba(212, 166, 84, 0.2);
          }
          .priority-badge[data-priority="0.8"] {
            background: rgba(255, 255, 255, 0.04);
            color: rgba(255, 255, 255, 0.85);
            border: 1px solid var(--color-border);
          }
          .priority-badge[data-priority="0.7"] {
            background: rgba(255, 255, 255, 0.02);
            color: rgba(255, 255, 255, 0.7);
            border: 1px solid var(--color-border);
          }
          .priority-badge[data-priority="0.3"], .priority-badge[data-priority="0.5"] {
            background: transparent;
            color: var(--color-text-muted);
            border: 1px solid var(--color-border);
          }

          .freq-cell {
            text-transform: capitalize;
            color: var(--color-text-secondary);
          }

          .date-cell {
            font-family: var(--font-mono);
            font-size: 0.8125rem;
            color: var(--color-text-muted);
            white-space: nowrap;
          }

          /* ── Footer Replicated ── */
          .footer {
            background: var(--color-bg-deep);
            border-top: 1px solid var(--color-border);
            padding-block: 4rem 2rem;
            position: relative;
            z-index: 1;
          }
          .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1.2fr;
            gap: 3rem;
            margin-bottom: 3rem;
          }
          .footer-brand {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .footer-logo {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            text-decoration: none;
            color: var(--color-text);
          }
          .footer-logo-text {
            font-family: var(--font-display);
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            background: linear-gradient(135deg, #f0c878, #d4a654);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .footer-tagline {
            font-size: 0.9rem;
            line-height: 1.6;
            color: var(--color-text-muted);
          }
          .footer-certs {
            display: flex;
            flex-wrap: wrap;
            gap: 0.375rem;
          }
          .cert-badge {
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            border: 1px solid var(--color-border-strong);
            color: var(--color-text-muted);
            font-family: var(--font-mono);
          }
          .footer-col-title {
            font-size: 0.8125rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--color-text-muted);
            margin-bottom: 1.25rem;
          }
          .footer-links {
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
            list-style: none;
          }
          .footer-link {
            font-size: 0.9375rem;
            color: var(--color-text-secondary);
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .footer-link:hover {
            color: var(--color-primary-light);
          }
          .footer-contact {
            margin-top: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
          }
          .footer-contact-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--color-text-muted);
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .footer-contact-item:hover {
            color: var(--color-primary-light);
          }
          .footer-contact-item svg {
            stroke: currentColor;
            fill: none;
          }
          .footer-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 2rem;
            border-top: 1px solid var(--color-border);
          }
          .footer-copy {
            font-size: 0.875rem;
            color: var(--color-text-muted);
          }
          .footer-legal {
            display: flex;
            gap: 1.5rem;
          }
          .footer-legal-link {
            font-size: 0.875rem;
            color: var(--color-text-muted);
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .footer-legal-link:hover {
            color: var(--color-text-secondary);
          }

          /* Responsive Styles */
          @media (max-width: 900px) {
            .nav-links { display: none; }
            .nav-cta { display: none; }
            .nav-toggle { display: flex; }
            .footer-grid {
              grid-template-columns: 1fr 1fr;
              gap: 2.5rem;
            }
            .footer-brand {
              grid-column: 1 / -1;
            }
          }

          @media (max-width: 768px) {
            main {
              margin-top: 5rem;
            }
            .sitemap-header {
              padding: 1.5rem;
            }
            .sitemap-header h1 {
              font-size: 1.875rem;
            }
            .info-grid {
              grid-template-columns: 1fr 1fr;
            }
            th:nth-child(3), td:nth-child(3) {
              display: none; /* Hide frequency on small screen */
            }
            td {
              padding: 0.875rem 1rem;
            }
            th {
              padding: 0.875rem 1rem;
            }
          }

          @media (max-width: 640px) {
            .footer-grid {
              grid-template-columns: 1fr;
            }
            .footer-bottom {
              flex-direction: column;
              gap: 1rem;
              align-items: flex-start;
            }
          }
        </style>
      </head>
      <body>
        <!-- ── Navbar ── -->
        <header class="navbar" id="navbar">
          <div class="container">
            <nav class="nav-inner" role="navigation" aria-label="Main navigation">
              <a href="/" class="nav-logo" aria-label="GINKVORA — Home">
                <div class="logo-mark">
                  <svg width="32" height="32" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15 C66 36 82 46 82 68 C82 83 68 83 50 83 C32 83 18 83 18 68 C18 46 34 36 50 15 Z" stroke="url(#grad-contour-stroke)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M50 78 C50 78 51 55 35 44 C26 38 29 48 38 56 C45 62 47 70 50 78 Z" fill="url(#grad-leaf-main)" opacity="0.95"></path>
                    <path d="M50 78 C50 78 49 55 65 44 C74 38 71 48 62 56 C55 62 53 70 50 78 Z" fill="url(#grad-leaf-main)" opacity="0.95"></path>
                    <path d="M50 78 V38" stroke="url(#grad-contour-stroke)" stroke-width="2.2" stroke-linecap="round"></path>
                    <circle cx="50" cy="30" r="4" fill="url(#grad-dewdrop-color)"></circle>
                    <defs>
                      <linearGradient id="grad-contour-stroke" x1="50" y1="15" x2="50" y2="83" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#fde68a"></stop>
                        <stop offset="100%" stop-color="#9a3412"></stop>
                      </linearGradient>
                      <linearGradient id="grad-leaf-main" x1="50" y1="38" x2="50" y2="78" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#fbbf24"></stop>
                        <stop offset="100%" stop-color="#b45309"></stop>
                      </linearGradient>
                      <linearGradient id="grad-dewdrop-color" x1="50" y1="26" x2="50" y2="34" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#f59e0b"></stop>
                        <stop offset="100%" stop-color="#fef3c7"></stop>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span class="logo-text">GINKVORA</span>
              </a>

              <ul class="nav-links">
                <li><a href="/products" class="nav-link">Products</a></li>
                <li><a href="/calculator" class="nav-link">Formulator</a></li>
                <li><a href="/about" class="nav-link">About</a></li>
                <li><a href="/anti-aging-philosophy" class="nav-link">Anti-Aging Philosophy</a></li>
                <li><a href="/insights" class="nav-link">Insights</a></li>
              </ul>

              <div class="nav-actions">
                <a href="/contact" class="btn btn--primary btn--sm nav-cta">
                  Request a Sample
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="stroke: currentColor;">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
                <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu">
                  <span class="toggle-bar"></span>
                  <span class="toggle-bar"></span>
                  <span class="toggle-bar"></span>
                </button>
              </div>
            </nav>
          </div>
        </header>

        <!-- Mobile Menu -->
        <div class="mobile-menu" id="mobile-menu">
          <div class="container">
            <ul class="mobile-links">
              <li><a href="/products" class="mobile-link">Products</a></li>
              <li><a href="/calculator" class="mobile-link">Formulator</a></li>
              <li><a href="/about" class="mobile-link">About</a></li>
              <li><a href="/anti-aging-philosophy" class="mobile-link">Anti-Aging Philosophy</a></li>
              <li><a href="/insights" class="mobile-link">Insights</a></li>
              <li><a href="/contact" class="mobile-link">Contact</a></li>
            </ul>
          </div>
        </div>

        <!-- ── Main Content ── -->
        <main>
          <div class="container">
            <div class="sitemap-header">
              <h1>XML Sitemap</h1>
              <p class="description">
                This sitemap contains the pages and products published on the GINKVORA website. It is specifically structured for search engines (like Google, Bing, and Yandex) to optimize crawling, but styled with a layout for human visibility.
              </p>

              <div class="info-grid">
                <div class="info-card">
                  <div class="info-label">Total Indexed Pages</div>
                  <div class="info-val" id="total-count">
                    <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
                  </div>
                </div>
                <div class="info-card">
                  <div class="info-label">Filtered Results</div>
                  <div class="info-val" id="visible-count">
                    <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
                  </div>
                </div>
                <div class="info-card">
                  <div class="info-label">Format Standard</div>
                  <div class="info-val" style="font-size: 1.15rem; font-weight:600; margin-top:0.35rem;">Sitemaps.org 0.9</div>
                </div>
              </div>
            </div>

            <div class="search-wrapper">
              <svg class="search-icon" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
              <input type="text" id="search-input" class="search-input" placeholder="Search page URLs (e.g. products, insights, ru...)" />
            </div>

            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width: 55%;">URL Path</th>
                    <th style="width: 12%;">Priority</th>
                    <th style="width: 13%;">Change Freq</th>
                    <th style="width: 20%;">Last Modified (UTC)</th>
                  </tr>
                </thead>
                <tbody id="sitemap-body">
                  <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <xsl:sort select="sitemap:priority" order="descending" data-type="number"/>
                    <xsl:sort select="sitemap:loc" order="ascending"/>
                    <tr class="url-row">
                      <td>
                        <a href="{sitemap:loc}" class="url-link" target="_blank">
                          <xsl:value-of select="sitemap:loc"/>
                        </a>
                        <xsl:if test="xhtml:link">
                          <div class="alternates">
                            <span>Translations:</span>
                            <xsl:for-each select="xhtml:link">
                              <a href="{@href}" class="alt-badge" target="_blank">
                                <xsl:value-of select="translate(@hreflang, 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
                              </a>
                            </xsl:for-each>
                          </div>
                        </xsl:if>
                      </td>
                      <td>
                        <div class="priority-badge">
                          <xsl:attribute name="data-priority">
                            <xsl:value-of select="sitemap:priority"/>
                          </xsl:attribute>
                          <xsl:value-of select="sitemap:priority"/>
                        </div>
                      </td>
                      <td class="freq-cell">
                        <xsl:value-of select="sitemap:changefreq"/>
                      </td>
                      <td class="date-cell">
                        <xsl:value-of select="substring(sitemap:lastmod, 0, 20)"/>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <!-- ── Footer ── -->
        <footer class="footer">
          <div class="container">
            <div class="footer-grid">
              <!-- Brand Column -->
              <div class="footer-brand">
                <a href="/" class="footer-logo">
                  <svg width="28" height="28" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15 C66 36 82 46 82 68 C82 83 68 83 50 83 C32 83 18 83 18 68 C18 46 34 36 50 15 Z" stroke="url(#grad-contour-stroke-footer)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M50 78 C50 78 51 55 35 44 C26 38 29 48 38 56 C45 62 47 70 50 78 Z" fill="url(#grad-leaf-main-footer)" opacity="0.95"></path>
                    <path d="M50 78 C50 78 49 55 65 44 C74 38 71 48 62 56 C55 62 53 70 50 78 Z" fill="url(#grad-leaf-main-footer)" opacity="0.95"></path>
                    <path d="M50 78 V38" stroke="url(#grad-contour-stroke-footer)" stroke-width="2.2" stroke-linecap="round"></path>
                    <circle cx="50" cy="30" r="4" fill="url(#grad-dewdrop-color-footer)"></circle>
                    <defs>
                      <linearGradient id="grad-contour-stroke-footer" x1="50" y1="15" x2="50" y2="83" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#fde68a"></stop>
                        <stop offset="100%" stop-color="#9a3412"></stop>
                      </linearGradient>
                      <linearGradient id="grad-leaf-main-footer" x1="50" y1="38" x2="50" y2="78" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#fbbf24"></stop>
                        <stop offset="100%" stop-color="#b45309"></stop>
                      </linearGradient>
                      <linearGradient id="grad-dewdrop-color-footer" x1="50" y1="26" x2="50" y2="34" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#f59e0b"></stop>
                        <stop offset="100%" stop-color="#fef3c7"></stop>
                      </linearGradient>
                    </defs>
                  </svg>
                  <span class="footer-logo-text">GINKVORA</span>
                </a>
                <p class="footer-tagline">
                  Pure Nature, Proven Science.<br/>
                  Premium B2B botanical extract supplier serving global nutraceutical, cosmetic and pet health industries.
                </p>
                <div class="footer-certs">
                  <span class="cert-badge">ISO</span>
                  <span class="cert-badge">GMP</span>
                  <span class="cert-badge">FSSC</span>
                  <span class="cert-badge">Kosher</span>
                  <span class="cert-badge">Halal</span>
                </div>
              </div>

              <!-- Products Column -->
              <div class="footer-col">
                <h3 class="footer-col-title">Products</h3>
                <ul class="footer-links">
                  <li><a href="/products?category=superfood" class="footer-link">Superfood</a></li>
                  <li><a href="/products?category=liposomal" class="footer-link">Liposomal Products</a></li>
                  <li><a href="/products?category=pet-longevity" class="footer-link">Pet Health</a></li>
                  <li><a href="/custom-formulation" class="footer-link">Custom Formulation</a></li>
                </ul>
              </div>

              <!-- Solutions Column -->
              <div class="footer-col">
                <h3 class="footer-col-title">Solutions &amp; Expertise</h3>
                <ul class="footer-links">
                  <li><a href="/anti-aging-philosophy" class="footer-link">Anti-Aging Philosophy</a></li>
                  <li><a href="/Featured Formulas" class="footer-link">Featured Formulas</a></li>
                  <li><a href="/calculator" class="footer-link">Calculator</a></li>
                </ul>
              </div>

              <!-- Company Column -->
              <div class="footer-col">
                <h3 class="footer-col-title">Company</h3>
                <ul class="footer-links">
                  <li><a href="/about" class="footer-link">About Us</a></li>
                  <li><a href="/quality" class="footer-link">Quality &amp; Certifications</a></li>
                  <li><a href="/insights" class="footer-link">Industry Insights</a></li>
                  <li><a href="/contact" class="footer-link">Contact Us</a></li>
                </ul>
                <div class="footer-contact">
                  <a href="mailto:inquiry@ginkvora.com" class="footer-contact-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    inquiry@ginkvora.com
                  </a>
                  <a href="https://wa.me/8613201818603" class="footer-contact-item" target="_blank">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.71a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16c.112.27.18.558.19.85v.07z"/>
                    </svg>
                    Request a Quote
                  </a>
                </div>
              </div>
            </div>

            <!-- Bottom Bar -->
            <div class="footer-bottom">
              <p class="footer-copy">
                &#169; <span id="current-year">2026</span> Shaanxi Ginkvora Biotechnology Co., Ltd. All rights reserved.
              </p>
              <div class="footer-legal">
                <a href="/privacy" class="footer-legal-link">Privacy Policy</a>
                <a href="/terms" class="footer-legal-link">Terms of Service</a>
                <a href="/sitemap.xml" class="footer-legal-link">Sitemap</a>
              </div>
            </div>
          </div>
        </footer>

        <!-- ── Interactive Filtering &amp; Utilities ── -->
        <script type="text/javascript">
          document.addEventListener('DOMContentLoaded', () => {
            const searchInput = document.getElementById('search-input');
            const rows = document.querySelectorAll('.url-row');
            const visibleCountLabel = document.getElementById('visible-count');
            const currentYearLabel = document.getElementById('current-year');

            // Set current year dynamically
            if (currentYearLabel) {
              currentYearLabel.textContent = new Date().getFullYear().toString();
            }

            // Navbar scroll effect
            const navbar = document.getElementById('navbar');
            window.addEventListener('scroll', () => {
              if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
              } else {
                navbar.classList.remove('scrolled');
              }
            }, { passive: true });

            // Mobile menu toggle
            const toggle = document.getElementById('nav-toggle');
            const mobileMenu = document.getElementById('mobile-menu');

            if (toggle &amp;&amp; mobileMenu) {
              toggle.addEventListener('click', () => {
                const isOpen = mobileMenu.classList.contains('open');
                mobileMenu.classList.toggle('open');
                toggle.classList.toggle('open');
              });
            }

            // Filter rows function
            function filterRows() {
              const query = searchInput.value.toLowerCase().trim();
              let visibleCount = 0;

              rows.forEach(row => {
                const urlText = row.querySelector('.url-link').textContent.toLowerCase();
                
                // Match URL
                if (urlText.includes(query)) {
                  row.style.display = '';
                  visibleCount++;
                } else {
                  row.style.display = 'none';
                }
              });

              if (visibleCountLabel) {
                visibleCountLabel.textContent = visibleCount.toString();
              }
            }

            if (searchInput) {
              searchInput.addEventListener('input', filterRows);
            }
          });
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
