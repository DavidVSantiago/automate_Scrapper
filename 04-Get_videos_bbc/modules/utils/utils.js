
class Utils {
    constructor() { }

    static sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms));}
    
    static ArrayToTextLine(array) {return array.join('\n') + '\n';}
}
module.exports = Utils;