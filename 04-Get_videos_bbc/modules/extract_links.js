const FileUtils = require('./utils/file_utils');
const puppeteer = require('puppeteer');

class ExtractLinks{
    constructor(url,categoria){
        this._categoria = categoria;
        this._linksFileName = `extraction/links/${categoria}.txt`;
        this._baseUrl = url;
        this._url = url;
        this._configFileName = 'modules/extract_links.cfg';
    }
    async start(){
        await this.buildExtractionFiles(); // cria os arquivos e diretórios da extração
        
        /** Loop de navegação nas páginas de extração dos dados */
        console.log(`   LOG-> INICIANDO O PROCESSO DE EXTRAÇÃO DOS LINKS...`);
        const actualPage = await this.getActualPage();
        const lastpage = await this.getLastPage();
        for(let i=actualPage; i<=lastpage; i++){ // navega nas páginas dos resultados de busca
            console.log(`   LOG-> extraindo links da página ${i} para a categoria: ${this._categoria}...`);
            if(i!=1)this._url=this._baseUrl+`?page=${i}`; // adiciona o sufixo para as páginas diferentes e 1
            const linkList = await this.extractLinks(); // faz o scrapping e extrai os links de cada página
            await FileUtils.appendArrayToFile(linkList,this._linksFileName);
            await this.addPageNumber();
        }
        console.log(`   LOG-> PROCESSO DE EXTRAÇÃO DOS LINKS CONCLUÍDO!`);
        this.removeDuplicate();
    }

    // #####################################################################################################################
    // Métodos do arquivo de configuração
    // #####################################################################################################################
    
    async buildExtractionFiles() {
        await FileUtils.makeDir("extraction/links"); // cria o diretório dos arquivos dos liks
        await FileUtils.makeFile('',this._linksFileName); // cria o arquivo dos links
        await this.buildConfig(); // cria o arquivo de configuração do scrapping
    }

    /** Esta função cria o arquivo de configuração, caso ainda não tenha sido criado */
    async buildConfig() {
        // verifica se o arquivo de configuração já foi criado antes  
        let oldConfigFile = await FileUtils.readJsonFile(this._configFileName); // lê o arquivo de configuração
        if(oldConfigFile!=null){
            console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' já existe!`);
            return;
        }
        let configFile = {
            page:1, // numero da página atual
            lastPage:40,// numero da ultima página
        }
        await FileUtils.makeFile('',this._configFileName); // cria o arquivo de configuração
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' atualizado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }

    async addPageNumber(){
        let configFile = await FileUtils.readJsonFile(this._configFileName); // lê o arquivo de configuração
        configFile['page']++;
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' atualizado com sucesso!`);
        else console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }

    async getActualPage(){
        let configFile = await FileUtils.readJsonFile(this._configFileName); // lê o arquivo de configuração
        return configFile['page'];
    }

    async getLastPage(){
        let configFile = await FileUtils.readJsonFile(this._configFileName); // lê o arquivo de configuração
        return configFile['lastPage'];
    }

    // #####################################################################################################################
    // Métodos de EXTRAÇÃO DE DADOS
    // #####################################################################################################################

    async extractLinks(){
        const browser = await puppeteer.launch(); // inicializa o navegador
        const page = await browser.newPage(); // cria uma nova página
        let success;
        let linkList = [];
        do{
            success = true;
            try {
                await page.goto(this._url); // carrega a página de resultados
                await page.evaluate(() => {window.scrollBy(0, window.innerHeight);}); // simulando uma interação humana de scroll

                linkList = await page.$$eval('ul[data-testid="topic-promos"]>li a', (anchors) => {
                    return anchors.map(anchor => anchor.href);
                });
                
            } catch (error) {
                success = false;
            }
        }while(success===false);
        await page.close();
        await browser.close();
        return linkList;
    }

    /** Percorre o arquivo dos links e remove os possíveis registros duplicados */
    async removeDuplicate(){
        console.log(`\n   LOG-> Iniciando o processo de remoção dos links duplicados.`); // imprime um msg
        let oldLinksList = await FileUtils.readFileAsArray(this._linksFileName); // obtém a lista de links
        console.log("   LOG-> antes:"+oldLinksList.length);
        const newLinksList = oldLinksList.reduce((unique, current)=>{
            if (!unique.some(item => item === current)) {
                unique.push(current);
            }
            return unique;
        },[]);
        console.log("   LOG-> depois:"+newLinksList.length);
        await FileUtils.writeJsonToFile(newLinksList,this._consolidateFileName);
        console.log(`   LOG-> Processo de remoção dos links duplicados finalizado.`); // imprime um msg
    }

}module.exports = ExtractLinks;