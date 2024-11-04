class Utils {
    constructor() {
        
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async getRandom(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

    static async divideArray(array, partes) {
        const tamanhoParte = Math.floor(array.length / partes);
        const resto = array.length % partes;
        const resultado = [];
        let indice = 0;
        for (let i = 0; i < partes; i++) {
          const tamanhoAtual = tamanhoParte + (i < resto ? 1 : 0);
          resultado.push(array.slice(indice, indice + tamanhoAtual));
          indice += tamanhoAtual;
        }
        return resultado;
      }
    
}
module.exports = Utils;