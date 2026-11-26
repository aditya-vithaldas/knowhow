// Generates the crawlable parts of the site from dist/projects.js:
//   - static cards, FAQ, footer and JSON-LD on dist/index.html (between <!--seo:*--> markers)
//   - one project page per project at dist/projects/<slug>/index.html, with every screen and video
//   - dist/sitemap.xml, dist/robots.txt, dist/llms.txt
// Run after editing projects.js:  node scripts/build-seo.mjs
// Extra local screenshots: put images in dist/assets/screens/<slug>/ and they are added to that project's gallery.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://knowhow.build/').replace(/\/?$/, '/');
const INBOX = 'aditya@decisionos.me';
const BRAND = 'Knowhow';
const TITLE = 'Knowhow — Has anybody already built it? Voice commerce, AI analytics and agent case studies';
const DESC = 'Case studies with screens and videos: voice-first e-commerce shopping, agents in investment management, voice-based analytics, proactive analytics and voice-driven seller onboarding. Share your specific need and reach the builder.';
const WRITING = [['Decision Axis', 'https://decisionaxis.substack.com/'], ['Delightful AI Products', 'https://delightfulaiproducts.substack.com/']];

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(DIST, 'projects.js'), 'utf8'), ctx);
const projects = ctx.window.KNOWHOW_PROJECTS;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const ask = p => `Has anybody already built ${p.headline}`;
const answer = p => `Yes. ${p.desc} ${p.approach}`;
const abs = (u, prefix = '') => /^https?:/.test(u) ? u : prefix + u;
const src = (u, prefix = '') => /^https?:/.test(u) ? u : prefix + u;
const thumb = (p, prefix = '') => src(p.cover, prefix);
const mark = p => p.highlight && p.title.includes(p.highlight) ? esc(p.title).replace(esc(p.highlight), `<mark>${esc(p.highlight)}</mark>`) : esc(p.title);
const LOCK = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="7" width="10" height="7" rx="1.8" fill="currentColor"/></svg>';
const image = p => abs(thumb(p), SITE);
const mailto = p => `mailto:${INBOX}?subject=${encodeURIComponent('Knowhow: ' + p.title)}&body=${encodeURIComponent(`Hi, I saw "${p.title}" on Knowhow.\n\nWhat I want to build:\n\nMy specific need:\n\n`)}`;
const localShots = p => {
  const dir = path.join(DIST, 'assets', 'screens', p.slug);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f)).sort().map((f, i) => ({ type: 'img', src: `../../assets/screens/${p.slug}/${f}`, alt: `${p.title} — local screen ${i + 1}` })) : [];
};
const counts = p => {
  const s = p.media.filter(m => m.type === 'img').length, v = p.media.filter(m => m.type !== 'img').length;
  return [s && `${s} screen${s > 1 ? 's' : ''}`, v && `${v} video${v > 1 ? 's' : ''}`].filter(Boolean).join(' · ');
};

const qa = p => {
  const problem = p.problem || p.question, thinking = p.thinking || p.tradeoff, solution = p.solution || p.approach;
  const out = [
    [`Has anybody already built ${p.topic}?`, `Yes. ${p.desc} ${solution}`],
    [`How do I build ${p.topic}?`, `${thinking} ${solution}`],
    [`Who is the right expert to build ${p.topic}?`, `Someone who has already built it. This case study comes from a ${p.role.toLowerCase()}. Hire the right expertise, not just anyone who can build: share your specific need on Knowhow and the builder’s name is shared once you reach out.`],
  ];
  if (/\?$/.test(problem)) out.push([problem, solution]);
  return out;
};
const generalFaq = [
  ['What is Knowhow?', 'Knowhow is a library of AI product case studies, prototypes and teardowns. Each one explains the question, the approach, the tradeoff and the lesson, with every screen and video, so you can learn from work that already exists and reach the builder for your own project.'],
  ['How do I reach the person behind a project?', `Use “Share your specific need” on any project. It goes to ${INBOX}.`],
  ['Can I ask about something that isn’t listed?', 'Yes. Share your specific need from the homepage and describe what you want to build and where you are stuck.'],
];

function card(p, prefix = '') {
  return `<a class="card c-${p.category.toLowerCase().split(' ')[0]}" href="${prefix}projects/${p.slug}/"><div class="thumb"><img src="${esc(thumb(p, prefix))}" alt="${esc(p.title)}" loading="lazy"><span class="badge">${counts(p)}</span></div><div class="card-body"><span class="tag">${esc(p.category)}</span><h3>${mark(p)}</h3><p>${esc(p.desc)}</p><div class="contact"><span class="blur-avatar" aria-hidden="true"></span><span class="contact-text"><small>Built by</small><span class="blurred" aria-hidden="true">Xxxxxx Xxxxxxxx</span><span class="reveal">${LOCK} Revealed after you reach out</span></span></div></div></a>`;
}

function footer(prefix = '') {
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand"><a class="brand" href="${prefix || './'}">knowhow<span>✳</span></a><p>A place for the thinking behind the doing.</p><button class="primary" data-need onclick="if(!window.needForm){location.href='${prefix}#need'}">Share your specific need</button></div>
    <div class="footer-projects"><h4>Projects</h4><ul>${projects.map(p => `<li><a href="${prefix}projects/${p.slug}/">${esc(p.title)}</a></li>`).join('')}</ul></div>
    <div><h4>Knowhow</h4><ul><li><a href="${prefix}design-standard/">Design standard</a></li>${WRITING.map(([n, u]) => `<li><a href="${u}" rel="me noopener">${n}</a></li>`).join('')}<li><a href="mailto:${INBOX}">${INBOX}</a></li></ul></div>
  </div>
  <div class="footer-base"><span>© ${year} Knowhow</span><span>Concepts and prototypes use fictional data unless stated.</span></div>
</footer>`;
}

function replaceBlock(html, key, content) {
  const re = new RegExp(`<!--seo:${key}-->[\\s\\S]*?<!--/seo:${key}-->`);
  if (!re.test(html)) throw new Error(`marker seo:${key} missing`);
  return html.replace(re, () => `<!--seo:${key}-->${content}<!--/seo:${key}-->`);
}

// ---- Homepage
const faqItems = [...projects.filter(p => p.category !== 'Storytelling').map(p => [ask(p), answer(p), p]), ...generalFaq];
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
  { '@type': 'Organization', '@id': SITE + '#org', name: BRAND, url: SITE, email: INBOX, logo: SITE + 'assets/crm.png', sameAs: WRITING.map(w => w[1]) },
  { '@type': 'ItemList', name: 'Knowhow projects', itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}projects/${p.slug}/`, name: p.title })) },
] })}
`;
const homeFaq = `
  <section class="faq" id="faq">
    <div class="eyebrow">QUESTIONS PEOPLE ASK BEFORE THEY BUILD</div>
    <h2>Has anybody already built it?</h2>
    <div class="faq-list">
${faqItems.map(([q, a, p]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}${p ? ` <a href="projects/${p.slug}/">See the project</a>.` : ''}</p></details>`).join('\n')}
    </div>
  </section>
  `;
let home = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
home = replaceBlock(home, 'head', homeHead);
home = replaceBlock(home, 'cards', projects.map(p => card(p)).join(''));
home = replaceBlock(home, 'faq', '');
home = replaceBlock(home, 'footer', footer());
const ver = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(DIST, f))).digest('hex').slice(0, 8);
const V = { css: ver('style.css'), app: ver('app.js'), data: ver('projects.js') };
home = home.replace(/href="style\.css(\?v=[^"]*)?"/, `href="style.css?v=${V.css}"`).replace(/src="app\.js(\?v=[^"]*)?"/, `src="app.js?v=${V.app}"`).replace(/src="projects\.js(\?v=[^"]*)?"/, `src="projects.js?v=${V.data}"`);
fs.writeFileSync(path.join(DIST, 'index.html'), home);

// ---- Project pages
fs.rmSync(path.join(DIST, 'projects'), { recursive: true, force: true });
for (const p of projects) {
  const url = `${SITE}projects/${p.slug}/`;
  const media = [...p.media, ...localShots(p)];
  const title = `${p.title} — ${p.category} case study | ${BRAND}`;
  const description = `${ask(p)} ${p.desc} ${counts(p) ? 'Includes ' + counts(p) + '.' : ''}`.trim();
  const others = projects.filter(o => o !== p);
  const sources = [['Read the full write-up', p.source], ...(p.extra || [])];
  const renderMedia = (m, i) => m.type === 'video'
    ? `<figure class="shot-video"><video controls preload="none" playsinline poster="${esc(src(m.poster, '../../'))}" src="${esc(src(m.src, '../../'))}"></video><figcaption>${esc(m.alt)}</figcaption></figure>`
    : m.type === 'youtube'
    ? `<figure class="shot-video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(m.id)}" title="${esc(m.alt)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe><figcaption>${esc(m.alt)}</figcaption></figure>`
    : `<a class="shot" href="${esc(src(m.src, '../../'))}" target="_blank" rel="noopener"><img src="${esc(src(m.src, '../../'))}" alt="${esc(m.alt)}" loading="${i < 2 ? 'eager' : 'lazy'}"></a>`;
  const topIdx = p.top || [0, 1];
  const top = topIdx.map(i => media[i]).filter(Boolean);
  const rest = media.filter(m => !top.includes(m));
  const problem = p.problem || p.question, thinking = p.thinking || p.tradeoff, solution = p.solution || p.approach;
  const videoLd = media.filter(m => m.type === 'video').map(m => ({ '@type': 'VideoObject', name: m.alt, description: p.desc, thumbnailUrl: src(m.poster, SITE), contentUrl: src(m.src, SITE), uploadDate: p.date }));
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
<meta property="og:image" content="${esc(image(p))}">
<meta property="article:published_time" content="${p.date}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../../style.css?v=${V.css}">
${ld({ '@context': 'https://schema.org', '@graph': [
  { '@type': 'Article', '@id': url + '#article', headline: p.title, description, image: [image(p), ...media.filter(m => m.type === 'img').slice(0, 5).map(m => src(m.src, SITE))], url, datePublished: p.date, articleSection: p.category, keywords: p.query, about: ask(p), author: { '@type': 'Person', jobTitle: p.role }, publisher: { '@id': SITE + '#org' }, mainEntityOfPage: url, isBasedOn: p.source, isPartOf: { '@id': SITE + '#website' }, ...(videoLd.length ? { video: videoLd } : {}) },
  { '@type': 'FAQPage', mainEntity: qa(p).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: BRAND, item: SITE },
    { '@type': 'ListItem', position: 2, name: p.title, item: url },
  ] },
] })}
</head>
<body>
<header>
  <a class="brand" href="../../">knowhow<span>✳</span></a>
  <a class="outline" href="${esc(mailto(p))}">Share your <i class="wide-only">specific </i>need <span>→</span></a>
</header>
<nav class="crumbs" aria-label="Breadcrumb"><a href="../../">All projects</a> / ${esc(p.category)}</nav>
<main class="case c-${p.category.toLowerCase().split(' ')[0]}">
  <div class="case-title">
    <div class="eyebrow">${esc(p.category.toUpperCase())} · CASE STUDY</div>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.desc)}</p>
  </div>
  ${top.length ? `<section class="top-shots${top.length === 1 ? ' one' : ''}" aria-label="Key screens">${top.map(renderMedia).join('')}</section>` : ''}
  <div class="case-body">
    <article>
      <h2>The problem</h2>
      <p>${esc(problem)}</p>
      <h2>Thought process</h2>
      <p>${esc(thinking)}</p>
      <h2>The solution</h2>
      <p>${esc(solution)}</p>
      <ul class="sources">${p.demo ? `<li><a href="${esc(p.demo)}" target="_blank" rel="noopener">Open the live prototype ↗</a></li>` : ''}${sources.map(([n, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)} ↗</a></li>`).join('')}</ul>
    </article>
    <aside class="aside">
      <div class="contact"><span class="blur-avatar" aria-hidden="true"></span><span class="contact-text"><small>Built by</small><span class="blurred" aria-hidden="true">Xxxxxx Xxxxxxxx</span><span class="reveal">${LOCK} Revealed after you reach out</span></span></div>
      <p class="hire">Hire the right expertise, not just anyone who can build.</p>
      <a class="primary" href="${esc(mailto(p))}">Share your specific need</a>
    </aside>
  </div>
  <section class="case-qa" aria-labelledby="qaTitle">
    <h2 id="qaTitle">Questions this case study answers</h2>
${qa(p).map(([q, a]) => `    <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
  </section>
${rest.length ? `  <section class="gallery-section" aria-label="More screens and videos">
    <div class="eyebrow">MORE SCREENS AND VIDEOS</div>
    <div class="gallery">${rest.map((m, i) => renderMedia(m, i + 2)).join('')}</div>
  </section>
` : ''}</main>
${footer('../../').replace(/ data-need onclick="[^"]*"/, '').replace('<button class="primary">Share your specific need</button>', `<a class="primary" href="${esc(mailto(p))}">Share your specific need</a>`)}
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
  <url><loc>${SITE}</loc></url>
${projects.map(p => `  <url><loc>${SITE}projects/${p.slug}/</loc></url>`).join('\n')}
  <url><loc>${SITE}design-standard/</loc></url>
</urlset>
`);
const BOTS = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot'];
fs.writeFileSync(path.join(DIST, 'robots.txt'), `# Knowhow welcomes search engines and AI answer engines.\nUser-agent: *\nAllow: /\n\n${BOTS.map(b => `User-agent: ${b}\nAllow: /`).join('\n\n')}\n\nSitemap: ${SITE}sitemap.xml\n`);
// IndexNow key file (Bing, Yandex and others; Bing's index feeds ChatGPT search)
const INDEXNOW = fs.readFileSync(path.join(ROOT, 'scripts', 'indexnow-key.txt'), 'utf8').trim();
fs.writeFileSync(path.join(DIST, `${INDEXNOW}.txt`), INDEXNOW);
fs.writeFileSync(path.join(DIST, 'llms.txt'), `# ${BRAND}

> ${DESC}

Knowhow answers one question: “Has anybody already built this?” Each project page explains the question, the approach, the tradeoff and the lesson, with every screen and video. To reach the builder, share your specific need at ${INBOX}.

## Projects

${projects.map(p => `### [${p.title}](${SITE}projects/${p.slug}/)\n\n${p.desc}\n\n${qa(p).map(([q, a]) => `- **${q}** ${a}`).join('\n')}`).join('\n\n')}

## Writing

${WRITING.map(([n, u]) => `- [${n}](${u})`).join('\n')}

## Other

- [Design standard](${SITE}design-standard/): Knowhow’s palette, type, illustration and motion guidelines.
`);

console.log(`Built ${projects.length} project pages for ${SITE}`);
