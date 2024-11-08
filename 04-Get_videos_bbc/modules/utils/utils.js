const puppeteer = require('puppeteer');

class Utils {
    constructor() { }

    static sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms));}
    
    static ArrayToTextLine(array) {return array.join('\n') + '\n';}

    static async AiRewrite(oldText,timeMilis){
        const browser = await puppeteer.launch(); // inicializa o navegador
        const page = await browser.newPage(); // cria uma nova página
        let success;
        let newText=oldText;
        do{
            success = true;
            try {
                await page.goto('https://quillbot.com/pt/reescrever-texto'); // carrega a página de resultados
                await page.evaluate(() => {window.scrollBy(0, window.innerHeight);}); // simulando uma interação humana de scroll

                await Utils.sleep(1000); // espera um pouco

                /** Clica no got it */
                let gotIt = await page.$('button.css-kjx6gh > span.css-ork8mx');
                if(gotIt) await gotIt.click();
                
                await Utils.sleep(500); // espera um pouco
        
                const input = await page.$('[data-testid="editable-content-within-article"]');
                await input.type(oldText); // escreve o texto a ser reescrito
        
                await Utils.sleep(500); // espera um pouco
        
                /** Clica no botão para reescrever o texto */
                let startBtn;
                do{
                    startBtn = await page.$('[data-testid="pphr/input_footer/paraphrase_button"]:last-child');
                    console.log("Esperando start");
                    await Utils.sleep(500); // espera um pouco
                }while(!startBtn); // espera o botão ficar disponível para ser clicado
                await startBtn.click(); // clica no botão
        
                /** faz um teste, para saber se a resposta já foi reescrita */
                const output = await page.$('#paraphraser-output-box'); // obtém o elemento onde o texto foi reescrito
                while(true){
                    let testText = await page.evaluate(element => { // captura o texto reescrito
                        return element.textContent.trim();
                    }, output);
                    if (testText !== '') break;
                    console.log("Resposta ainda não chegou!!");
                    await Utils.sleep(500); // espera um pouco
                }

                await Utils.sleep(timeMilis); // espera o tempo determinado para a reescrita
        
                newText = await page.evaluate(() => {
                    const element = document.querySelector('#paraphraser-output-box');
                    return element.textContent;
                });
                if(newText==oldText) success = false;
                
            } catch (error) {success = false;}
        }while(success===false);
        await page.close();
        await browser.close();
        return newText;
    }
}
module.exports = Utils;