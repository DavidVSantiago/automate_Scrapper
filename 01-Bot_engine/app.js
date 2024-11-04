const CommentsPornHub = require('./modules/porn_hub/comments_pornhub');
const ExtractionPornHub = require('./modules/extraction_pornhub');
const CommentsGenerator = require('./modules/porn_hub/comments_generator');
const CommentsWhatsApp = require('./modules/whatsapp/comments_whatsapp');
const threadsQtd = 5;

const authList = [
    {'login':'kingcutsmaster@gmail.com','senha':'kb23QxQ@$J2V4@J5sGnv'},
    {'login':'kingcutsmaster2@gmail.com','senha':'kb23QxQ@$J2V4@J5sGnv'},
    {'login':'kingcutsmaster3@gmail.com','senha':'kb23QxQ@$J2V4@J5sGnv'},
    {'login':'kingcutsmaster4@gmail.com','senha':'kb23QxQ@$J2V4@J5sGnv'},
    {'login':'kingcutsmaster5@gmail.com','senha':'kb23QxQ@$J2V4@J5sGnv'},
];

(async () => {
    /* executa o processo de scraping para baixar os dados do vídeos para o arquivo */
    // const extraction = new ExtractionPornHub('brasileiras');
    // await extraction.start(); // inicia

    /* executa o processo de geração dos comentários */
    // const generator = new CommentsGenerator();
    //await generator.start();
    //await generator.consolidateResults();
    //await generator.separateBlocks(threadsQtd); // separa os resultados consolidados em sub blocos, para os trabalhos das threads

    /* executa o processo de comentar cada um ds videos baixados */
    // const comments = new CommentsPornHub(authList);
    // await comments.start();

    /* Testes WhatsApp */
    const commentsWhatsApp = new CommentsWhatsApp()
    await commentsWhatsApp.start();
})();