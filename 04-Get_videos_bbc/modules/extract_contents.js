const FileUtils = require('./utils/file_utils');
const puppeteer = require('puppeteer');

class ExtractContents{
    constructor(categoria){
        this._categoria = categoria;
        this._linksListName = `extraction/links/${categoria}.txt`;
        this._contentsFileName = `extraction/contents/${categoria}.json`;
        this._configFileName = 'modules/extract_contents.cfg';
    }
    async start(){
        await this.buildExtractionFiles(); // cria os arquivos e diretórios da extração

        let linksList = await FileUtils.readFileAsArray(this._linksListName); // obtém a lista de links

         /** Loop de navegação nas páginas de extração dos dados */
         console.log(`   LOG-> INICIANDO O PROCESSO DE EXTRAÇÃO DOS LINKS...`);
         const actualLink = await this.getActualLink();
         const lastLink = await this.getLastLink();
         for(let i=actualLink; i<=lastLink; i++){ // navega em cada um dos links
             console.log(`   LOG-> extraindo o conteúdo da página ${i} para a categoria: ${this._categoria}...`);
             const link = linksList[i-1]; // obtém o link de cada página, a partir da lista de links
             const jsonData = await this.extractContent(link); // faz o scrapping e extrai de todo o conteúdo da página
        
             await this.addLinkNumber(); // incrementa o marcador de link atual no arquivo de configuração
         }
    }

    // #####################################################################################################################
    // Métodos do arquivo de configuração
    // #####################################################################################################################
    
    async buildExtractionFiles() {
        await FileUtils.makeDir("extraction/contents"); // cria o diretório dos arquivos dos conteudos
        await FileUtils.makeFile('',this._contentsFileName); // cria o arquivo dos links
        await this.buildConfig(); // cria o arquivo de configuração do scrapping
    }

    /** Esta função cria o arquivo de configuração, caso ainda não tenha sido criado */
    async buildConfig() {
        // verifica se o arquivo de configuração já foi criado antes  
        let oldConfigFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(oldConfigFile!=null){
            console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' já existe!`);
            return;
        }
        const lastLink = (await FileUtils.readFileAsArray(this._linksListName)).length;
        let configFile = {
            link:1, // numero do link atual do qual serão obtidas as imagens
            lastLink,// numero da ultimo link
        }
        await FileUtils.makeFile('',this._configFileName); // cria o arquivo de configuração
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' atualizado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }

    async addLinkNumber(){
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['link']++;
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' atualizado com sucesso!`);
        else console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }

    async getActualLink(){
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        return configFile['link'];
    }

    async getLastLink(){
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        return configFile['lastLink'];
    }

     // #####################################################################################################################
    // Métodos de EXTRAÇÃO DE DADOS
    // #####################################################################################################################

    async extractContent(url){
        const browser = await puppeteer.launch(); // inicializa o navegador
        const page = await browser.newPage(); // cria uma nova página
        let success;
        let linkList = [];
        do{
            success = true;
            try {
                await page.goto(url); // carrega a página de resultados
                await page.evaluate(() => {window.scrollBy(0, window.innerHeight);}); // simulando uma interação humana de scroll

                const mainElementHandle = await page.$('main[role="main"]');
                const jsonObject =  await page.evaluate(mainElement => {
                    let elements =  mainElement.children;
                    let jsonData={title:'',content:'',thumb:'',}
                    let data='';
                    for (let i = 0; i < elements.length; i++) {
                        element = elements[i];
                        
                        data+=element.tagName;
                    };
                    return data;
                  }, mainElementHandle);
                  console.log(jsonObject);
                  
            } catch (error) {
                success = false;
            }
        }while(success===false);
        await page.close();
        await browser.close();
        return linkList;
    }

}module.exports = ExtractContents;