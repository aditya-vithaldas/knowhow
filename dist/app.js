const projects = window.KNOWHOW_PROJECTS;
const INBOX = 'aditya@decisionos.me';
const $ = id => document.getElementById(id);
let filter = 'All';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mark = p => p.highlight && p.title.includes(p.highlight) ? esc(p.title).replace(esc(p.highlight), `<mark>${esc(p.highlight)}</mark>`) : esc(p.title);
const LOCK = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="7" width="10" height="7" rx="1.8" fill="currentColor"/></svg>';
const counts = p => { const s = p.media.filter(m => m.type === 'img').length, v = p.media.filter(m => m.type !== 'img').length; return [s && `${s} screen${s > 1 ? 's' : ''}`, v && `${v} video${v > 1 ? 's' : ''}`].filter(Boolean).join(' · '); };

function card(p) {
  return `<a class="card c-${p.category.toLowerCase().split(' ')[0]}" href="projects/${p.slug}/"><div class="thumb"><img src="${esc(p.cover)}" alt="" loading="lazy"><span class="badge">${counts(p)}</span></div><div class="card-body"><span class="tag">${esc(p.category)}</span><h3>${mark(p)}</h3><p>${esc(p.desc)}</p><div class="contact"><span class="blur-avatar" aria-hidden="true"></span><span class="contact-text"><small>Built by</small><span class="blurred" aria-hidden="true">Xxxxxx Xxxxxxxx</span><span class="reveal">${LOCK} Revealed after you reach out</span></span></div></div></a>`;
}

function render() {
  const q = $('search').value.toLowerCase().trim();
  $('sectionTitle').textContent = q ? `Projects matching “${$('search').value.trim()}”` : (filter === 'All' ? 'All projects' : `${filter} projects`);
  const list = projects.filter(p => (filter === 'All' || p.tags.includes(filter)) && (!q || `${p.title} ${p.category} ${p.tags.join(' ')} ${p.desc} ${p.query}`.toLowerCase().includes(q)));
  $('grid').innerHTML = list.map(card).join('') || `<div class="empty"><h3>This idea hasn’t found its case study yet.</h3><p>Try fewer words, another filter, or share your specific need.</p><button class="primary" data-need>Share your specific need</button></div>`;
}

function open(html) { $('modal').innerHTML = html; if (!$('dialog').open) $('dialog').showModal(); }


document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; document.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('selected', x === b)); render(); });
document.querySelectorAll('[data-query]').forEach(b => b.onclick = () => { $('search').value = b.dataset.query; render(); $('sectionTitle').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
$('searchForm').onsubmit = e => { e.preventDefault(); render(); $('sectionTitle').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
$('search').oninput = render;
document.querySelector('.close').onclick = () => $('dialog').close();
$('dialog').onclick = e => { if (e.target === $('dialog')) { const r = $('dialog').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('dialog').close(); } };
render();

// Hero question: type ~55ms/char, hold 3s, erase at 25ms; fade the matching illustration in as each new question begins.
const heroProjects = projects.filter(p => p.img);
const typed = $('rotatingProject'), heroArt = $('heroArt'), heroLink = $('heroLink'), motion = window.matchMedia('(prefers-reduced-motion: reduce)');
heroProjects.forEach(p => { const i = new Image(); i.src = `assets/${p.img}.png`; });
let qi = 0, timer, run = 0;
const wait = ms => new Promise(r => { timer = setTimeout(r, ms); });
function show(p) { heroArt.src = `assets/${p.img}.png`; heroLink.href = `projects/${p.slug}/`; }
async function cycle(id) {
  while (id === run) {
    await wait(3000); if (id !== run) return;
    let t = heroProjects[qi].headline;
    for (let n = t.length; n >= 0 && id === run; n--) { typed.textContent = t.slice(0, n); await wait(25); }
    qi = (qi + 1) % heroProjects.length;
    heroArt.classList.add('is-changing'); await wait(200); show(heroProjects[qi]); heroArt.classList.remove('is-changing');
    t = heroProjects[qi].headline;
    for (let n = 1; n <= t.length && id === run; n++) { typed.textContent = t.slice(0, n); await wait(55); }
  }
}
function restart() { clearTimeout(timer); run++; typed.textContent = heroProjects[qi].headline; show(heroProjects[qi]); heroArt.classList.remove('is-changing'); if (!motion.matches && !document.hidden) cycle(run); }
document.addEventListener('visibilitychange', restart); motion.addEventListener('change', restart); restart();
