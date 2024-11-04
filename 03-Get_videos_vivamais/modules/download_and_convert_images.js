const axios = require('axios');
const Utils = require('./utils/utils');
const FileUtils = require('./utils/file_utils');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { log } = require('console');
const sharp = require('sharp');

class DownloadAndConvertImages{
    constructor(){
        this._inputFileName = `extraction/data.json`;
    }

    async start(){
        await FileUtils.makeDir("extraction/imgs/"); // cria o diretório da extração
        let dataList = await FileUtils.readJsonFileAsArray(this._inputFileName); // obtem a lista de dados brutos
        dataList = dataList.map(data=>data['imgLink']); // transforma o array de objetos em array de links das imagens
        /** Extrai os nomes da imagem */
        let dataNames = dataList.map(data=>{
            const regex = /\/([^/]+)\.\w+$/;
            const match = data.match(regex);
            return match[1];
        }) 
        /** Extrai a extensão das imagens */
        let dataExt = dataList.map(data=> path.extname(data));
        
        for(let i=0;i<dataList.length;i++){
            try {
                const response = await axios.get(dataList[i], { responseType: 'arraybuffer' });
                //fs.writeFileSync(`extraction/imgs/${dataNames[i]}${dataExt[i]}`, response.data);
                console.log(`Imagem baixada com sucesso: ${dataNames[i]}`);
                /** Converte para webp */
                await sharp(response.data)
                    .webp({ quality: 50 })
                    .toFile(`extraction/imgs/${dataNames[i]}.webp`)
                    .then(() => {
                        console.log('Imagem convertida com sucesso!');
                })
                .catch(err => {
                    console.error('Erro ao converter a imagem:', err);
                });
                
            } catch (error) {
                console.error(`Erro ao baixar a imagem ${dataNames[i]}:`, error);
            }
            await Utils.sleep(2000); // espera um pouco!
        };
    }
}module.exports = DownloadAndConvertImages;