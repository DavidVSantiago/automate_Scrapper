const fs = require('fs').promises;

class FileUtils {
    constructor() { }

    /** Cria um diretório, caso ele ainda não exista */
    static async makeDir(dirName) {
        try {
            await fs.access(dirName);
            console.log(`   LOG-> Diretório '${dirName}' já existe.`);
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.mkdir(dirName,{ recursive: true });
                console.log(`   LOG-> Diretório '${dirName}' criado com sucesso!`);
            } else { console.error('   LOG-> Erro ao acessar o diretório:', err); }
        }
    }

    /** Salva um arquivo simples */
    static async writeToFile(data, fileName) {
        try {
            await fs.writeFile(fileName, data);
            return true
        } catch (err) { return false }
    }

    /** Adiciona dados a um arquivo simples */
    static async appendToFile(data, fileName) {
        try {
            await fs.appendFile(fileName, data);
            return true;
        } catch (err) { return false }
    }

    /** Salva um JSON como texto em um arquivo, sobrescreve caso ele exista */
    static async writeJsonToFile(data, fileName) {
        try {
            data = JSON.stringify(data);
            await fs.writeFile(fileName, data);
            return true
        } catch (err) { return false }
    }

     /** Salva um JSON como texto em um arquivo, sobrescreve caso ele exista */
     static async appendObjToJsonArrayFile(data, fileName) {
        try {
            let arrayData = await this.readJsonFileAsArray(fileName); // lê o json como um array
            arrayData.push(data);
            data = JSON.stringify(arrayData);
            await fs.writeFile(fileName, data);
            return true
        } catch (err) { return false }
    }

    /** lê arquivo JSON para um array de OBJS */
    static async readJsonFileAsArray(fileName) {
        const data = await this.readFile(fileName);
        if (data === null) return [];
        const jsonArray = JSON.parse(data);
        return jsonArray;
    }

    static async readJsonFileAsObject(fileName) {
        const data = await this.readFile(fileName);
        if (data === null) return data;
        const jsonObj = JSON.parse(data);
        return jsonObj;
    }

    /** lê arquivo genérico */
    static async readFile(fileName) {
        try {
            const data = await fs.readFile(fileName, 'utf8');
            return data;
        } catch (err) { return null }
    }

    // #####################################################################################################################
    // Métodos de análise de arquivos
    // #####################################################################################################################

    static async removeCorruptedData(filename){
        const newDataList = [];
        const dataList = await this.readJsonFileAsArray(filename);
        console.log(`\n   LOG-> Iniciando o processo de remoção de dados comrrompidos em ${dataList.length} registros...`);
        let flag = false;
        for(let i=0;i<dataList.length;i++){
            flag = await this.checkData(dataList[i]);
            if(!flag) newDataList.push(dataList[i]); // se não estiver corrompido, coloca na nova lista
        }
        console.log(`\n   LOG-> Finalizando o processo de remoção de dados corrompidos...`);
        let count = dataList.length-newDataList.length; // checa a quantidade de dados corrompidos
        if(count!=0){ // se a quantidade de dados corrompidos for diferente de zero
            console.log(`\n   LOG-> Houve um total de ${count} dados corrompidos.`);
            await this.writeJsonToFile(newDataList,filename);
            console.log(`\n   LOG-> Dados filtrados salvos em ${filename}.`);
        } 
        else console.log(`\n   LOG-> Não houve dados corrompidos.`);

    }

    static async checkData(data){
        if(data['link']=='') return true;
        if(data['code']=='') return true;
        if(data['title']=='') return true;
        if(data['thumb']=='') return true;
        if(data['mediabook']=='') return true;
        if(data['metaTags']=='') return true;
        return false;
    }

    static async reverseDataOrder(filename){
        const newDataList = [];
        const dataList = await this.readJsonFileAsArray(filename);
        console.log(`\n   LOG-> Iniciando o processo de inversão da ordem dos dados em ${dataList.length} registros...`);
        for(let i=dataList.length-1; i>=0; i--){ // percorre a lista de registros de trás para frente
            newDataList.push(dataList[i]);
        }
        console.log(`\n   LOG-> Finalizando o processo de inversão da ordem dos dados...`);
        await this.writeJsonToFile(newDataList,filename);
        console.log(`\n   LOG-> Dados invertidos salvos em ${filename}.`);
    }
}
module.exports = FileUtils;