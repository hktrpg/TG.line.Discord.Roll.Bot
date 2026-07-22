'use strict';

/**
 * Build static HTML pages from Markdown in docs/public for GitHub Pages.
 * GitHub Pages with .nojekyll does not render .md, and extensionless files
 * are often downloaded as octet-stream.
 *
 * CREDITS.html gets views/includes/header.html injected at build time.
 */

const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const repoRoot = path.join(__dirname, '..');
const siteDir = process.argv[2] || path.join(repoRoot, '_site');
const headerPath = path.join(repoRoot, 'views', 'includes', 'header.html');

function wrapHtml(title, bodyHtml, options = {}) {
	const { withHeader = false, headerHtml = '' } = options;
	const headerBlock = withHeader
		? `${headerHtml}\n`
		: '';
	const bootstrap = withHeader
		? `
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
    integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
  <script src="https://code.iconify.design/1/1.0.7/iconify.min.js"></script>`
		: '';
	const scripts = withHeader
		? `
  <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"
    integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"
    integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV" crossorigin="anonymous"></script>`
		: '';

	return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>${bootstrap}
  <style>
    :root { color-scheme: light dark; }
    body {
      font-family: "Segoe UI", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      line-height: 1.65;
      margin: 0;
      padding: 0;
      background: #f6f6f6;
    }
    .md-body {
      max-width: 52rem;
      margin: 1rem auto;
      padding: 1.5rem;
      background: #fff;
      border-radius: 5px;
      box-shadow: 0 0 5px #ccc;
    }
    .md-body img { max-width: 100%; height: auto; }
    .md-body a { color: #0b57d0; }
    .md-body hr { border: 0; border-top: 1px solid #ccc; margin: 2rem 0; }
  </style>
</head>
<body>
${headerBlock}<div class="md-body">
${bodyHtml}
</div>${scripts}
</body>
</html>
`;
}

function loadHeaderHtml(pageTitle) {
	if (!fs.existsSync(headerPath)) {
		throw new Error(`Header not found: ${headerPath}`);
	}
	let header = fs.readFileSync(headerPath, 'utf8').trim();
	// Locale switcher needs /api/www-i18n (not available on GitHub Pages)
	header = header.replaceAll(/<li class="nav-item dropdown" id="www-locale-switcher">[\s\S]*?<\/li>/g, '');
	if (pageTitle) {
		header = header.replaceAll(/<span id="title"><\/span>/g, `<span id="title">${pageTitle}</span>`);
	}
	return header;
}

function injectSiteHeader(fileName, pageTitle) {
	const filePath = path.join(siteDir, fileName);
	if (!fs.existsSync(filePath)) {
		console.warn(`skip ${fileName} (missing)`);
		return;
	}
	const header = loadHeaderHtml(pageTitle);
	let html = fs.readFileSync(filePath, 'utf8');
	if (!html.includes('id="header"')) {
		console.warn(`${fileName} has no #header placeholder; skip inject`);
		return;
	}
	html = html.replaceAll(/<div id="header"><\/div>/g, header);
	fs.writeFileSync(filePath, html, 'utf8');
	console.log(`injected header into ${fileName}`);
}

function writeHtml(relPath, title, markdown, options = {}) {
	const outPath = path.join(siteDir, relPath);
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	const html = wrapHtml(title, marked.parse(markdown), options);
	fs.writeFileSync(outPath, html, 'utf8');
	console.log('wrote', relPath);
}

function main() {
	if (!fs.existsSync(siteDir)) {
		throw new Error(`Site dir not found: ${siteDir}`);
	}

	const portfolioMd = path.join(siteDir, 'PORTFOLIOP.md');
	const privacyMd = path.join(siteDir, 'PUBLIC_PRIVACY_POLICY.md');

	injectSiteHeader('CREDITS.html', '名人堂 Hall of Fame');

	if (fs.existsSync(portfolioMd)) {
		const md = fs.readFileSync(portfolioMd, 'utf8');
		const opts = {
			withHeader: true,
			headerHtml: loadHeaderHtml('作品集')
		};
		writeHtml('PORTFOLIOP.html', 'HKTRPG 作品集', md, opts);
		writeHtml(path.join('PORTFOLIOP', 'index.html'), 'HKTRPG 作品集', md, opts);
		fs.unlinkSync(portfolioMd);
	}

	if (fs.existsSync(privacyMd)) {
		const md = fs.readFileSync(privacyMd, 'utf8');
		writeHtml('PUBLIC_PRIVACY_POLICY.html', 'HKTRPG 隱私權聲明', md, {
			withHeader: true,
			headerHtml: loadHeaderHtml('隱私權聲明')
		});
		fs.unlinkSync(privacyMd);
	}

	for (const name of ['README.md']) {
		const p = path.join(siteDir, name);
		if (fs.existsSync(p)) fs.unlinkSync(p);
	}

	const legacyPrivacy = path.join(siteDir, 'PUBLIC_PRIVACY_POLICY');
	if (fs.existsSync(legacyPrivacy) && fs.statSync(legacyPrivacy).isFile()) {
		fs.unlinkSync(legacyPrivacy);
	}

	fs.writeFileSync(path.join(siteDir, '.nojekyll'), '');
	console.log('pages build complete:', siteDir);
}

main();
