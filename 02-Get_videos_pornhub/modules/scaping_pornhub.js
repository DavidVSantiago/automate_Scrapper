const puppeteer = require('puppeteer');

/** Contém os algoritmos de scrapping do PornHub */
class ScrapingPornHub{
    constructor(){}

    // #####################################################################################################################
    // Métodos de extração de dados das páginas de resultados
    // #####################################################################################################################
    
    static async fakeExtraction(videoList){
        const html = await FileUtils.readFile('local_pages_test/results.html');
        const $ = cheerio.load(html); // Carrega o HTML no Cheerio
        // Seleciona os elementos e extrai os dados
        $('#videoSearchResult > .pcVideoListItem').each((index, element) => {
            const $element = $(element);
            const link = $element.find('a').attr('href');
            const regex = /viewkey=([^&]+)/;
            const match = link.match(regex);
            const code = (match)?match[1]:'';
            const title = $element.find('a').attr('title');
            const thumb = $element.find('a img').attr('src');
            const mediabook = $element.find('a img').data('mediabook');
            const metaTags = '';
            let jsonObj = {link,code,title,thumb,mediabook,metaTags}
            videoList.push(jsonObj);
        });
        return true; // has next page?
    }
    
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
                    const regex = /viewkey=([^&]+)/;
                    const match = link.match(regex);
                    const code = (match)?match[1]:'';
                    const title = item.querySelector('a').dataset.title;
                    const thumb = item.querySelector('a img').src;
                    const mediabook = item.querySelector('a img').dataset.mediabook;
                    const metaTags = '';
                    let jsonObj = {link,code,title,thumb,mediabook,metaTags}
                    returnVideoList.push(jsonObj);
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
    
    // #####################################################################################################################
    // Métodos de extração de dados das página de metatags (algoritmos de scrapping)
    // #####################################################################################################################
    
    static async fakeScrapeTags(obj) {
        const html = await FileUtils.readFile('local_pages_test/metatags.html');
        const $ = cheerio.load(html); // Carrega o HTML no Cheerio
        // Seleciona os elementos e extrai os dados
        let metaTags = '';
        $('.tagsWrapper .item').each((index, element) => {
            if(index!==0) metaTags+=', '; // separador das metatags
            const $element = $(element);
            metaTags+=$element.text();
        });
        return metaTags; // has next page?
    }
    
    static async puppeteerScrapeTags(obj) {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(obj['link']); // operação demorada
            //await page.waitForNavigation();
            const metaTagsText =  await page.evaluate(() => {
                const a = document.querySelectorAll('.tagsWrapper .item');
                let metaTags = '';
                a.forEach(item => {
                    if(metaTags!=='') metaTags+=', ';
                    tag = item.innerHTML;
                    metaTags+=tag;
                });
                return metaTags;
            });
            await browser.close();
            return metaTagsText;
        } catch (error) { return null;}
    }
}
module.exports = ScrapingPornHub;

