const { Worker} = require('worker_threads');

class CommentsPornHub{
    constructor(authList){
        this._authList = authList;
        this._searchterm='';
        this._dirName = 'extracted/';
        this._consolidatedListFileName = `${this._dirName}consolidated-list.json`;
        this._browser=null;
    }

    async start(){
        for(let i=0;i<this._authList.length;i++){ // percorre cada dos logins e cria uma thread para cada
            const worker = await new Worker('./modules/comments_pornhub_worker.js', {
                workerData: {
                    'index':i,
                    'login':this._authList[i].login,
                    'senha':this._authList[i].senha,
                }
                
            });
            await worker.on('message', (message) => {
                console.log('Message from worker:', message);
            });
            await worker.on('error', (error) => {
                console.error(`Erro na thread ${i}:`, error);
            });
        }
    }
}
module.exports = CommentsPornHub;
