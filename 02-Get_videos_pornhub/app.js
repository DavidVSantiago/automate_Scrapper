const ExtactionPornHub = require('./modules/extraction_pornhub.js');
const FileUtils = require('./modules/utils/file_utils.js');
const WordpressUtils = require('./modules/utils/wordpress_utils');




(async () => {
    /* executa o processo de scraping para baixar os dados do vídeos */
    // const extraction = new ExtactionPornHub('https://fr.pornhub.com','french');
    // await extraction.start();

    /* remove os registros que possuem dados corrompidos (registros com algum dos campos em branco) */
    await FileUtils.removeCorruptedData('final_results/brasileiras.json');

    /* Inverte a ordem dos registros */
    // await FileUtils.reverseDataOrder('final_results/latinas.json');

    /* insere os posts no wordpress */
    // await WordpressUtils.bulkUploadPosts('final_results/french.json','fr');
    // await WordpressUtils.bulkUploadPosts('final_results/big ass.json','en');
    // await WordpressUtils.bulkUploadPosts('final_results/latinas.json','es');
    // await WordpressUtils.bulkUploadPosts('final_results/brasileiras.json','pt');

})();