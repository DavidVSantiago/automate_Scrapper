const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const FileUtils = require('./file_utils');
const { link } = require('fs');

class DownloadPages{
    constructor(term,url){
        this._term=term;
        this._url = url;
        this._dirName = `categories/${this._term}`; // define o diretório de trabalho para o termo
        this._configFileName = `${this._dirName}/config.cfg`; // define o caminho do arquivo de configurações
        this._file_utils = new FileUtils(); // para salvamento das páginas em arquivo
        this._videoLinks_extraction_selector = '#videoSearchResult .pcVideoListItem .phimage a'; // seletor que extrai os links da página de resultados
    }
    
    /** Começa o processo de baixar as páginas */
    async startProcess(){
        await this._file_utils.makeDir(this._dirName); // cria o diretório de trabalho
        await this.buildConfig(); // constrói o arquivo de configuração

        console.log(`\n   LOG-> Iniciando o processo de download das páginas para o termo '${this._term}':`);
    
        while(await this.hasNextPage()){ // enquanto o arquivo de configuração indicar a existência de novas páginas de pesquisa para o termo
            await this.downloadNextPage(); // baixa a próxima página
        }

        
        // processo de obtenção de da página de pesquisa
     
        // let htmlPage = await this.getHtmlPage(this._url);
        // await this._file_utils.writeToFile(htmlPage, `${dirName}/search-results.html`);
    }

    /** Esta função cria o arquivo de configuração, caso ainda não tenha sido criado */
    async buildConfig() {
        // verifica se o arquivo de configuração já foi criado antes  
        let oldConfigFile = await this._file_utils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(oldConfigFile!=null){
            console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' já existe!`);
            return;
        }
        let configFile = {
            page:1, // numero da página
            step:1, // 1 - ainda não baixou nada, 2 - baixou página de reusltados, 3 - baixou todas as páginas de video
            finishPages: false, // false - faltam páginas, true - terminou a ultima página
            finishAll: false, // false - não terminou o trabalho de pesquisa do termo, true - terminou o trabalho de pesquisa do termo
        }
        let result = await this._file_utils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }

    /** Verifica se existem novas páginas a serem baixadas */
    async hasNextPage() {
        let configFile = await this._file_utils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(configFile===null || configFile['finishPages']===true ) return false;
        return true;
    }

    /** baixa a próxima página de resultados de busca */
    async downloadNextPage() {
        let configFile = await this._file_utils.readJsonFileAsObject(this._configFileName); // começa obtendo os dados de configuração do processo de download
        if(configFile['step']===1){ // checa se a página de resultados ainda não foi baixada 
            console.log(`\n   LOG-> Baixando a página de resultados para a pagina '${configFile['page']}':`);
            await this.downloadResultsPage(configFile['page']); // baixa a página de resultados
        }

        let linkList = await this.getVideoLinks(); // obtém as os links de cada uma das paginas de video

        configFile = await this._file_utils.readJsonFileAsObject(this._configFileName); // lê novamento as configurações (possiveis alterações desde a ultima leitura)
        if(configFile['step']===2){ // checa se as páginas de video ainda não foram baixadas 
            console.log(`\n   LOG-> Começando o processo de baixar as páginas de video para a página '${configFile['page']}':`);
            await this.downloadVideosPage(linkList,configFile['page']); // baixa cada um dos videos, a partir da página de resultados
        }
        
        await this.changePageConfig(); // após terminar todas as paginas de video, sinaliza a mudança de página
    }

    /** procedimentos para baixar a página de resultados */
    async downloadResultsPage(page) {
        let url = this._url; // uma cópia da url original, para possivelmente modificá-la

        if(page!=1)url+=`&page=${page}`; // adiciona a querystring para as páginas 2 em diante
        
        let htmlPage;
        do{ // se o resultado do html estiver vazio, repete o procedimento
            htmlPage = await this.getHtmlPage(url); // tenta fazer o download da página
            if(htmlPage==='') console.error(`\n   LOG-> Erro ao baixar a página de resultados. Tentando novamente...`);
        }while(htmlPage==='');
        
        await this._file_utils.makeDir(`${this._dirName}/page_${page}`) // cria o diretório da página
        
        let successSave;
        do{ // tenta salvar a página html no arquivo
            successSave = await this._file_utils.writeToFile(htmlPage,`${this._dirName}/page_${page}/search_result.html`); // salva a página html
            if(successSave) console.log(`   LOG-> Página criada com sucesso em ${this._dirName}/page_${page}/search_result.html`); // mensa
            else console.error(`   LOG-> Erro ao criar ${this._dirName}/page_${page}/search_result.html. Tentando novamente...`);
        }while(!successSave);
        await this.changeStepConfig(2); // sinaliza que a página de resultados já foi baixada
    }
    
    /** baixa e retorna o código html de uma página pela url */
    async getHtmlPage(url){
        try{
            const browser = await puppeteer.launch(); // inicializa o navegador
            const page = await browser.newPage(); // cria uma nova página
            await page.goto(url); // carrega a página de resultados
            const pageHtml = await page.content();
            return pageHtml;
        }catch (err) {return ''}
    }

    /** Incrementa o parâmetro 'step' para o valor 2*/
    async changeStepConfig(value) {
        let configFile = await this._file_utils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['step']=value; // marca para realização da "obtenção das metatags"
        
        let successSave;
        do{
            successSave = await this._file_utils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração 
            if(!successSave) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${_configFileName}'. Tentando novamente...`);
        }while(!successSave);
    }

    /** Obtém a lista dos links das páginas de video, a partir da página de resultados */
    async getVideoLinks(){
        let configFile = await this._file_utils.readJsonFileAsObject(this._configFileName); // começa obtendo os dados de configuração do processo de download
        let htmlPage = await this._file_utils.readFile(`${this._dirName}/page_${configFile['page']}/search_result.html`); // carrega a página para fazer a raspagem
        // inicia o processo de raspagem dos dados das páginas que possuem as metatags
        let $ = cheerio.load(htmlPage);
        let aList = $(this._videoLinks_extraction_selector); // seletor de extração da lista de links
        let linkList = [];
        aList.each((i, a) => {
            const link = $(a).attr('href');
            // const regex = /viewkey=([^&]+)/;
            // const match = link.match(regex);
            // const code = (match)?match[1]:'';
            // const title = $(a).attr('data-title');
            // const thumb = $(a).find('img').attr('src');
            // const mediabook = $(a).find('img').attr('data-mediabook');
            // const metaTags = '';
            // let jsonObj = {link,code,title,thumb,mediabook,metaTags}
            linkList.push(`https://pt.pornhub.com${link}`);
        });
        return linkList;
    }

    /** procedimentos para baixar as páginas de vídeo */
    async downloadVideosPage(linkList,page){
        // TODO criar workers e submeter cada link para um worker diferente;

        for(let i=0;i<linkList.length;i++){ // itera sobre cada um dos links, para baixar cada uma das páginas
            console.log(`\n   LOG-> Baixando a página do vídeo '${i+1}'...`);
            let htmlPage;
            do{ // se o resultado do html estiver vazio, repete o procedimento
                htmlPage = await this.getHtmlPage(linkList[i+1]); // tenta fazer o download de cada uma das páginas de video
                if(htmlPage==='') console.error(`\n   LOG-> Erro ao baixar a página '${i+1}'. Tentando novamente...`);
            }while(htmlPage==='');

            let successSave;
            do{ // tenta salvar a página html no arquivo
                
                successSave = await this._file_utils.writeToFile(htmlPage,`${this._dirName}/page_${page}/video_${i+1}.html`); // salva a página html
                if(successSave) console.log(`   LOG-> Página criada com sucesso em ${this._dirName}/page_${page}/video_${i+1}.html`); // mensagem
                else console.error(`   LOG-> Erro ao criar ${this._dirName}/page_${page}/video_${i+1}.html. Tentando novamente...`);
            }while(!successSave);
            await this.changeStepConfig(3); // sinaliza que a todas as páginas de video já foram baixadas
        }
    }

    /** Incrementa o parâmetro 'page' para o próximo valor*/
    async changePageConfig() {
        let configFile = await this._file_utils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(configFile['finishPages']===true) return; // se não houver mais páginas, abandona o processo
        configFile['page']++; // incrementa o sinalizador de página
        configFile['step']=1; // ao muda de página, tem que reiniciar o sinalizador de passo
        let result = await this._file_utils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração
        if(!result) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }
}
module.exports = DownloadPages;