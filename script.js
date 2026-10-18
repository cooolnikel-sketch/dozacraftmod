(() => {
  const base = window.DOZACRAFT_CONFIG || {};
  const api = String(base.apiUrl || '').replace(/\/$/, '');
  const defaults = { projectName: base.projectName || 'DozaCraft', latestVersion: base.latestVersion || '1.2.4', latestMinecraft: base.latestMinecraft || '26.3', latestDownloadUrl: base.latestDownloadUrl || '#versions', repositoryUrl: base.repositoryUrl || 'https://github.com/', versions: Array.isArray(base.versions) ? base.versions : [] };
  let settings = {...defaults};
  const $ = id => document.getElementById(id);
  const safeUrl = (url, fallback='#versions') => { try { const u = new URL(url, location.href); return ['https:','http:'].includes(u.protocol) ? u.href : fallback; } catch (_) { return fallback; } };
  const showStatus = (id, text) => { $(id).textContent = text; };
  async function request(path, options={}) {
    if (!api || api.includes('YOUR-WORKER')) throw new Error('Сначала укажи адрес API в config.js и разверни Cloudflare Worker.');
    const response = await fetch(api + path, { ...options, credentials: 'include', headers: {'Content-Type':'application/json', ...(options.headers||{})} });
    let data={}; try { data=await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.error || `Ошибка сервера (${response.status})`);
    return data;
  }
  function render() {
    $('latestVersion').textContent = settings.latestVersion;
    $('latestMinecraft').textContent = settings.latestMinecraft;
    $('downloadLatest').href = safeUrl(settings.latestDownloadUrl);
    ['repoLink','sourceLink','footerRepo'].forEach(id => $(id).href = safeUrl(settings.repositoryUrl, 'https://github.com/'));
    $('versionRows').replaceChildren();
    (settings.versions || []).forEach(v => {
      const tr=document.createElement('tr');
      [v.mod||'—',v.minecraft||'—',v.loader||'Fabric'].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});
      const td=document.createElement('td'),a=document.createElement('a');a.className='row-download';a.textContent='Скачать ↓';a.href=safeUrl(v.url);a.rel='noopener';td.append(a);tr.append(td);$('versionRows').append(tr);
    });
  }
  function fillForm() {
    $('editLatestVersion').value=settings.latestVersion||''; $('editLatestMinecraft').value=settings.latestMinecraft||'';
    $('editLatestUrl').value=settings.latestDownloadUrl||''; $('editRepoUrl').value=settings.repositoryUrl||'';
    $('editVersions').value=(settings.versions||[]).map(v=>`${v.mod} | ${v.minecraft} | ${v.loader||'Fabric'} | ${v.url}`).join('\n');
  }
  function parseVersions(text) { return text.split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{const [mod,minecraft,loader,url]=line.split('|').map(s=>s.trim());return {mod,minecraft,loader:loader||'Fabric',url};}); }
  function showLogin() { $('loginView').hidden=false; $('settingsView').hidden=true; $('loginPassword').value=''; }
  function showSettings() { $('loginView').hidden=true; $('settingsView').hidden=false; fillForm(); }
  async function loadPublicConfig() {
    try { const data=await request('/api/config'); if(data.config) settings={...defaults,...data.config}; }
    catch(error) { console.warn('Public config API unavailable; showing bundled defaults.',error.message); }
    render();
  }
  $('adminOpen').addEventListener('click', async()=>{
    $('adminModal').hidden=false; showLogin(); showStatus('loginStatus','Проверяем сохранённую сессию…');
    try { await request('/api/me'); showSettings(); showStatus('adminStatus','Сессия активна.'); }
    catch (_) { showLogin(); showStatus('loginStatus','Введи учётные данные администратора.'); }
  });
  $('adminClose').addEventListener('click',()=>$('adminModal').hidden=true);
  $('adminModal').addEventListener('click',e=>{if(e.target===$('adminModal'))$('adminModal').hidden=true;});
  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault(); const button=$('loginSubmit'); button.disabled=true; showStatus('loginStatus','Выполняется вход…');
    try { await request('/api/login',{method:'POST',body:JSON.stringify({username:$('loginUsername').value.trim(),password:$('loginPassword').value})}); $('loginPassword').value=''; const data=await request('/api/config'); settings={...defaults,...data.config}; render(); showSettings(); showStatus('adminStatus','Вход выполнен. Сессия сохранится в защищённой cookie на 7 дней.'); }
    catch(error) { showStatus('loginStatus',error.message); }
    finally { button.disabled=false; }
  });
  $('saveSettings').addEventListener('click',async()=>{
    const latestVersion=$('editLatestVersion').value.trim(), latestMinecraft=$('editLatestMinecraft').value.trim(), latestDownloadUrl=$('editLatestUrl').value.trim(), repositoryUrl=$('editRepoUrl').value.trim();
    if(!latestVersion||!latestMinecraft||!/^https:\/\//i.test(latestDownloadUrl)||!/^https:\/\//i.test(repositoryUrl)){showStatus('adminStatus','Заполни версию и укажи HTTPS-ссылки на JAR и GitHub.');return;}
    const versions=parseVersions($('editVersions').value);
    if(!versions.length||versions.some(v=>!v.mod||!v.minecraft||!/^https:\/\//i.test(v.url))){showStatus('adminStatus','Проверь список: каждая строка должна содержать версию | Minecraft | загрузчик | HTTPS-ссылка.');return;}
    const button=$('saveSettings');button.disabled=true;showStatus('adminStatus','Публикуем настройки…');
    try { const data=await request('/api/config',{method:'PUT',body:JSON.stringify({config:{...settings,latestVersion,latestMinecraft,latestDownloadUrl,repositoryUrl,versions}})}); settings={...defaults,...data.config};render();fillForm();showStatus('adminStatus','Опубликовано. Новые настройки доступны всем посетителям.'); }
    catch(error){showStatus('adminStatus',error.message);}
    finally{button.disabled=false;}
  });
  $('logoutButton').addEventListener('click',async()=>{try{await request('/api/logout',{method:'POST',body:'{}'});}catch(_){}showLogin();showStatus('loginStatus','Ты вышел из панели.');});
  loadPublicConfig();
})();
