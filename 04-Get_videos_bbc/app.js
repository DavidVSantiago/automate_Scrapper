const ExtractLinks = require('./modules/extract_links.js');
const ExtractContents = require('./modules/extract_contents.js');
const DownloadAndConvertImages = require('./modules/download_and_convert_images.js');


(async () => {
    /* baixa a lista de links dos atigos */
    // const extractLinks = new ExtractLinks('https://www.bbc.com/portuguese/topics/c404v027pd4t','tecnologia');
    // await extractLinks.start();

    /* baixa a lista de conteúdos de cada link obtido na etapa aterior */
    const extractContents = new ExtractContents('tecnologia');
    await extractContents.start();

    /* baixa as imagens da lista de links*/
    // const downloadAndConvertImages = new DownloadAndConvertImages('tecnologia');
    // await downloadAndConvertImages.start();

})();