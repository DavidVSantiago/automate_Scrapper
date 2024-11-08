const fs = require('fs').promises;

class FileUtils {
    constructor() { }

    // #####################################################################################################################
    // Métodos de DIRETÓRIOS
    // #####################################################################################################################

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

    // #####################################################################################################################
    // Métodos de ESCRITA de arquivos
    // #####################################################################################################################

    /** Cria um arquivo simples */
    static async makeFile(data, fileName) {
        try {
            await fs.access(fileName);
            console.log(`   LOG-> Arquivo '${fileName}' já existe.`);
            return false;
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.writeFile(fileName, data);
                console.log(`   LOG-> Arquivo '${fileName}' criado com sucesso!`);
                return true;
            } else { console.error('   LOG-> Erro ao criar arquivo:', err); return false; }
        }
    }

    /** Salva um arquivo simples (sobrescreve o conteúdo!) */
    static async writeToFile(data, fileName) {
        try {
            await fs.access(fileName);
            await fs.writeFile(fileName, data); // sobrescreve o conteúdo do arquivo
            return true;
        } catch (err) {
            if (err.code === 'ENOENT') console.log(`   LOG-> Não pôde salvar os dados, pois o arquivo '${fileName}' não existe!`);
            else console.error(`   LOG-> Erro ao salvar no arquivo: '${fileName}'`, err);
            return false
        }
    }

    /** adiciona um array de dados em um arquivo de texto */
    static async appendArrayToFile(array, fileName) { 
        let data = await this.readFileAsArray(fileName);
        data = [...data, ...array]; // concatena ambos os arrays
        data = data.join('\n')+'\n'; // converte o array concatenado em texto
        return await this.writeToFile(data, fileName); // salva o array em texto
    }

    /** Salva um JSON como texto em um arquivo, sobrescreve caso ele exista */
    static async writeJsonToFile(data, fileName) {
        try {
            data = JSON.stringify(data);
            return await this.writeToFile(data,fileName);
        } catch (err) { return false }
    }

    static async appendObjToJsonArrayFile(jsonObj, fileName) {
        let data = await this.readJsonFile(fileName);
        if (!Array.isArray(data)) console.error(`   LOG-> O arquivo '${fileName}' não é um array JSON!`, err);
        if (data === null) return data;
        data.push(jsonObj); // Adiciona o objeto no array JSON
        return await this.writeJsonToFile(data, fileName); // salva o JSON array no arquivo

    }
    
    // #####################################################################################################################
    // Métodos de LEITURA de arquivos
    // #####################################################################################################################

    /** lê arquivo textual */
    static async readFile(fileName) {
        try {
            const data = await fs.readFile(fileName, 'utf8');
            return data;
        } catch (err) { return null }
    }

    /** lê um arquivo textual como array (cada linha é um elemento do array) */
    static async readFileAsArray(fileName) {
        let data = await this.readFile(fileName);
        if (data === null) return data;
        data = data.split('\n');
        data.pop();
        return data;
    }

    /** Lê um arquivo JSON e faz o seu parse (seja objeto ou array)*/
    static async readJsonFile(fileName) {
        const data = await this.readFile(fileName);
        if (data === null) return data;
        const jsonObj = JSON.parse(data);
        return jsonObj;
    }

     // #####################################################################################################################
    // Métodos de análise de arquivos
    // #####################################################################################################################

    
    static async removeCorruptedData(filename,fieldsList){
        const newDataList = [];
        const dataList = await this.readJsonFileAsArray(filename);
        console.log(`\n   LOG-> Iniciando o processo de remoção de dados corrompidos em ${dataList.length} registros...`);
        let flag = false;
        for(let i=0;i<dataList.length;i++){
            flag = await this.checkEmptyData(dataList[i],fieldsList);
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

    /** Verifica se existe algum campo vazio de um objeto json */
    static async checkEmptyData(data,fieldsList){
        for(const field of fieldsList){
            if(data[field]=='') return true;
        }
        return false;
    }

    static async reverseJsonArrayDataOrder(filename){
        const newDataList = [];
        const dataList = await this.readJsonFile(filename);
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