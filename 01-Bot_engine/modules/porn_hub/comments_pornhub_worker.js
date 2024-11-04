const puppeteer = require('puppeteer');
const { workerData } = require('worker_threads');
const FileUtils = require('../utils/file_utils.js');
const Utils = require('../utils/utils.js');
const { log } = require('console');
const _url="https://pt.pornhub.com/";

(async () => {
    const page = await logar(); // obtem a página logada
    await comentar(page);
    
    // Envia uma mensagem de volta para a thread principal
    // parentPort.postMessage('Hello from the worker!');
})();


async function logar(){
    let successFlag = true;
    const browser = await puppeteer.launch({ headless: true }); // inicializa o navegador
    this.__browser = browser;
    const page = await browser.newPage(); // cria uma nova página
    
    do{ // inicia o processo de tentar logar
        try {
            console.log(`Worker${workerData.index} -> Tentando logar...`);
            await page.goto(_url); // carrega a página
            await page.evaluate(() => { // simulando uma interação humana de scroll
                window.scrollBy(0, window.innerHeight);
            });
            

            /** Clica no botão de 'tenho mais de 18 anos' */
            await page.waitForSelector('#modalWrapMTubes > div > div > button'); // garante a disponibilidade do componente
            await page.click('#modalWrapMTubes > div > div > button'); // clica no componente
            
            await Utils.sleep(300); // espera um pouco

            /** clica no botao de login */
            await page.waitForSelector('.signIn'); // garante a disponibilidade do componente
            await page.click('.signIn'); // clica no componente

            await Utils.sleep(300); // espera um pouco

            /** clica no botao de entrar */
            await page.waitForSelector('a.topMenuButtons:nth-child(2)'); // garante a disponibilidade do componente
            await page.click('a.topMenuButtons:nth-child(2)'); // clica no componente

            await Utils.sleep(300); // espera um pouco

            /** insere os dados do user */
            await page.waitForSelector('#usernameModal'); // garante a disponibilidade do componente
            await page.type('#usernameModal', workerData.login); // preenche o campo

            await Utils.sleep(300); // espera um pouco

            /** insere a senha */
            await page.waitForSelector('#passwordModal'); // garante a disponibilidade do componente
            await page.type('#passwordModal', workerData.senha); // preenche o campo


            /** clica no botao de logar */
            await page.waitForSelector('#signinSubmit'); // garante a disponibilidade do componente
            await page.click('#signinSubmit'); // clica no componente
            
            await page.waitForNavigation();

            console.log(`Worker${workerData.index} -> Logado com sucesso!`);
            return page;

        } catch (error) {
            successFlag=false;
            console.log(`Worker[${workerData.index}] -> Erro na tentativa de logar`);
            await Utils.sleep(1000); // espera um pouco
        }
    }while(successFlag===false); // repete a tentativa de login, caso haja alguma falha
}

async function comentar(page){   
   
    console.log(`Worker${workerData.index} -> *************************************************`);
    console.log(`Worker${workerData.index} -> Iniciando o processo de comentário das páginas...`);
    console.log(`Worker${workerData.index} -> *************************************************`);
    const dataList = await FileUtils.readJsonFileAsArray(`extracted/consolidated/part_${workerData.index}/data.json`); // lê os dados de cada pedaço separado
    const configFile = await FileUtils.readJsonFileAsObject(`extracted/consolidated/part_${workerData.index}/config.cfg`);
    const lastIndex = configFile.lastIndex;
    const actualIndex = configFile.actualIndex;
    if(actualIndex===lastIndex) {
        console.log(`Worker${workerData.index} -> Todos os comentários já foram realizados!...`);
        return;
    }
    for(let i=actualIndex;i<=lastIndex;i++){ // percorre a lista de dados lidos do arquivo
        // console.log(`Worker${workerData.index} -> Comentando página ${i+1}`);
        await comentarPagina(page,dataList[i],i);
        configFile.actualIndex = i;
        await FileUtils.writeJsonToFile(configFile,`extracted/consolidated/part_${workerData.index}/config.cfg`); // atualizando o arquivo de configuração
        await Utils.sleep(1000); // espera um pouco
    }
    console.log(`Worker${workerData.index} -> *************************************************`);
    console.log(`Worker${workerData.index} -> Finalizando o processo de comentário das páginas...`);
    console.log(`Worker${workerData.index} -> *************************************************`);
}

/** Comenta cada uma das páginas */
async function comentarPagina(page, data, index){  
    let successFlag;
    do{ // inicia o processo de tentar comentar
        try {
            successFlag = true;
            console.log(`Worker${workerData.index} -> Comentando ${index+1}ª página...`);

            await page.goto(data.link); // acessa a página que será comentada

            await Utils.sleep(300); // espera um pouco

            // Verifica se a página é valida
            const elem = await page.$('#vpContentContainer');
            if(!elem) {
                console.log('Página inexistente');
                return;
            }

            /** preenche a caixa com o comentário */
            await page.waitForSelector('.js_taggable'); // garante a disponibilidade do componente
            await page.click('.js_taggable'); // clica no componente
            await page.type('.js_taggable',data.comment); // preenche o campo

            await Utils.sleep(300); // espera um pouco

                /** clica no botão de comentar */
            await page.waitForSelector('.cmtSubmit'); // garante a disponibilidade do componente
            await page.click('.js_taggable'); // clica no componente
            await Utils.sleep(300); // espera um pouco
            await page.click('.cmtSubmit'); // clica no componente


        } catch (error) {
            successFlag=false;
            console.log(`Worker[${workerData.index}] -> Erro na tentativa de comentar. Tentando novamente...`);
            await Utils.sleep(1000); // espera um pouco
        }
    }while(successFlag===false); // repete a tentativa de comentar, caso haja alguma falha

    console.log(`Worker${workerData.index} -> ${index+1}ª página comentada com sucesso!`);
}