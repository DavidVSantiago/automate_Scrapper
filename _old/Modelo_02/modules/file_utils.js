const fs = require('fs').promises;

class FileUtils {
    constructor() { }

    /** Cria um diretório, caso ele ainda não exista */
    async makeDir(dirName) {
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
    async writeToFile(data, fileName) {
        try {
            await fs.writeFile(fileName, data);
            return true
        } catch (err) { return false }
    }

    /** Salva um JSON como texto em um arquivo, sobrescreve caso ele exista */
    async writeJsonToFile(data, fileName) {
        try {
            data = JSON.stringify(data);
            await fs.writeFile(fileName, data);
            return true
        } catch (err) { return false }
    }

    /** lê arquivo JSON para um array de OBJS */
    async readJsonFileAsArray(fileName) {
        const data = await readFile(fileName);
        if (data === null) return [];
        const jsonArray = JSON.parse(data);
        return jsonArray;
    }

    async readJsonFileAsObject(fileName) {
        const data = await this.readFile(fileName);
        if (data === null) return data;
        const jsonObj = JSON.parse(data);
        return jsonObj;
    }

    /** lê arquivo genérico */
    async readFile(fileName) {
        try {
            const data = await fs.readFile(fileName, 'utf8');
            return data;
        } catch (err) { return null }
    }
}
module.exports = FileUtils;