const WPAPI = require('wpapi');

(async () => {
    uploadPost()
})();

async function uploadPost(){
    // Cria um cliente para a API do WordPress
    const wp = new WPAPI({
        endpoint: 'https://gosex.top/wp-json',
        username: 'david.valente.santiago@gmail.com',
        password: '&*EeH$$$&S23JE@qtXxhT394O!00o%@#fTz4YM@%'
    });
    
    let langTermTaxonomy =11;//español
    let langTermTaxonomySlug = 'es';//español
    // Cria o novo post
    let title='Titulo';
    let link='Link';
    let mediabook='Media book';
    let metaTags='Meta tags do artigo';
    let thumb='thumbnail';
    let code='código do post';
    const content = JSON.stringify({link,code,thumb,mediabook,metaTags});
    // Dados do novo post
    const newPost = {
        title,
        content,
        status: 'publish',
    };
    //console.log(newPost);
    
    wp.posts().create(newPost)
    .then(post => {
        console.log('Post inserido com sucesso!');
        // Dados para atualizar o post, incluindo os termos taxonômicos
        const updateData = {
            id: post.id, // ID do post recém-criado
            terms: [
                {
                    id: langTermTaxonomy, // idioma do post
                    slug: langTermTaxonomySlug, // slug do idioma
                }
            ]
        };

        // Atualiza o post com o novo idioma
        wp.posts().id(post.id).update(updateData)
            .then(() => {
                console.log('Termo taxonômico associado ao post com sucesso!');
            })
            .catch(error => {
                console.error('Erro ao associar o termo taxonômico:', error);
            });
    })
    .catch(error => {console.error('   LOG-> Erro ao criar o post:', error);});
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}