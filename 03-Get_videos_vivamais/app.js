const ExtactionVivamais = require('./modules/extraction_vivamais.js');
const IARewrite = require('./modules/ia_rewrite.js');
const FileUtils = require('./modules/utils/file_utils.js');
const WordpressUtils = require('./modules/utils/wordpress_utils.js');
const DownloadAndConvertImages = require('./modules/download_and_convert_images.js');




(async () => {
    /* executa o processo de scraping para baixar os dados do vídeos */
    // const extraction = new ExtactionVivamais('https://vivamais.cemigsaude.org.br/');
    // await extraction.start();

    // const downloadAndConvertImages = new DownloadAndConvertImages();
    // await downloadAndConvertImages.start();

    const iARewrite = new IARewrite();
    await iARewrite.start();

})();