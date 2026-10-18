(() => {
  const base = window.DOZACRAFT_CONFIG || {};
  const defaults = {
    projectName: base.projectName || 'DozaCraft', latestVersion: base.latestVersion || '1.2.4',
    latestMinecraft: base.latestMinecraft || '26.3', latestDownloadUrl: base.latestDownloadUrl || '#versions',
    repositoryUrl: base.repositoryUrl || 'https://github.com/', versions: Array.isArray(base.versions) ? base.versions : []
  };
  const storageKey = 'dozacraft-site-settings-v1';
  let settings = defaults;
  try { const saved = localStorage.getItem(storageKey); if (saved) settings = {...defaults, ...JSON.parse(saved)}; } catch (_) {}
  const $ = id => document.getElementById(id);
  // Convenience gate for this static GitHub Pages site (not server-side authentication).
  const ADMIN_USERNAME = 'dozacraft_admin';
  const ADMIN_PASSWORD = 'DozaPanel-4827!';
  let isAdminAuthenticated = false;
  function showAdminLogin() {
    isAdminAuthenticated = false;
    $('adminLogin').hidden = false;
    $('adminContent').hidden = true;
    $('adminUsername').value = '';
    $('adminPassword').value = '';
    $('loginStatus').textContent = '';
  }
  const safeUrl = (url, fallback='#versions') => { try { const u = new URL(url, location.href); return ['https:','http:'].includes(u.protocol) ? u.href : fallback; } catch (_) { return fallback; } };
  function render() {
    $('latestVersion').textContent = settings.latestVersion;
    $('latestMinecraft').textContent = settings.latestMinecraft;
    $('downloadLatest').href = safeUrl(settings.latestDownloadUrl);
    ['repoLink','sourceLink','footerRepo'].forEach(id => $(id).href = safeUrl(settings.repositoryUrl, 'https://github.com/'));
    $('versionRows').replaceChildren();
    (settings.versions || []).forEach(v => {
      const tr = document.createElement('tr');
      [v.mod || '—', v.minecraft || '—', v.loader || 'Fabric'].forEach(value => { const td=document.createElement('td'); td.textContent=value; tr.append(td); });
      const td=document.createElement('td'), a=document.createElement('a'); a.className='row-download'; a.textContent='Скачать ↓'; a.href=safeUrl(v.url); td.append(a); tr.append(td); $('versionRows').append(tr);
    });
  }
  function fillForm() {
    $('editLatestVersion').value=settings.latestVersion; $('editLatestMinecraft').value=settings.latestMinecraft;
    $('editLatestUrl').value=settings.latestDownloadUrl; $('editRepoUrl').value=settings.repositoryUrl;
    $('editVersions').value=(settings.versions||[]).map(v=>`${v.mod} | ${v.minecraft} | ${v.loader||'Fabric'} | ${v.url}`).join('\n'); updateExport();
  }
  function parseVersions(text) { return text.split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{const [mod,minecraft,loader,url]=line.split('|').map(s=>s.trim());return {mod,minecraft,loader:loader||'Fabric',url:url||'#versions'};}); }
  function updateExport() { const cfg={...settings}; $('exportConfig').value='window.DOZACRAFT_CONFIG = '+JSON.stringify(cfg,null,2)+';'; }
  $('adminOpen').addEventListener('click',()=>{
    $('adminModal').hidden=false;
    if (isAdminAuthenticated) { fillForm(); $('adminLogin').hidden=true; $('adminContent').hidden=false; }
    else showAdminLogin();
  });
  $('adminLoginForm').addEventListener('submit', event => {
    event.preventDefault();
    const username = $('adminUsername').value.trim();
    const password = $('adminPassword').value;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      isAdminAuthenticated = true;
      $('adminLogin').hidden = true;
      $('adminContent').hidden = false;
      $('loginStatus').textContent = '';
      fillForm();
    } else {
      $('loginStatus').textContent = 'Неверное имя пользователя или пароль.';
      $('adminPassword').value = '';
      $('adminPassword').focus();
    }
  });
  $('adminLogout').addEventListener('click', () => { showAdminLogin(); $('adminContent').hidden = true; });
  $('adminClose').addEventListener('click',()=>$('adminModal').hidden=true);
  $('adminModal').addEventListener('click',e=>{if(e.target===$('adminModal'))$('adminModal').hidden=true;});
  $('saveSettings').addEventListener('click',()=>{
    const latestDownloadUrl=$('editLatestUrl').value.trim(), repositoryUrl=$('editRepoUrl').value.trim();
    if (!/^https?:\/\//i.test(latestDownloadUrl) || !/^https?:\/\//i.test(repositoryUrl)) { $('adminStatus').textContent='Укажи корректные ссылки, начинающиеся с https://'; return; }
    const versions=parseVersions($('editVersions').value);
    if (versions.some(v=>!v.mod||!v.minecraft||!/^https?:\/\//i.test(v.url))) { $('adminStatus').textContent='Проверь строки версий: в каждой нужна прямая ссылка http(s) на файл.'; return; }
    settings={...settings,latestVersion:$('editLatestVersion').value.trim(),latestMinecraft:$('editLatestMinecraft').value.trim(),latestDownloadUrl,repositoryUrl,versions};
    try { localStorage.setItem(storageKey,JSON.stringify(settings)); } catch (_) {}
    render(); updateExport(); $('adminStatus').textContent='Сохранено в этом браузере. Для публикации для всех скопируй конфигурацию в config.js.';
  });
  $('resetSettings').addEventListener('click',()=>{settings=defaults;try{localStorage.removeItem(storageKey);}catch(_){}render();fillForm();$('adminStatus').textContent='Настройки сброшены к config.js.';});
  $('copyConfig').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('exportConfig').value);$('adminStatus').textContent='Конфигурация скопирована.';}catch(_){$('exportConfig').select();$('adminStatus').textContent='Выдели текст и скопируй вручную.';}});
  render();
})();
