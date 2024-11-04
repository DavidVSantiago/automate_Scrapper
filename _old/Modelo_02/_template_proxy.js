import * as cheerio from 'cheerio';
import got from 'got'; // Importando dinamicamente
import {HttpsProxyAgent} from 'hpagent';

const proxyOptions = {
    agent: {
        // create a new HttpsProxyAgent instance
        https: new HttpsProxyAgent({
            // add proxy settings
            keepAlive: true,
            keepAliveMsecs: 10000,
            maxSockets: 256,
            maxFreeSockets: 256,
            scheduling: 'lifo',
            // specify proxy URL.
            proxy: 'http://178.128.113.118:23128'
        })
    }
};

(async () => {
  try {
    const {body} = await got('https://www.meuip.com.br',proxyOptions);
    const $ = cheerio.load(body);
    const meuip = $('a.d-none:nth-child(2)').text();
    console.log(meuip);
  } catch (error) {
    console.error(error);
  }
})();