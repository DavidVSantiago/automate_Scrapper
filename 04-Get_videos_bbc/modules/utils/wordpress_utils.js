const FileUtils = require('./file_utils');
const Utils = require('./utils');
const WPAPI = require('wpapi');
const axios = require('axios');

class WordpressUtils {
    constructor() { }

    /** Upload de posts em massa */
    static async bulkUploadPosts(filename,lang){
        const dataList = await FileUtils.readJsonFileAsArray(filename); // carrega a lista de dados dos posts
        console.log(`\n   LOG-> Iniciando o processo de inserção dos posts, para um total de ${dataList.length} posts...`);

        // percorre os dados
        for(let i=0;i<dataList.length;i++){
           await this.uploadPost(dataList[i],lang);
           await Utils.sleep(150);
        }
        console.log(`\n   LOG-> Finalizando o processo de inserção dos posts...`);
    }

    /** Upload de posts em massa */
    static async uploadPost(data,lang){
         // prepara os dados de autenticação com a servidor da rest API
         const url = 'http://localhost/gosex.top/wp-json/api/add_post';
         // const url = 'https://gosex.top/wp-json/api/add_post';
         const username = 'david.valente.santiago@gmail.com';
         const password = '&*EeH$$$&S23JE@qtXxhT394O!00o%@#fTz4YM@%';
         const auth = Buffer.from(username + ':' + password).toString('base64'); // autenticação com a api rest

        // prepara os dados para a inserção do post
        let title=data['title'];
        let code=data['code'];
        let link=data['link'];
        let thumb=data['thumb'];
        let mediabook=data['mediabook'];
        let metaTags=data['metaTags'];
        const postData = {title,code,link,thumb,mediabook,metaTags,lang};

        // inserindo post via rest API
        axios.post(url, postData,{ // execução do request
            headers: {
                'Authorization': 'Basic ' + auth // dados para autenticação
            }
        })
        .then(response => {
            console.log('Resposta da API:', response.data);
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        });
    }
}
module.exports = WordpressUtils;