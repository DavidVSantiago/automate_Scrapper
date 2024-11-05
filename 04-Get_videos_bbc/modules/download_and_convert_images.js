const axios = require('axios');
const Utils = require('./utils/utils');
const FileUtils = require('./utils/file_utils');
const path = require('path');
const sharp = require('sharp');
const puppeteer = require('puppeteer');

class DownloadAndConvertImages{
    constructor(categoria){
        this._linksListName = `extraction/links/${categoria}.txt`;
        this._imgsDirName = `extraction/imgs/${categoria}/`;
        this._configFileName = 'modules/download_and_convert_images.cfg';
    }

    async start(){
        await this.buildExtractionFiles(); // cria os arquivos e diretórios da extração

        let linksList = await FileUtils.readFileAsArray(this._linksListName); // obtém a lista de links

        /** Loop de navegação nas páginas de extração dos dados */
        console.log(`   LOG-> INICIANDO O PROCESSO DE EXTRAÇÃO DOS LINKS...`);
        const actualLink = await this.getActualLink();
        const lastLink = await this.getLastLink();
        for(let i=actualLink; i<=lastLink; i++){ // navega em cada um dos links
            console.log(`   LOG-> extraindo as imagens da página ${i} para a categoria: ${this._categoria}...`);
            const link = linksList[i-1]; // obtém o link de cada página, a partir da lista de links
            const imgLinkList = await this.extractImageLinks(link); // faz o scrapping e extrai os links das imagens de cada página
            await this.downloadImages(imgLinkList); // envia a lista de links das imagens e faz o download de cada uma delas
            await this.addLinkNumber(); // incrementa o marcador de link atual no arquivo de configuração
        }
    }

    // #####################################################################################################################
    // Métodos do arquivo de configuração
    // #####################################################################################################################

    async buildExtractionFiles() {
        await FileUtils.makeDir(this._imgsDirName); // cria o diretório das imagens a serem baixadas
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

    async extractImageLinks(url){
        const browser = await puppeteer.launch(); // inicializa o navegador
        const page = await browser.newPage(); // cria uma nova página
        let success;
        let linkList = [];
        do{
            success = true;
            try {
                await page.goto(url); // carrega a página de resultados
                await page.evaluate(() => {window.scrollBy(0, window.innerHeight);}); // simulando uma interação humana de scroll

                linkList = await page.$$eval('main[role="main"] figure img', (anchors) => {
                    return anchors.map(anchor => anchor.src);
                });
                
            } catch (error) {
                success = false;
            }
        }while(success===false);
        await page.close();
        await browser.close();
        return linkList;
    }

    async downloadImages(imgLinkList){

        for(let i=0; i<imgLinkList.length; i++){ // percorre cada um dos links da imagem
            imgLink = imgLinkList[i]; // captura cada link

            /** extrai o nome da imagem */
            const regex = /\/([^/]+)\.\w+$/;
            const match = imgLink.match(regex);
            const imgName = match[1];
            const imgExt = path.extname(imgLink);

            /** baixa a imagem */
            const response = await axios.get(imgLink, { responseType: 'arraybuffer' });


        }
        // dataList = dataList.map(data=>data['imgLink']); // transforma o array de objetos em array de links das imagens
        // /** Extrai os nomes da imagem */
        // let dataNames = dataList.map(data=>{
        //     const regex = /\/([^/]+)\.\w+$/;
        //     const match = data.match(regex);
        //     return match[1];
        // }) 
        // /** Extrai a extensão das imagens */
        // let dataExt = dataList.map(data=> path.extname(data));
        
        // for(let i=0;i<dataList.length;i++){
        //     try {
        //         const response = await axios.get(dataList[i], { responseType: 'arraybuffer' });
        //         //fs.writeFileSync(`extraction/imgs/${dataNames[i]}${dataExt[i]}`, response.data);
        //         console.log(`Imagem baixada com sucesso: ${dataNames[i]}`);
        //         /** Converte para webp */
        //         await sharp(response.data)
        //             .webp({ quality: 50 })
        //             .toFile(`extraction/imgs/${dataNames[i]}.webp`)
        //             .then(() => {
        //                 console.log('Imagem convertida com sucesso!');
        //         })
        //         .catch(err => {
        //             console.error('Erro ao converter a imagem:', err);
        //         });
                
        //     } catch (error) {
        //         console.error(`Erro ao baixar a imagem ${dataNames[i]}:`, error);
        //     }
        //     await Utils.sleep(2000); // espera um pouco!
        // };
    }

}module.exports = DownloadAndConvertImages;