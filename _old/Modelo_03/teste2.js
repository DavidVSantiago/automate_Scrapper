/** exemplo de conexão via rest api com autenticação simples */
import axios from 'axios';

const url = 'http://localhost/gosex.top/wp-json/api/add_post';
// const url = 'https://gosex.top/wp-json/api/add_post';
const username = 'david.valente.santiago@gmail.com';
const password = '&*EeH$$$&S23JE@qtXxhT394O!00o%@#fTz4YM@%';
const auth = Buffer.from(username + ':' + password).toString('base64'); // autenticação com a api rest

// dados para a inserção do artigo
let title='FUI DAR BOM DIA PARA NAMORADA BRANQUINHA RABUDA DO MEU AMIGO E FOI ASSIM QUE ELA ME RECEBEU...';
let code='66f69baadf41a';
let link='https://pt.pornhub.com/view_video.php?viewkey=66f69baadf41a';
let thumb='https://ei.phncdn.com/videos/202409/27/458349851/thumbs_5/(m=eafTGgaaaa)(mh=91eYFfv95Uk3UiaV)13.jpg';
let mediabook='https://ew.phncdn.com/videos/202409/27/458349851/180P_225K_458349851.webm?validfrom=1728221581&validto=1728228781&rate=150k&burst=250k&ipa=45.184.26.252&hash=q6gcL0e5rz6UygLE%2FdYgIvje%2BkE%3D';
let metaTags='branquinha, branquinha gostosa, branquinha rabuda, novinha de 18 anos, novinha gostosa, novinhas brasileiras, boquete, boquete amador, boquete babado, amador brasil, big dick, buceta rosinha';
let lang = 'es';
const data = {title,code,link,thumb,mediabook,metaTags,lang};

axios.post(url, data,{ // execução do request
    headers: {
        'Authorization': 'Basic ' + auth // dados para autenticação
    }
})
.then(response => {
    console.log('Resposta da API:', response.data);
})
.catch(error => {
    console.error('Erro na requisição:', error);
});