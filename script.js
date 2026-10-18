(() => {
  const config = window.WEBCAM_BUBBLES_SITE || {};
  const version = config.version || '1.2.4';
  const minecraft = config.minecraft || '26.3';
  const repo = config.repoUrl || 'https://github.com/';
  const releases = config.releasesUrl || repo;
  const setHref = (id, url) => { const el = document.getElementById(id); if (el) el.href = url; };
  ['navRepo','sourceHero','footerRepo'].forEach(id => setHref(id, repo));
  ['downloadHero','downloadPanel','downloadBottom'].forEach(id => setHref(id, releases));
  const heroVersion = document.getElementById('heroVersion'); if (heroVersion) heroVersion.textContent = `Версия ${version} · Minecraft ${minecraft}`;
  const releaseVersion = document.getElementById('releaseVersion'); if (releaseVersion) releaseVersion.textContent = `v${version}`;
  const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();

  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  const toast = document.getElementById('toast');
  const copyStatus = document.getElementById('copyStatus');
  let toastTimer;
  async function copyCommand(command) {
    try {
      await navigator.clipboard.writeText(command);
      if (copyStatus) copyStatus.textContent = `Скопировано: ${command}`;
      if (toast) { toast.textContent = `Команда скопирована: ${command}`; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200); }
    } catch (_) {
      if (copyStatus) copyStatus.textContent = `Выдели и скопируй вручную: ${command}`;
      if (toast) { toast.textContent = `Команда: ${command}`; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }
    }
  }
  document.querySelectorAll('.command-row').forEach(row => row.addEventListener('click', () => copyCommand(row.dataset.command || '')));
  const search = document.getElementById('commandSearch');
  search?.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    document.querySelectorAll('.command-row').forEach(row => { row.hidden = !row.innerText.toLowerCase().includes(query); });
  });
  document.querySelectorAll('.faq-list details').forEach(detail => {
    const marker = detail.querySelector('summary span');
    const sync = () => { if (marker) marker.textContent = detail.open ? '−' : '+'; };
    detail.addEventListener('toggle', sync); sync();
  });
})();
