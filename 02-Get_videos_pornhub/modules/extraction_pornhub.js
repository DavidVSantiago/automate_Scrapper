const axios = require('axios');
const cheerio = require('cheerio');
const FileUtils = require('./utils/file_utils');
const Utils = require('./utils/utils');
const ScrapingPornHub = require('./scaping_pornhub');

class ExtactionPornHub{
    constructor(site,term){
        //https://es.pornhub.com/video/search?search=latinas&o=mv
        this._inputFileName = `app_input.json`;
        this._term = term;
        this._site = site;
        this._url = `${this._site}/video/search?search=${this._term}&o=mv`;
        this._dirName = `categories/${this._term}`;
        this._fileName = `${this._dirName}/page`;
        this._configFileName = `${this._dirName}/config.cfg`;
        this._consolidateFileName = `${this._dirName}/consolidate.json`;
    }

    async start(){
        await FileUtils.makeDir(this._dirName); // cria o diretório do arquivo de configurações
        await this.buildConfig(); // cria o arquivo de configuração do scrapping
        console.log(`\n   LOG-> Iniciando o processo de scraping para o termo '${this._term}':`); // imprime um msg de finalização
        
        while(await this.hasNextPage()){ // enquanto o arquivo de configuração indicar a existência de novas páginas de pesquisa para o termo
            await this.scrapNextPage(); // faz o scrap da próxima página
            await this.changeStepConfig(); // sinaliza o próximo passo no arquivo de configuração
            await this.getMetaTags(); // obtém as metatags para cada um dos videos dos resultados da página
            await this.changePageConfig(); // sinaliza a próxima página
        }
    
        if(! await this.hasFinishAll()){ // se ainda não concluiu tudo
            await this.consolidateResults(); // após todos os vídeos obtidos de todas as páginas, consolidamos os resultados em apenas um único arquivo
            await this.removeDuplicate(); // remove os possíveis resultados duplicados do arquivo consolidado
            await this.doFinishAll();
        }
    
        console.log(`\n   LOG-> Processo de scraping 100% completado para o termo '${this._term}'.`); // imprime um msg de finalização
    }
    
    // #####################################################################################################################
    // Métodos básicos do processo de scrapping
    // #####################################################################################################################
    
    /** Tenta fazer scrap na próxima página de resultados de busca */
    async scrapNextPage() {
        let pageNumber = await this.getPageNumber(); // verifica a página que deverá ser buscada
        if(pageNumber!=1)this._url+=`&page=${pageNumber}`; // adiciona a querystring para as próximas páginas
        let videoList = []; // lista que armazena os resultados do scrap
        let hasNextPage = await this.extractDataFromPage(videoList); // inicia o processo de scrap na página de resultados e retorna booleano sobre a existencia ou não da próxima página
        if(!hasNextPage) await this.changeFinishPagesConfig(); // atualiza a informação de finalização ou não do processo de scrap
        console.log(`\n   LOG-> Iniciou scrapping da pagina ${pageNumber} | ${videoList.length} resultados.`); // imprime um msg sinalizadora do processo de busca
        let result = await FileUtils.writeJsonToFile(videoList,`${this._fileName}_${pageNumber}.json`); // salva os dados da página
        if(!result) console.error(`   LOG-> Erro ao tentar salvar no arquivo de dados '${this._fileName}_${pageNumber}.json'`);
    }
    
    /** Função generica para extrair os dados de uma página */
    async extractDataFromPage(videoList) {
        let hasNextPage;
        do{
            //hasNextPage = fakeExtraction(videoList);
            hasNextPage = await ScrapingPornHub.puppeteerExtraction(this._url,videoList);
            if(hasNextPage===null) {
                console.log(`\n   LOG-> Erro ao tentar baixar página. Tentando novamente em instantes...`);
                await Utils.sleep(30000);// espera 30 segundos
            }
        }while(hasNextPage===null);
        return hasNextPage;
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
            metaTagsText = await ScrapingPornHub.puppeteerScrapeTags(obj);
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
        let oldVideoList = await FileUtils.readJsonFileAsArray(this._consolidateFileName); // obtém a lista de videos consolidados
        console.log("   LOG-> antes:"+oldVideoList.length);
        const newVideoList = oldVideoList.reduce((unique, current)=>{
            if (!unique.some(item => item['code'] === current['code'])) {
                unique.push(current);
            }
            return unique;
        },[]);
        console.log("   LOG-> depois:"+newVideoList.length);
        await FileUtils.writeJsonToFile(newVideoList,this._consolidateFileName);
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
        let configFile = {
            page:1, // numero da página
            step:1, // 1 - baixar dados básicos, 2 - baixar metatags
            finishPages: false, // false - faltam páginas, true - terminou a ultima página
            finishAll: false, // false - não terminou o trabalho de pesquisa do termo, true - terminou o trabalho de pesquisa do termo
        }
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }
    
    /** verifica o arquivo .config para saber a partir de qual página fazer o scrap */
    async getPageNumber(){
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        return configFile['page'];
    }
    
    /** Incrementa o parâmetro 'page' para o próximo valor*/
    async changePageConfig() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(configFile['finishPages']===true) return; // se não houver mais páginas, abandona o processo
        configFile['page']++; // incrementa o sinalizador de página
        configFile['step']=1; // ao muda de página, tem que reiniciar o sinalizador de passo
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
        if(configFile===null || configFile['finishPages']===true ) return false;
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
module.exports = ExtactionPornHub;