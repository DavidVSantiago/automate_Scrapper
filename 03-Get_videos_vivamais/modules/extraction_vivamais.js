const axios = require('axios');
const puppeteer = require('puppeteer');
const FileUtils = require('./utils/file_utils');
const Utils = require('./utils/utils');
const ScrapingVivamais = require('./scaping_vivamais');
const { link } = require('fs');

class ExtactionVivamais{
    constructor(url){
        this._inputFileName = `app_input.json`;
        this._baseUrl = url;
        this._url = url;
        this._configFileName = 'extraction/config.cfg';
    }

    async start(){
        await FileUtils.makeDir("extraction/"); // cria o diretório da extração
        
        await this.buildConfig(); // cria o arquivo de configuração do scrapping
        console.log(`\n   LOG-> Iniciando o processo de extração dos dados:`); // msg
        
        while(await this.hasNextPage()){ // enquanto o arquivo de configuração indicar a existência de novas páginas de pesquisa para o termo
            await this.scrapNextPage(); // faz o scrap da próxima página
            await this.changePageConfig(); // sinaliza a próxima página
        }
    
        //await this.removeDuplicate(); // remove os possíveis resultados duplicados do arquivo consolidado
        //await this.changeLastLinkNumber();

        // verrifia se ainda existem links para baixar
        if(await this.hasNextLink()){
            let linkNumber = await this.getLinkNumber();
            let links = await FileUtils.readFile('extraction/links.txt'); // obtém a lista de videos consolidados
            links = links.split('\n'); // Separa o texto em um array de linhas
            links.pop();

            for(let i=linkNumber-1;i<links.length;i++){ // percorre e extrai os dados faltantes
                // acessa o conteúdo
                let objData = await ScrapingVivamais.puppeteerScrapeData(links[i]);
                await FileUtils.appendObjToJsonArrayFile(objData,'extraction/data.json');
                await this.addLinkNumber();// sinaliza que mais um link foi extraido
            }
        }
        //     await this.consolidateResults(); // após todos os vídeos obtidos de todas as páginas, consolidamos os resultados em apenas um único arquivo
        //     await this.doFinishAll();
    
        console.log(`\n   LOG-> Processo de scraping 100% completado para o termo '${this._term}'.`); // imprime um msg de finalização
    }
    
    // #####################################################################################################################
    // Métodos básicos do processo de scrapping
    // #####################################################################################################################
    
    async getLastPage(){
        let success;
        let lastPage;
        do{
            success = true;
            const browser = await puppeteer.launch({headless:false}); // inicializa o navegador
            const page = await browser.newPage(); // cria uma nova página
            try{
                await page.goto(this._url); // carrega a página de resultados
                await page.evaluate(() => { // simulando uma interação humana de scroll
                    window.scrollBy(0, window.innerHeight);
                });

                lastPage = await page.evaluate(() => { // submete a pesquisa js de scrap na página e retorna a lista de videos
                    const lastPageElement = document.querySelector('ul.pagination li:last-child > a');
                    return parseInt(lastPageElement.textContent,10);
                });
            } catch (error) {
                success = false;
            }
            await page.close();
            await browser.close();
        }while(!success);
        return lastPage;
    }

    /** Tenta fazer scrap na próxima página de resultados de busca */
    async scrapNextPage() {
        let pageNumber = await this.getPageNumber(); // verifica a página que deverá ser buscada
        if(pageNumber!=1)this._url=this._baseUrl+`page/${pageNumber}`; // adiciona o sufixo para as próximas páginas
        let linkList = await this.extractDataFromPage(); // inicia o processo de scrap na página de resultados e retorna booleano sobre a existencia ou não da próxima página
        await FileUtils.appendToFile(await Utils.ArrayToTextLine(linkList),'extraction/links.txt');
    }
    
    /** Função generica para extrair os dados de uma página */
    async extractDataFromPage() {
        let linkList;
        do{
            linkList = await ScrapingVivamais.puppeteerExtraction(this._url);
            if(linkList===null) {
                console.log(`\n   LOG-> Erro ao tentar baixar página. Tentando novamente em instantes...`);
                await Utils.sleep(3000);// espera 3 segundos
            }
        }while(linkList===null);
        return linkList;
    }
    
    /** Obtém as metatags para cada um dos vídeos da página de resultados de busca */
    async getMetaTags(){
        let pageNumber = await this.getPageNumber(); // verifica a página dos arquivos que derverá obter as metatags
        let videoList = await FileUtils.readJsonFileAsArray(`${this._fileName}_${pageNumber}.json`); // obtém a lista de videos da página atual
        console.log(`   LOG-> pagina ${pageNumber} | início da obtenção das metatags:`); // imprime um msg sinalizadora do início do processo
        for(let i=0; i<videoList.length;i++){ // percorre cada um dos registros de vídeo da página
            const metaTags = await this.scrapeTags(videoList[i]); // faz o scrap das metatags de cada um dos vídeos
            videoList[i]['metaTags'] = metaTags; // atualiza o registro das metatags, que a princípio estava vazio
        }
        let result = await FileUtils.writeJsonToFile(videoList,`${this._fileName}_${pageNumber}.json`); // atualiza os dados da página
        if(!result) console.error(`   LOG-> Erro ao tentar inserir as metatags no arquivo de dados '${this._fileName}_${pageNumber}.json'`);
    }
    
    /** Função generica para extrair as metatags de cada video */
    async scrapeTags(obj) {
        let metaTagsText;
        do{
            metaTagsText = await ScrapingVivamais.puppeteerScrapeTags(obj);
            if(metaTagsText===null) {
                console.log(`\n   LOG-> Erro ao tentar baixar página. Tentando novamente em instantes...`);
                await Utils.sleep(30000);// espera 30 segundos
            }
        }while(metaTagsText===null);
        return metaTagsText;
    }
    
    /** Junta os dados de video de todas as páginas em um único arquivo consolidado */
    async consolidateResults(){
        console.log(`\n   LOG-> Iniciando o processo de consolidação.`); // imprime um msg
        let pageNumber = await this.getPageNumber(); // obtem o valor da maior página registrada
        let finalVideoList = []; // lista de videos final
        for(let i=1; i<=pageNumber; i++){ // itera sobre todas as páginas
            let videoList = await FileUtils.readJsonFileAsArray(`${this._fileName}_${i}.json`); // obtém cada uma das listas de video
            finalVideoList = finalVideoList.concat(videoList); // adiciona cada uma das listas de video à lista final
        }
        let result = await FileUtils.writeJsonToFile(finalVideoList,this._consolidateFileName); // cria o arquivo da lista de vídeo consolidada 
        if(!result) console.error(`   LOG-> Erro ao criar o arquivo de dados consolidados '${this._consolidateFileName}'`);
        else console.log(`   LOG-> Processo de consolidação finalizado.`); // imprime um msg
    }
    
    /** Percorre o arquivo consolidado do temo e remove os possíveis registros duplicados */
    async removeDuplicate(){
        console.log(`\n   LOG-> Iniciando o processo de remoção de dados duplicados.`); // imprime um msg
        let links = await FileUtils.readFile('extraction/links.txt'); // obtém a lista de videos consolidados
        links = links.split('\n'); // Separa o texto em um array de linhas
        links.pop();
        console.log("   LOG-> antes:"+links.length);
        const newLinks = links.reduce((unique, current)=>{
            if (!unique.some(item => item===current)) {
                unique.push(current);
            }
            return unique;
        },[]);
        console.log("   LOG-> depois:"+newLinks.length);
        await FileUtils.writeToFile(Utils.ArrayToTextLine(newLinks),'extraction/links.txt');
        console.log(`   LOG-> Processo de remoção de dados duplicados finalizado.`); // imprime um msg
    }
    
    // #####################################################################################################################
    // Métodos do arquivo de configuração
    // #####################################################################################################################
    
    /** Esta função cria o arquivo de configuração, caso ainda não tenha sido criado */
    async buildConfig() {
        // verifica se o arquivo de configuração já foi criado antes  
        let oldConfigFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(oldConfigFile!=null){
            console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' já existe!`);
            return;
        }
        await FileUtils.writeToFile('','extraction/links.txt'); // cria o arquivo dos links
        await FileUtils.writeToFile('','extraction/data.json'); // cria o arquivo dos links
        let lastPage = await this.getLastPage(); // obtem a informação da ultima página de dados
        let configFile = {
            page:1, // numero da página atual
            lastPage,// numero da ultima página
            step:1, // 1 - baixar links, 2 - baixar conteúdos
            linkNumber:1, // numero do link atual para a extração dos dados
            lastLinkNumber:1, // numero do último link a ser visitado para extração dos dados
            rewriteTitleNumber:1,
            rewriteContentNumber:1,
        }
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }

    async changeLastLinkNumber(){
        let links = await FileUtils.readFile('extraction/links.txt'); // obtém a lista de videos consolidados
        links = links.split('\n'); // Separa o texto em um array de linhas
        let lastLinkNumber = links.length-1;
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['lastLinkNumber']=lastLinkNumber;
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }

    async addLinkNumber(){
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['linkNumber']++;
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }
    
    /** verifica o arquivo .config para saber a partir de qual página fazer o scrap */
    async getPageNumber(){
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        return configFile['page'];
    }

    /** verifica o arquivo .config para saber a partir de qual link fazer o scrap */
    async getLinkNumber() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        return configFile['linkNumber'];
    }
    
    /** Incrementa o parâmetro 'page' para o próximo valor */
    async changePageConfig() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['page']++; // incrementa o sinalizador de página
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração
        if(!result) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }
    
    /** Incrementa o parâmetro 'step' para o valor 2*/
    async changeStepConfig() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['step']=2; // marca para realização da "obtenção das metatags"
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração 
        if(!result) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }
    
    /** Esta função atualiza o parâmetro 'finishPages'*/
    async changeFinishPagesConfig() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['finishPages']=true;
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração
        if(!result) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }
    
    /** Verifica se existem novas páginas */
    async hasNextPage() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(configFile['page']>configFile['lastPage']) return false;
        return true;
    }

    /** Verifica se existem novos links a serem visitados */
    async hasNextLink() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(configFile['linkNumber']>configFile['lastLinkNumber']) return false;
        return true;
    }
    
    /** Configura o processo como 100% completado */
    async doFinishAll() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['finishAll'] = true; // sinaliza a finalização de todo processo
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração
        if(!result) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }
    
    /** Verifica se o processo foi 100% completado */
    async hasFinishAll() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        return configFile['finishAll']; // retorna true ou false
    }
}
module.exports = ExtactionVivamais;