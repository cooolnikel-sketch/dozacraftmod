(function () {
  const CFG = window.DOZACRAFT_CONFIG || {};
  const REPO_URL = `https://github.com/${CFG.owner}/${CFG.repo}`;
  const RELEASES_URL = `${REPO_URL}/releases`;
  const ISSUES_URL = `${REPO_URL}/issues`;

  document.querySelectorAll('#repoLink, #sourceLink, #footerRepoLink').forEach(el => { el.href = REPO_URL; });
  document.getElementById('releasesLink').href = RELEASES_URL;
  document.getElementById('issuesLink').href = ISSUES_URL;

  const listEl = document.getElementById('releaseList');
  const stateMsg = document.getElementById('stateMsg');
  const mcFilter = document.getElementById('mcFilter');
  const currentLine = document.getElementById('currentLine');
  const heroDownload = document.getElementById('heroDownload');

  let releases = [];

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return iso; }
  }

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  }

  function primaryAsset(release) {
    if (!release.assets || !release.assets.length) return null;
    return release.assets.find(a => a.name.toLowerCase().endsWith('.jar')) || release.assets[0];
  }

  function renderHero() {
    const latest = releases.find(r => !r.prerelease) || releases[0];
    if (!latest) {
      currentLine.textContent = 'Релизы пока не опубликованы.';
      heroDownload.href = RELEASES_URL;
      heroDownload.target = '_blank';
      heroDownload.rel = 'noreferrer';
      return;
    }
    const asset = primaryAsset(latest);
    currentLine.innerHTML = '';
    const b1 = document.createElement('b'); b1.textContent = latest.mod_version;
    const b2 = document.createElement('b'); b2.textContent = latest.mc_version;
    currentLine.append('Версия ', b1, ' для Minecraft ', b2);

    if (asset) {
      heroDownload.href = asset.download_url;
      heroDownload.removeAttribute('target');
    } else {
      heroDownload.href = latest.html_url || RELEASES_URL;
      heroDownload.target = '_blank';
      heroDownload.rel = 'noreferrer';
    }
  }

  function populateFilter() {
    const versions = Array.from(new Set(releases.map(r => r.mc_version))).filter(Boolean);
    versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const v of versions) {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      mcFilter.appendChild(opt);
    }
  }

  function renderList() {
    const filter = mcFilter.value;
    const items = filter ? releases.filter(r => r.mc_version === filter) : releases;

    listEl.innerHTML = '';

    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'state-msg';
      p.textContent = releases.length ? 'Нет версий для выбранного Minecraft.' : 'Релизы пока не опубликованы — загляните на страницу релизов GitHub.';
      listEl.appendChild(p);
      return;
    }

    for (const r of items) {
      const row = document.createElement('div');
      row.className = 'release-row';

      const modVer = document.createElement('div');
      modVer.className = 'mod-version';
      modVer.textContent = r.mod_version;
      if (r.prerelease) {
        const tag = document.createElement('span');
        tag.className = 'prerelease-tag';
        tag.textContent = 'pre-release';
        modVer.appendChild(tag);
      }

      const chip = document.createElement('div');
      chip.className = 'mc-chip';
      chip.textContent = 'MC ' + r.mc_version;

      const body = document.createElement('div');
      body.className = 'release-body';

      const meta = document.createElement('p');
      meta.className = 'release-meta';
      meta.textContent = formatDate(r.published_at);
      body.appendChild(meta);

      if (r.body) {
        const notes = document.createElement('p');
        notes.className = 'release-notes';
        notes.textContent = r.body;
        body.appendChild(notes);
      }

      if (r.assets && r.assets.length > 1) {
        const links = document.createElement('div');
        links.className = 'asset-links';
        for (const a of r.assets) {
          const link = document.createElement('a');
          link.className = 'asset-link';
          link.href = a.download_url;
          link.textContent = a.name + (a.size ? ' · ' + formatSize(a.size) : '');
          links.appendChild(link);
        }
        body.appendChild(links);
      }

      const asset = primaryAsset(r);
      const dl = document.createElement('a');
      dl.className = 'row-download';
      if (asset) {
        dl.href = asset.download_url;
      } else {
        dl.href = r.html_url || RELEASES_URL;
        dl.target = '_blank';
        dl.rel = 'noreferrer';
      }
      dl.textContent = 'Скачать';

      row.append(modVer, chip, body, dl);
      listEl.appendChild(row);
    }
  }

  mcFilter.addEventListener('change', renderList);

  fetch('releases.json', { cache: 'no-store' })
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {
      releases = Array.isArray(data.releases) ? data.releases : [];
      renderHero();
      populateFilter();
      renderList();
    })
    .catch(() => {
      stateMsg.textContent = 'Не удалось загрузить список версий.';
      currentLine.textContent = `Актуальные версии смотрите на странице релизов GitHub.`;
      heroDownload.href = RELEASES_URL;
      heroDownload.target = '_blank';
      heroDownload.rel = 'noreferrer';
    });
})();
