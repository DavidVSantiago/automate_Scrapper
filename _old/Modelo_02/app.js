const DownloadPages = require('./modules/download_pages');

var _inputFileName, _term, _site, _url, _dirName, _fileName, _configFileName, _consolidateFileName;

(async () => {
  await initVariables();
  // executar modulo de download das páginas
  const dp = await new DownloadPages(_term,_url);
  await dp.startProcess();
  // executar modulo de scrap das páginas baixadas
})();

async function initVariables() {
  //_inputFileName = `app_input.json`;
  _term = 'latinas';
  _site = 'https://pt.pornhub.com'
  _url = `${_site}/video/search?search=${_term}`;
  //_dirName = `categories/${_term}`;
  //_fileName = `${_dirName}/page`;
  //_configFileName = `${_dirName}/config.cfg`;
  //_consolidateFileName = `${_dirName}/consolidate.json`;
}