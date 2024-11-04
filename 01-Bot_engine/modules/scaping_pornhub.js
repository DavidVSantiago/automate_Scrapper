const puppeteer = require('puppeteer');

/** Contém os algoritmos de scrapping do PornHub */
class ScrapingPornHub{
    constructor(){}

    // #####################################################################################################################
    // Métodos de extração de dados das páginas de resultados
    // #####################################################################################################################
    
    /** Função de extração dos videos da página de pesquisa */
    static async puppeteerExtraction(url,videoList){
        try {
            const browser = await puppeteer.launch(); // inicializa o navegador
            const page = await browser.newPage(); // cria uma nova página
            await page.goto(url); // carrega a página de resultados
            await page.evaluate(() => { // simulando uma interação humana de scroll
                window.scrollBy(0, window.innerHeight);
            });
            let _videoList = await page.evaluate(() => { // submete a pesquisa js de scrap na página e retorna a lista de videos
                const returnVideoList = [];
                const videoListItems = document.querySelectorAll('#videoSearchResult .pcVideoListItem');
                videoListItems.forEach(item => {
                    const link = item.querySelector('a').href;
                    returnVideoList.push(link);
                });
                return returnVideoList; // retorno da consultas js para o node
            });
            _videoList.forEach(obj => {
                videoList.push(obj);
            });
        
            // checa se existe próxima pagina de resultados de busca
            let nextPageButton = await page.$('.page_next');
            const isDisabled = await page.evaluate(element => {
                return element.classList.contains('disabled');
            }, nextPageButton);
            let hasNextPage = !isDisabled; // especifica se há próxima página de resultados de busca
            await browser.close(); // fecha o navegador
            return hasNextPage; // retorna a informação da existência da próxima página
        } catch (error) {
            return null;
        }
    }
}
module.exports = ScrapingPornHub;

