const FileUtils = require('./utils/file_utils');
const puppeteer = require('puppeteer');
const Utils = require('./utils/utils');

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
            let jsonData = await this.extractContent(link); // faz o scrapping e extrai de todo o conteúdo da página
            jsonData = await this.formatContent(jsonData); // formata o conteúdo extraído
            await FileUtils.appendObjToJsonArrayFile(jsonData,this._contentsFileName);
            console.log(jsonData);
            await this.addLinkNumber(); // incrementa o marcador de link atual no arquivo de configuração
        }
    }

    // #####################################################################################################################
    // Métodos do arquivo de configuração
    // #####################################################################################################################
    
    async buildExtractionFiles() {
        await FileUtils.makeDir("extraction/contents"); // cria o diretório dos arquivos dos conteudos
        await FileUtils.makeFile('[]',this._contentsFileName); // cria o arquivo dos links
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
        let configFile = await FileUtils.readJsonFile(this._configFileName); // lê o arquivo de configuração
        configFile['link']++;
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' atualizado com sucesso!`);
        else console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }

    async getActualLink(){
        let configFile = await FileUtils.readJsonFile(this._configFileName); // lê o arquivo de configuração
        return configFile['link'];
    }

    async getLastLink(){
        let configFile = await FileUtils.readJsonFile(this._configFileName); // lê o arquivo de configuração
        return configFile['lastLink'];
    }

    // #####################################################################################################################
    // Métodos de EXTRAÇÃO DE DADOS
    // #####################################################################################################################

    async extractContent(url){
        const browser = await puppeteer.launch(); // inicializa o navegador
        const page = await browser.newPage(); // cria uma nova página
        let success;
        let jsonData = null;
        do{
            success = true;
            try {
                await page.goto(url); // carrega a página de resultados
                await page.evaluate(() => {window.scrollBy(0, window.innerHeight);}); // simulando uma interação humana de scroll

                const divsHandler = await page.$$('main[role="main"] div');
                const figuresHandler = await page.$$('main[role="main"] figure');
                const title = await divsHandler[0].evaluate(div => div.textContent);
                const thumb = await figuresHandler[0].evaluate(figure => figure.querySelector('img').src);
                const allHandler = await page.$$('main[role="main"]>*');
                let content = '';
                let excerpt = await allHandler[3].evaluate(elem => elem.firstChild.textContent);
                for(let i=2; i<allHandler.length; i++){ // percorre cada elemento do texto
                    let elem = allHandler[i];
                    let elemText = await elem.evaluate(elem => {
                        if(elem.tagName.toLowerCase()==='div'){
                            if(elem.firstChild.tagName.toLowerCase()==='h2') return `[h2]${elem.firstChild.textContent}[/h2]`;
                            if(elem.firstChild.tagName.toLowerCase()==='p') return `[p]${elem.firstChild.textContent}[/p]`;
                        }else if(elem.tagName.toLowerCase()==='figure'){
                            return `[img]${elem.querySelector('img').src}[/img]`;
                        }
                        return null;
                    });
                    if(elemText!==null) content+=elemText+'\n';
                }
                jsonData={title,thumb,content,excerpt,category:this._categoria}; // cria o objeto json que representa o artigo
            } catch (error) {
                success = false;
            }
        }while(success===false);
        await page.close();
        await browser.close();
        return jsonData;
    }

    // #####################################################################################################################
    // Métodos de FORMATAÇÃO DE DADOS
    // #####################################################################################################################

    async formatContent(jsonData){
        // altera o link para a imagem
        jsonData['thumb'] = this._categoria+'/'+(jsonData['thumb'].match(/\/([^/]+)\.\w+$/))[1]+'.webp'; // substitui o nome da imagem com expressão regular
        // modifica o titulo do artigo com IA
        jsonData['title'] = await Utils.AiRewrite(jsonData['title'],3000);
        return jsonData;
    }


}module.exports = ExtractContents;