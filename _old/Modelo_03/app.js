const FileUtils = require('./modulos/file_utils');
const WordpressUtils = require('./modulos/wordpress_utils');

(async () => {
  const fileUtils = new FileUtils();
  const wordpressUtils = new WordpressUtils();
  // await fileUtils.removeCorruptedData('french.json');
  await wordpressUtils.bulkUploadPosts('french.json','fr');
})();