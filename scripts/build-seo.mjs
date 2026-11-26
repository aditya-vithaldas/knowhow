// Generates the crawlable parts of the site from dist/projects.js:
//   - static cards, FAQ and JSON-LD on dist/index.html (between <!--seo:*--> markers)
//   - one case-study page per project at dist/projects/<slug>/index.html
//   - dist/sitemap.xml, dist/robots.txt, dist/llms.txt
// Run after editing projects.js:  node scripts/build-seo.mjs
// Screenshots: put images in dist/assets/screens/<slug>/ (png/jpg/webp); they appear on that case study.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://aditya-vithaldas.github.io/knowhow/').replace(/\/?$/, '/');
const INBOX = 'aditya@decisionos.me';
const BRAND = 'Knowhow';
const TITLE = 'Knowhow — Has anybody already built it? Project case studies and the people behind them';
const DESC = 'Before you build, see how others approached it: case studies for an e-commerce lead CRM, conversational onboarding, an AI knowledge base with sources, a maker marketplace and a subscription dashboard — and reach the person who built it.';

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(DIST, 'projects.js'), 'utf8'), ctx);
const projects = ctx.window.KNOWHOW_PROJECTS;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const ask = p => `Has anybody already built ${p.headline}`;
const answer = p => `Yes. ${p.desc} ${p.approach} The main tradeoff: ${p.tradeoff}`;
const mailto = p => `mailto:${INBOX}?subject=${encodeURIComponent('Knowhow inquiry: ' + p.title)}&body=${encodeURIComponent(`Hi, I read the case study "${p.title}" on Knowhow.\n\nI'm building… and I'd like to ask…\n\n`)}`;
const screens = p => {
  const dir = path.join(DIST, 'assets', 'screens', p.slug);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f)).sort() : [];
};

const generalFaq = [
  ['What is Knowhow?', 'Knowhow is a library of project case studies that explain the thinking behind a build — the question, the approach, the tradeoffs and the lessons — so you can learn from people who already solved a similar problem and hire them for yours.'],
  ['How do I contact the person behind a project?', `Open any case study and send an inquiry. The builder’s name is shared once you inquire, and every inquiry currently goes to ${INBOX}.`],
  ['Can I request a project that isn’t listed?', 'Yes. Use “Post a project request” on the homepage to describe what you want to build and where you are stuck.'],
];

function card(p, prefix = '') {
  return `<a class="card" href="${prefix}projects/${p.slug}/"><div class="art"><img src="${prefix}assets/${p.img}.png" alt="${esc(p.title)} illustration" loading="lazy" width="720" height="720"></div><div class="card-body"><span class="tag">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><div class="person"><span class="avatar">✳</span><span>${esc(p.role)}<small>Name shared after you inquire</small></span><span class="read">Read the thinking →</span></div></div></a>`;
}

function replaceBlock(html, key, content) {
  const re = new RegExp(`<!--seo:${key}-->[\\s\\S]*?<!--/seo:${key}-->`);
  if (!re.test(html)) throw new Error(`marker seo:${key} missing`);
  return html.replace(re, `<!--seo:${key}-->${content}<!--/seo:${key}-->`);
}

// ---- Homepage
const faqItems = [...projects.map(p => [ask(p), answer(p), p]), ...generalFaq];
const homeHead = `
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESC)}">
<link rel="canonical" href="${SITE}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#F8FAFE">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}assets/crm.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(TITLE)}">
<meta name="twitter:description" content="${esc(DESC)}">
<meta name="twitter:image" content="${SITE}assets/crm.png">
<link rel="alternate" type="text/plain" title="LLM summary" href="${SITE}llms.txt">
${ld({ '@context': 'https://schema.org', '@graph': [
  { '@type': 'WebSite', '@id': SITE + '#website', url: SITE, name: BRAND, description: DESC, publisher: { '@id': SITE + '#org' } },
  { '@type': 'Organization', '@id': SITE + '#org', name: BRAND, url: SITE, email: INBOX, logo: SITE + 'assets/crm.png' },
  { '@type': 'ItemList', name: 'Knowhow project case studies', itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}projects/${p.slug}/`, name: p.title })) },
  { '@type': 'FAQPage', mainEntity: faqItems.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
] })}
`;
const homeFaq = `
  <section class="faq" id="faq">
    <div class="eyebrow">QUESTIONS PEOPLE ASK BEFORE THEY BUILD</div>
    <h2>Has anybody already built it?</h2>
    <div class="faq-list">
${faqItems.map(([q, a, p]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}${p ? ` <a href="projects/${p.slug}/">Read the case study</a>.` : ''}</p></details>`).join('\n')}
    </div>
  </section>
  `;
let home = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
home = replaceBlock(home, 'head', homeHead);
home = replaceBlock(home, 'cards', projects.map(p => card(p)).join(''));
home = replaceBlock(home, 'faq', homeFaq);
fs.writeFileSync(path.join(DIST, 'index.html'), home);

// ---- Case-study pages
for (const p of projects) {
  const url = `${SITE}projects/${p.slug}/`;
  const shots = screens(p);
  const title = `${p.title} — case study | ${BRAND}`;
  const description = `${ask(p)} ${p.desc} See the approach, the tradeoffs and what to take with you.`;
  const others = projects.filter(o => o !== p);
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}assets/${p.img}.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../../style.css">
${ld({ '@context': 'https://schema.org', '@graph': [
  { '@type': 'Article', '@id': url + '#article', headline: p.title, description, image: `${SITE}assets/${p.img}.png`, url, articleSection: p.category, keywords: p.query, about: ask(p), author: { '@type': 'Person', jobTitle: p.role }, publisher: { '@type': 'Organization', name: BRAND, url: SITE }, mainEntityOfPage: url, isPartOf: { '@id': SITE + '#website' } },
  { '@type': 'FAQPage', mainEntity: [
    { '@type': 'Question', name: ask(p), acceptedAnswer: { '@type': 'Answer', text: answer(p) } },
    { '@type': 'Question', name: p.question, acceptedAnswer: { '@type': 'Answer', text: p.approach } },
    { '@type': 'Question', name: 'What is the main tradeoff?', acceptedAnswer: { '@type': 'Answer', text: p.tradeoff } },
  ] },
  { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: BRAND, item: SITE },
    { '@type': 'ListItem', position: 2, name: p.category, item: SITE + '#faq' },
    { '@type': 'ListItem', position: 3, name: p.title, item: url },
  ] },
] })}
</head>
<body>
<header>
  <a class="brand" href="../../">knowhow<span>✳</span></a>
  <a class="outline" href="${esc(mailto(p))}">Send an inquiry <span>→</span></a>
</header>
<nav class="crumbs" aria-label="Breadcrumb"><a href="../../">Knowhow</a> / <a href="../../#faq">${esc(p.category)}</a> / ${esc(p.title)}</nav>
<main class="case">
  <section class="case-hero">
    <div>
      <div class="eyebrow">${esc(p.category.toUpperCase())} · CASE STUDY</div>
      <h1>Has anybody already built <span>${esc(p.headline)}</span></h1>
      <p class="lead">${esc(p.desc)}</p>
    </div>
    <div class="hero-art"><img src="../../assets/${p.img}.png" alt="${esc(p.title)} illustration" width="720" height="720"></div>
  </section>
  <div class="case-body">
    <article>
      <h2>The question</h2>
      <p>${esc(p.question)}</p>
      <h2>The approach</h2>
      <p>${esc(p.approach)}</p>
      <h2>The tradeoff</h2>
      <p>${esc(p.tradeoff)}</p>
      <h2>What to take with you</h2>
      <p>${esc(p.lesson)}</p>
${shots.length ? `      <h2>Screenshots</h2>\n      <div class="shots">${shots.map((f, i) => `<a href="../../assets/screens/${p.slug}/${f}"><img src="../../assets/screens/${p.slug}/${f}" alt="${esc(p.title)} screenshot ${i + 1}" loading="lazy"></a>`).join('')}</div>\n` : ''}    </article>
    <aside class="aside">
      <span class="avatar">✳</span>
      <h3>${esc(p.role)}</h3>
      <p>The builder’s name is shared once you send an inquiry.</p>
      <a class="primary" href="${esc(mailto(p))}">Send an inquiry</a>
    </aside>
  </div>
  <section class="related">
    <div class="eyebrow">MORE PROJECT THINKING</div>
    <div class="grid">${others.slice(0, 3).map(o => card(o, '../../')).join('')}</div>
  </section>
</main>
<footer>
  <a class="brand" href="../../">knowhow<span>✳</span></a>
  <span>A place for the thinking behind the doing.</span>
  <span><a href="mailto:${INBOX}">${INBOX}</a></span>
</footer>
</body>
</html>
`;
  fs.mkdirSync(path.join(DIST, 'projects', p.slug), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'projects', p.slug, 'index.html'), page);
}

// ---- sitemap, robots, llms.txt
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}</loc><lastmod>${today}</lastmod></url>
${projects.map(p => `  <url><loc>${SITE}projects/${p.slug}/</loc><lastmod>${today}</lastmod></url>`).join('\n')}
  <url><loc>${SITE}design-standard/</loc><lastmod>${today}</lastmod></url>
</urlset>
`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, 'llms.txt'), `# ${BRAND}

> ${DESC}

Knowhow answers one question: “Has anybody already built this?” Each case study explains the question, the approach, the tradeoff and the lesson. Builders’ names are shared after an inquiry; inquiries go to ${INBOX}.

## Case studies

${projects.map(p => `- [${p.title}](${SITE}projects/${p.slug}/): ${ask(p)} ${p.desc}`).join('\n')}

## Other

- [Design standard](${SITE}design-standard/): Knowhow’s palette, type, illustration and motion guidelines.
`);

console.log(`Built ${projects.length} case studies for ${SITE}`);
