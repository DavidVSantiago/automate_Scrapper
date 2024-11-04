const natural = require('natural');
const FileUtils = require('./utils/file_utils');
const Utils = require('./utils/utils');
const { log } = require('console');
const puppeteer = require('puppeteer');

class IARewrite{
    constructor(){
        this._inputFileName = `extraction/data.json`;
    }

    async start(){
        let dataList = await FileUtils.readJsonFileAsArray(this._inputFileName); // obtem a lista de dados brutos
        const titleList = await dataList.map(data=>data['title']); // lista de títulos
        const contentList = await dataList.map(data=>data['contentText']); // lista de conteudos
        
        // await this.rewriteTitle(titleList); // Reescreve o título
        await this.rewriteContent(contentList); // Reescreve cada o conteúdo
    }

    async rewriteTitle(titleList){
        await FileUtils.writeToFile('[]','extraction/rewrite_titles.json'); // cria o arquivo dos dados dos títulos reescritos

        const url = 'https://quillbot.com/pt/reescrever-texto';
        const browser = await puppeteer.launch({headless:false});
        const page = await browser.newPage();
        for(let i=0;i<titleList.length;i++){
            const textBefore = titleList[i];
            await page.goto(url); // operação demorada
            const textAfter = await this.rewrite(textBefore,page,3000);
            
            // salva o novo texto no arquivo
            await FileUtils.appendObjToJsonArrayFile({title:textAfter},'extraction/rewrite_titles.json');
        }
        await page.close();
        await browser.close();
    }

    async rewriteContent(contentList){
        await FileUtils.writeToFile('[]','extraction/rewrite_contents.json'); // cria o arquivo dos dados dos conteúdos reescritos
        
        const url = 'https://quillbot.com/pt/reescrever-texto';
        const browser = await puppeteer.launch({headless:false});
        const page = await browser.newPage();
        for(let i=0;i<contentList.length;i++){ // percorre cada texto
            const content = contentList[i];

            // identifica a quantidade de parágrafos delimitados por [p] [/p] e os separa me um array de paragrafos
            const regex = /\[p\](.*?)\[\/p\]/g;
            const paragrafos = content.match(regex).map(paragrafo => paragrafo.replace(/\[\/?p\]/g, '')); // remove as marcações [p] [/p] de cada paragrafo
            
            let newParagrafos = [];
            for(let i=0;i<paragrafos.length;i++){ // percorre cada paragrafo
                const textBefore = paragrafos[i];
                await page.goto(url); // operação demorada
                const textAfter = await this.rewrite(textBefore,page,6000);
                // log('Antes: '+textBefore);
                // log('Depois: '+textAfter);
                newParagrafos.push(textAfter);
            }
            // concatena todos os parágrafos de volta, colocando as marcações [p] [/p]
            let newContent ='';
            newParagrafos.forEach(paragrafo => newContent+=`[p]${paragrafo}[/p]`);
            await FileUtils.appendObjToJsonArrayFile({content:newContent},'extraction/rewrite_contents.json');
        }
        await page.close();
        await browser.close();
    }

    async rewrite(inputText, page, timeMilis){
        
        await Utils.sleep(1000); // espera um pouco

        /** Clica no got it */
        let gotIt = await page.$('button.css-kjx6gh > span.css-ork8mx');
        if(gotIt)
            await gotIt.click();
        
        await Utils.sleep(500); // espera um pouco

        const input = await page.$('[data-testid="editable-content-within-article"]');
        await input.type(inputText);


        await Utils.sleep(500); // espera um pouco

        /** Clica no botão de fazer texto */
        let startBtn;
        do{
            startBtn = await page.$('[data-testid="pphr/input_footer/paraphrase_button"]:last-child');
            console.log("Esperando start");
            await Utils.sleep(500); // espera um pouco
        }while(!startBtn);
        await startBtn.click();

        await Utils.sleep(timeMilis); // espera um pouco

        const output = await page.$('#paraphraser-output-box');
        while(true){
            const textContent = await page.evaluate(element => {
                return element.textContent.trim();
            }, output);
            if (textContent !== '') break;
            console.log("Resposta ainda não chegou!!");
            await Utils.sleep(500); // espera um pouco
        }

        const outputText = await page.evaluate(() => {
            const element = document.querySelector('#paraphraser-output-box');
            return element.textContent;
        });

        return outputText;
    }

}module.exports = IARewrite;