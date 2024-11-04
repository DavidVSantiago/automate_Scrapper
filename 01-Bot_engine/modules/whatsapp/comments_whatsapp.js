const puppeteer = require('puppeteer');
const { Client, LocalAuth } = require('whatsapp-web.js');
const Utils = require('../utils/utils.js');
const FileUtils = require('../utils/file_utils.js');


class CommentsWhatsApp{
    constructor(){
        //this._number="5571987784119";
        this._numbersList = []; // lista de numeros para enviar
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
        this._numbersList = [];//await this.clearNumbers(await FileUtils.readFileAsArray('contact_list.txt'));// carrega a lista de numero de telefone
        this._numbersList.push(5571987784119);

        this._client.on('qr', (qr) => {
            // Generate and scan this code with your phone
            console.log('QR RECEIVED', qr);
        });
        
        this._client.on('ready', async () => {
            for(let i=0; i<this._numbersList.length; i++){
                await this.sendMessages(this._numbersList[i]);
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
        await this.sendMessage(''+phoneNumber, "Test almir");
    }

    // Função para enviar uma mensagem
    async sendMessage(to, message) {
        const number_details = await this._client.getNumberId(to); // get mobile number details
        if (number_details) {
            await this._client.sendMessage(number_details._serialized, message); // send message
        } else {
            console.log(final_number, "Mobile number is not registered");
        }
    }

    async clearNumbers(numbersList){
        return numbersList.map(numero => numero.replace(/\D/g, '')); // remove todos os caracteres não digitos
    }
}
module.exports = CommentsWhatsApp;
