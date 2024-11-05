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

    /** salva um array de dados em um arquivo de texto (sobrescreve o conteúdo!) */
    static async writeArrayToFile(array, fileName) {
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

    /** lê arquivo com um objeto JSON */
    static async readJsonFileAsObject(fileName) {
        const data = await this.readFile(fileName);
        if (data === null) return data;
        const jsonObj = JSON.parse(data);
        return jsonObj;
    }

    // #####################################################################################################################
    // Métodos de análise de arquivos
    // #####################################################################################################################


}
module.exports = FileUtils;