const puppeteer = require('puppeteer');
const { Client, LocalAuth } = require('whatsapp-web.js');
const Utils = require('../utils/utils.js');
const FileUtils = require('../utils/file_utils.js');


class CommentsWhatsApp{
    constructor(){
        this._msg_01="Olá, colega! Paz do senhor!\nSou seu amigo do grupo religioso.";
        this._msg_02="Peço, humildemente, que compartilhe esta matéria com TODOS OS SEUS CONTATOS.\nVamos ajudar o Bebê Rodriguinho.\n\nImagine o desespero de uma família ao descobrir que seu bebê precisa de uma cirurgia cardíaca complexa e cara fora do país?  Essa é a realidade de Rodriguinho, uma criança que precisa da nossa ajuda para viver.\n\nFaça essa corrente de fé prosperar! COMPARTILHE COM O MÁXIMO DE PESSOAS QUE PUDER.\n\nSe sentir no coração de doar, no final da matéria tem o link da vakinha. Mas saiba que só o ato de você compartilhar com todos os seus contatos já é uma enorme ajuda.\n\nQue Deus te ilumine e toda a sua família!\n\nhttps://newsbrasil.org/bebe-rodriguinho-com-problema-cardiaco-busca-ajuda-para-tratamento/";
        this._numbersList = []; // lista de numeros para enviar
        this._configFileName='modules/whatsapp/config.cfg';
        this._client = new Client({
            authStrategy: new LocalAuth(),
            // proxyAuthentication: { username: 'username', password: 'password' },
            puppeteer: { 
                // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
                headless: false,
            }
        });
    }

    async start(){
        await this.buildConfigFile();
        this._numbersList = await this.clearNumbers(await FileUtils.readFileAsArray('contact_list.txt'));// carrega a lista de numero de telefone
        // this._numbersList.push('5511287784119');
        // this._numbersList.push('5571987784119');
        // this._numbersList.push('5571987784119');


        this._client.on('qr', (qr) => {
            // Generate and scan this code with your phone
            console.log('QR RECEIVED', qr);
        });
        
        this._client.on('ready', async () => {
            let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
            let actual = configFile['contact'];
            for(let i=actual-1; i<this._numbersList.length; i++){
                try {
                    await this.sendMessages(this._numbersList[i]);
                    await this.changeContactConfig();
                } catch (error) {}
                Utils.sleep(1000);
            }
        });
        
        this._client.on('message', msg => {
            if (msg.body == '!ping') {
                msg.reply('pong');
            }
        });
        
        this._client.initialize();
        
        await Utils.sleep(300); // espera um pouco
    }

    async sendMessages(phoneNumber) {
        try {
            await this.sendMessage(phoneNumber, this._msg_01);
            await this.sendMessage(phoneNumber, this._msg_02);
        } catch (error) {}
    }

    // Função para enviar uma mensagem
    async sendMessage(to, message) {
        try {
            const number_details = await this._client.getNumberId(to); // get mobile number details
            if (number_details) {
                await this._client.sendMessage(number_details._serialized, message); // send message
            } else {
                console.log(final_number, "Mobile number is not registered");
            }
            console.log("Mensagem enviada com sucesso para: "+to);
        } catch (error) {
            console.log("Erro ao enviar mensagem para: "+to);
        }
    }

    async clearNumbers(numbersList){
        return numbersList.map(numero => numero.replace(/\D/g, '')); // remove todos os caracteres não digitos
    }

    async buildConfigFile() {
        // verifica se o arquivo de configuração já foi criado antes  
        let oldConfigFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        if(oldConfigFile!=null){
            console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' já existe!`);
            return;
        }
        let configFile = {
            contact:1, // numero do contato atual
            last: 1671, // false - não terminou o trabalho, true - terminou o trabalho de baixar todas as páginas
        }
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${this._configFileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${this._configFileName}'`);
    }
    async changeContactConfig() {
        let configFile = await FileUtils.readJsonFileAsObject(this._configFileName); // lê o arquivo de configuração
        configFile['contact']++; // incrementa o sinalizador de contato
        let result = await FileUtils.writeJsonToFile(configFile,this._configFileName); // atualiza o arquivo de configuração
        if(!result) console.error(`   LOG-> Erro ao atualizar o arquivo de configuração '${this._configFileName}'`);
    }
}
module.exports = CommentsWhatsApp;
