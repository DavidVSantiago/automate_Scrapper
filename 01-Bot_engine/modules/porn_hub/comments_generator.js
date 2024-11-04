const _0 = [' '];
const _1 = ['!','.',','];
const _2 = ['Essa','essa','Esta','esta'];
const _3 = ['s@f@d@','pir@nh@','c@del@','v@di@','mulher','senhora'];
const _4 = ['é top','é massa','é uma gostosa','uma delicia','e deliciosa','é muito tesuda','me deixa louco','me deixa de pau duro','me faz gozar rapidinho','é meu sonho','é meu sonho de consumo','é delirante','me fez bater meu recorde de bronha','me dá um tesão'];
const _5 = ['No site','Lá no site','Lá no'];
const _6 = ['gosex.top','Gosex.top','GOSEX.TOP','Gosex.Top'];
const _7 = ['','também','tambem','','tamem','tamém'];
const _8 = ['há varios','tem inumeros','há diversos','tem uma porção de','tem um numero grande de','tem bastante','tem um monte de','tem um bocado de','tem vários','tem muitos','tem uma caralhada de','tem varius'];
const _9 = ['videos dela', 'vídeos com ela', 'conteúdos sobre ela' , 'materiais dela', 'trabalhos dela', 'videozinhos dela', 'conteudo dela'];
const _10 = ['Caralho','caralho','Mano','mano','manooooo','Francamente','Sem brincadeira','sem brinks','Olha, na boa','Vixe maria','vixe maria','Santo Deus','santo Deus','Nossa','Eita','Caramba','Caraca','nossa','eita','caramba','caraca','Nossa senhora','nossa senhora','Puta qui pariu','puta que pariu','Putz','Meu deus do ceu','Na moral','Sé loko','C é loko'];
const _11 = ['espiei as cenas dela','olhei os videozinhos dela','vi os conteúdos com ela','vi os materiais dela','olhei o conteudo dela','vi os videos dela','vi o video dela'];
const _12 = ['Fico Lokaço','Fico loko Tio','Me elouquece','Obra prima','Inrresistivel','fico loko','fico loko tio','me elouquece','obra prima','irresistivel','que gostosa viu mano','que maravilhosa','que perfeição','essa vaca adora fu4er','essa mulher é deliciosa','ela me faz subir pelas paredes','ela me deixa louco','ela é uma delícia','ela é maravilhosa','ela é um tesão','ela é fantástica','ela é o motivo da minha bronha'];
const _13 = ['cheguei lá pelo site','vim de lá do site','to aqui pelo','vim praqui pelo site','vim pelo site','cheguei aqui por causa do site','tô aqui porcausa do','Vim parar aqui pelo','Cheguei aqui pelo'];
const _14 = ['A busca','a pesquisa','A pesquisa','a busca'];
const _15 = ['dos conteudos das gostosas','dos videos das gostosas','dos materiais','dos conteudos','de conteudo','','dos videozinhos','dos conteúdos','de conteúdo','de videos','dos videos'];
const _16 = ['lá'];
const _17 = ['é bem melhor','e bem melhor','é bem mais rapida','e bem mais rapida','é bem mais veloz','e bem mais veloz','é bem veloz','e bem veloz','e rapida pra caralho','é rapida pra caralho','é rápida pacaralho','e rápida pa caralho','é bem rapida','e bem rapida','é bem rapidona','e bem rapidona','e rapida','é rapida','é rapidona','e rapidona'];
const _18 = ['tem uma pá de','tem um monte de','tem muito','tem uma porrada de','tem bastante','tem uma karalhada de','tem uma caralhada de'];
const _19 = ['material', 'conteudo', 'video', 'videozinhos', 'cena'];
const _20 = ['dessa danadinha','dessa safadinha','dessa maravilha','dessa deusa','dessa mina','dessa danada','dessa delicia','dessa perfeição','dela', 'dessa gostosa','dessa tesuda','dessa Danadinha','dessa Safadinha','dessa Maravilha','dessa Deusa','dessa Mina','dessa Danada','dessa Delicia','dessa Perfeição','dessa Gostosa','dessa Tesuda'];

const Utils = require('../utils/utils');
const FileUtils = require('../utils/file_utils');

class CommentsGenerator {
    constructor() {
        this._videoListFileName = 'extracted/video-list.txt';
        this._commentsListFileName = 'extracted/comments-list.txt';
        this._consolidatedListFileName = 'extracted/consolidated-list.json';
        this._consolidatedListDividedFileName = 'extracted/consolidated/';
        this.termsList = [_0,_1,_2,_3,_4,_5,_6,_7,_8,_9,_10,_11,_12,_13,_14,_15,_16,_17,_18,_19,_20];
        this.totalList = [];
        this.totalList.push([2,0,3,0,4,1,0,5,0,6,0,7,0,8,0,9,1]);
        this.totalList.push([10,1,0,11,0,5,0,6,1,0,12,1]);
        this.totalList.push([13,0,6,1,0,14,0,15,0,16,0,17,1]);
        this.totalList.push([10,1,0,18,0,19,0,20,0,5,0,6,1]);
        this.totalList.push([10,1,0,18,0,19,0,20,0,5,0,6,1,0,14,0,16,0,17,1]);
        this._qtd=0;
    }
    async start(){
        console.log(`\n   LOG-> Iniciando o processo de geração dos comentários.`); // imprime um msg
        let videoList = await FileUtils.readFileAsArray(this._videoListFileName); // obtém a lista de videos
        this._qtd = videoList.length; // quantidade de videos
        console.log(`\n   LOG-> Serão gerados ${this._qtd} comentários.`); // imprime um msg
        let comments = []; // lista dos comentários gerados
        for(let i=0;i<this._qtd;i++){ // repete qtd vezes
            comments.push(await this.getText());
        }
        
        // remove os comentários repetidos e gera novos para os substituir
        let qtdRemovidos=0;
        do{
            // adiciona mais comentários para completar os removidos
            for(let i=0;i<qtdRemovidos;i++){ // repete qtdRemovidos vezes
                comments.push(await this.getText());
            }

            this._qtd = comments.length;
            console.log("Antes: "+this._qtd);
            comments = await this.removeDuplicated(comments);
            qtdRemovidos = this._qtd - comments.length; // quantidade de removidos
            console.log("Depois: "+comments.length);
            console.log("Removidos: "+qtdRemovidos);
        }while(qtdRemovidos!=0);
        
        /** Salva os comentários em arquivos */
        console.log(`   LOG-> Salvando ${comments.length} comentários.`); // imprime um msg sinalizadora do processo de busca
        let result = await FileUtils.writeArrayToFile(comments,`${this._commentsListFileName}`); // salva os comentários
        if(!result) console.error(`   LOG-> Erro ao tentar salvar no arquivo de dados '${this._commentsListFileName}'`);
        
        console.log(`\n   LOG-> Finalizando o processo de geração dos comentários.`); // imprime um msg
    }
     /** Gera um novo comentário por meio de uma lista de sinonimos peviamente estabelecidas */
    async getText(){
        return await this.generateNewText(this.totalList[await Utils.getRandom(0,this.totalList.length-1)]);
    }
    async generateNewText(indexes){
        let text = '';
        for(let i=0;i<indexes.length;i++){
            text+=this.termsList[indexes[i]][await Utils.getRandom(0,this.termsList[indexes[i]].length-1)]
        }
        return text;
    }
    /** Percorre um array e remove os possíveis registros duplicados */
    async removeDuplicated(list){
        const newList = await list.reduce((unique, current)=>{
            if (!unique.some(item => this.checkEquals(item,current))) {
                unique.push(current);
            }
            return unique;
        },[]);
        return newList;
    }
    checkEquals(a,b){
        a=a.replace(/[!.,]/g, '');
        b=b.replace(/[!.,]/g, '');
        return a===b;
    }
    async consolidateResults(){
        console.log(`\n   LOG-> Iniciando o processo de consolidação dos resultados.`); // imprime um msg
        const videoList = await FileUtils.readFileAsArray(this._videoListFileName); //carrega a lista de links para os videos
        const commentsList = await FileUtils.readFileAsArray(this._commentsListFileName); //carrega a lista de comentários gerados
        if(videoList.length!=commentsList.length){
            console.log(`\n   LOG-> Erro de inconsistência dos dados! Quantidade de comentários diferente da quantidade de links!`); // imprime um msg
            return;
        }

        let objectList = [];
        for(let i=0;i<videoList.length;i++){
            objectList.push({
                'link':videoList[i],
                'comment':commentsList[i],
            });
        }

        /** Salva a lista de objetos consolidados em arquivo */
        console.log(`   LOG-> Salvando ${objectList.length} objetos consolidados.`); // imprime um msg sinalizadora do processo de busca
        let result = await FileUtils.writeJsonToFile(objectList,`${this._consolidatedListFileName}`); // salva os comentários
        if(!result) console.error(`   LOG-> Erro ao tentar salvar no arquivo de dados '${this._consolidatedListFileName}'`);

        console.log(`\n   LOG-> Finalizando o processo de consolidação dos resultados.`); // imprime um msg
    }

    async separateBlocks(blocsQtd){
        const objectList = await FileUtils.readJsonFileAsArray(this._consolidatedListFileName); // carrega a lista de links para os videos

        const dividedSet = await Utils.divideArray(objectList,blocsQtd);
        console.log();
        
        // salva em arquivo cada um dos arrays divididos
        for(let i=0;i<dividedSet.length;i++){
            await FileUtils.makeDir(`extracted/consolidated/part_${i}`);
            let result = await FileUtils.writeJsonToFile(dividedSet[i],`extracted/consolidated/part_${i}/data.json`); // salva os comentários
            if(!result) console.error(`   LOG-> Erro ao tentar salvar no arquivo de dados 'extracted/consolidated/part_${i}/data.json'`);
            else await this.buildConfigFile(`extracted/consolidated/part_${i}/config.cfg`,dividedSet[i].length); //
        }
    }

    async buildConfigFile(fileName,qtd) {
        // verifica se o arquivo de configuração já foi criado antes  
        let oldConfigFile = await FileUtils.readJsonFileAsObject(fileName); // lê o arquivo de configuração
        if(oldConfigFile!=null){
            console.log(`   LOG-> Arquivo de configuração '${fileName}' já existe!`);
            return;
        }
        let configFile = {
            actualIndex:0, // indice no array de dados em que o trabalho está parado
            lastIndex:(qtd-1) // indice final no array de dados
        }
        let result = await FileUtils.writeJsonToFile(configFile,fileName); // salva o arquivo de configuração
        if(result) console.log(`   LOG-> Arquivo de configuração '${fileName}' criado com sucesso!`);
        else console.error(`   LOG-> Erro ao escrever o arquivo de configuração '${fileName}'`);
    }

}
module.exports = CommentsGenerator;