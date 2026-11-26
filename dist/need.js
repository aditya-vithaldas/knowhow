// "Share your specific need" form, shared by the homepage and project pages.
// Saves the inquiry through the Decision Axis contact API (stored in Firestore, emailed to Aditya).
// If the API can't be reached, it falls back to opening the visitor's email app so nothing is lost.
(() => {
  const API = 'https://decisionaxis.co/api/contact';
  const INBOX = 'aditya@decisionos.me';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function dialog() {
    let d = document.getElementById('needDialog');
    if (d) return d;
    d = document.createElement('dialog');
    d.id = 'needDialog';
    d.className = 'need-dialog';
    d.innerHTML = '<button class="close" type="button" aria-label="Close">×</button><div class="need-body"></div>';
    document.body.appendChild(d);
    d.querySelector('.close').onclick = () => d.close();
    d.addEventListener('click', e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
    return d;
  }

  function open(project) {
    const d = dialog();
    const search = document.getElementById('search');
    const about = project ? `<p class="need-about">About: <strong>${esc(project)}</strong></p>` : '';
    d.querySelector('.need-body').innerHTML = `
      <span class="tag">SHARE YOUR SPECIFIC NEED</span>
      <h2>What do you want to build?</h2>
      ${about}
      <form class="need-form" novalidate>
        <label>Your name<input name="name" required maxlength="120" autocomplete="name"></label>
        <label>Email<input name="email" type="email" required maxlength="254" autocomplete="email"></label>
        <label>Company <span class="opt">(optional)</span><input name="company" maxlength="160" autocomplete="organization"></label>
        <label>What you want to build<input name="title" required maxlength="160" value="${esc(project ? '' : (search && search.value) || '')}" placeholder="I want to build…"></label>
        <label>Your specific need<textarea name="details" required maxlength="3000" placeholder="Who is it for? What have you tried? Where are you stuck?"></textarea></label>
        <label>Where are you now?<select name="stage"><option>Exploring an idea</option><option>Planning an approach</option><option>Building a first version</option><option>Improving something existing</option></select></label>
        <input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        <p class="need-status" role="status" hidden></p>
        <button class="primary" type="submit">Send</button>
      </form>`;
    if (!d.open) d.showModal();
    const form = d.querySelector('form');
    form.onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const status = form.querySelector('.need-status');
      const button = form.querySelector('button[type=submit]');
      status.hidden = false;
      if (!f.name.trim() || !f.title.trim() || !f.details.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
        status.dataset.state = 'error';
        status.textContent = 'Please add your name, a valid email, what you want to build and your need.';
        return;
      }
      const inquiry = `[Knowhow] ${f.title.trim()}\n${project ? `Project: ${project}\n` : ''}Stage: ${f.stage}\nPage: ${location.href}\n\n${f.details.trim()}`;
      const body = new URLSearchParams({ name: f.name.trim(), email: f.email.trim(), company: f.company.trim() || 'Not provided', inquiry, website: f.website || '' });
      button.disabled = true;
      status.dataset.state = '';
      status.textContent = 'Sending…';
      try {
        const res = await fetch(API, { method: 'POST', headers: { Accept: 'application/json' }, body });
        const out = await res.json().catch(() => ({}));
        if (!res.ok && !out.saved) throw new Error(out.error || 'unavailable');
        d.querySelector('.need-body').innerHTML = `<span class="tag">RECEIVED</span><h2>Thanks, ${esc(f.name.trim().split(' ')[0])}.</h2><p>Your need is saved and on its way to the builder. You’ll hear back at <strong>${esc(f.email.trim())}</strong>.</p>`;
      } catch {
        status.dataset.state = 'error';
        status.innerHTML = `We couldn’t send it from here, so your email app will open with it ready to go. If nothing opens, write to <a href="mailto:${INBOX}">${INBOX}</a>.`;
        location.href = `mailto:${INBOX}?subject=${encodeURIComponent('Knowhow: ' + f.title.trim())}&body=${encodeURIComponent(inquiry + '\n\n— ' + f.name.trim() + (f.company.trim() ? ', ' + f.company.trim() : '') + ' (' + f.email.trim() + ')')}`;
      } finally {
        button.disabled = false;
      }
    };
  }

  window.needForm = open;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-need]');
    if (!b) return;
    e.preventDefault();
    open(b.dataset.project || '');
  });
})();
