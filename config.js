/* Публичные настройки DozaCraft. API_URL заполни адресом Cloudflare Worker после публикации. */
window.DOZACRAFT_CONFIG = {
  projectName: 'DozaCraft',
  apiUrl: 'https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev',
  latestVersion: '1.2.4',
  latestMinecraft: '26.3',
  latestDownloadUrl: 'https://github.com/YOUR-USERNAME/DozaCraft/releases/latest/download/webcambubbles-1.2.4.jar',
  repositoryUrl: 'https://github.com/YOUR-USERNAME/DozaCraft',
  versions: [
    { mod: '1.2.4', minecraft: '26.3', loader: 'Fabric', url: 'https://github.com/YOUR-USERNAME/DozaCraft/releases/latest/download/webcambubbles-1.2.4.jar' }
  ]
};
