const axios = require('axios');
const cheerio = require('cheerio');
const FileUtils = require('./utils/file_utils');
const Utils = require('./utils/utils');
const ScrapingPornHub = require('./scaping_pornhub');

class ExtactionPornHub{
    constructor(searchterm){
        this._searchterm=searchterm;
        this._url=`https://pt.pornhub.com/video/search?search=${this._searchterm}&o=mv`;
        this._browser=null;
        this._dirName = 'extracted/';
        this._configFileName = `${this._dirName}config.cfg`;
        this._videoListFileName = `${this._dirName}video-list.txt`;
    }

    async start(){
        
        await FileUtils.makeDir(this._dirName); // cria o diretório do arquivo de configurações
        await this.buildConfigFile(); // cria o arquivo de configuração
        await this.buildDataFile(); // cria o arquivo de dados

        console.log(`\n   LOG-> Iniciando o processo de scraping para o termo '${this._searchterm}':`); // imprime um msg de finalização
        
        while(!await this.hasFinish()){ // enquanto o arquivo de configuração indicar a existência de novas páginas de pesquisa para o termo
            await this.scrapNextPage(); // faz o scrap da próxima página
            await this.changePageConfig(); // sinaliza a próxima página
        }
    
        await this.removeDuplicate(); // remove os possíveis resultados duplicados do arquivo consolidado
   
        this._browser.close();
        console.log(`\n   LOG-> Processo de scraping 100% completado para o termo '${this._searchterm}'.`); // imprime um msg de finalização
    }
    
    // #####################################################################################################################
    // Métodos básicos do processo de scrapping
    // #####################################################################################################################
    
    /** Tenta fazer scrap na próxima página de resultados de busca */
    async scrapNextPage() {
        let pageNumber = await this.getPageNumber(); // verifica a página que deverá ser buscada
        console.log(`\n   LOG-> Extraindo dados da página ${pageNumber}...`); // imprime um msg sinalizadora do processo de busca
        if(pageNumber!=1)this._url+=`&page=${pageNumber}`; // adiciona a querystring para a 2ª página em diantes
        let videoList = []; // lista que armazena os resultados do scrap
        let hasNextPage = await this.extractDataFromPage(videoList); // inicia o processo de scrap na página de resultados e retorna booleano sobre a existencia ou não da próxima página
        if(!hasNextPage) await this.doFinish(); // sinaliza a finalização do processo (não há próximas páginas)
        console.log(`   LOG-> Salvando ${videoList.length} resultados.`); // imprime um msg sinalizadora do processo de busca
        let result = await FileUtils.appendArrayToFile(videoList,`${this._videoListFileName}`); // salva os dados da página
        if(!result) console.error(`   LOG-> Erro ao tentar salvar no arquivo de dados '${this._videoListFileName}'`);
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
    
    /** Percorre o dados dos videos e remove os possíveis registros duplicados */
    async removeDuplicate(){
        console.log(`\n   LOG-> Iniciando o processo de remoção de dados duplicados.`); // imprime um msg
        let oldVideoList = await FileUtils.readFileAsArray(this._videoListFileName); // obtém a lista de videos
        console.log("   LOG-> antes:"+oldVideoList.length);
        const newVideoList = await oldVideoList.reduce((unique, current)=>{
            if (!unique.some(item => item === current)) {
                unique.push(current);
            }
            return unique;
        },[]);
        console.log("   LOG-> depois:"+newVideoList.length);
        await FileUtils.writeArrayToFile(newVideoList,this._videoListFileName);
        console.log(`   LOG-> Processo de remoção de dados duplicados finalizado.`); // imprime um msg
    }
    
    // #####################################################################################################################
    // Métodos do arquivo de configuração
    // #####################################################################################################################
    
    /** Esta função cria o arquivo de configuração, caso ainda não tenha sido criado */
    async buildConfigFile() {
        // verifica se o arquivo de configuração já foi criado antes  
        let oldConfigFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(oldConfigFile!=null){
            console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' já existe!`);
            return;
        }
        let configFile = {
            page:1, // numero da página
            finish: false, // false - não terminou o trabalho, true - terminou o trabalho de baixar todas as páginas
        }
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }

    /** Esta função cria o arquivo de dados, caso ainda não tenha sido criado */
    async buildDataFile() {
        // verifica se o arquivo de dados do video já foi criado antes 
        let oldVideoFile = await FileUtils.readFile(this._videoListFileName); // lê o arquivo de dados
        if(oldVideoFile!=null){
            console.log(`   LOG-> Arquivo de dados '${this._videoListFileName}' já existe!`);
            return;
        }
        let result = await FileUtils.writeToFile('',this._videoListFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de dados '${this._videoListFileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de dados '${this._videoListFileName}'`);
    }
    
    /** verifica o arquivo .config para saber a partir de qual página fazer o scrap */
    async getPageNumber(){
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        return configFile['page'];
    }
    
    /** Incrementa o parâmetro 'page' para o próximo valor*/
    async changePageConfig() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(configFile['finish']===true) return; // se não houver mais páginas, abandona o processo
        configFile['page']++; // incrementa o sinalizador de página
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração
        if(!result) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }
    
    /** Verifica se existem novas páginas */
    async hasFinish() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(configFile===null || configFile['finish']===false ) return false;
        return true;
    }
    
    /** Configura o processo como 100% completado (não há mais páginas)*/
    async doFinish() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['finish'] = true; // sinaliza a finalização do processo
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração
        if(!result) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }
}
module.exports = ExtactionPornHub;