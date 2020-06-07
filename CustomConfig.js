const fs = require('fs');
const YAML = require('yaml');

function fixComments(text) {
    return text.replace(/("|')?~(\d+)?("|')?:\s("|')?.+("|')?/g, match => "# " + match.replace(/("|')?~(\d+)?("|')?:\s/g, '').replace(/("|')/g, ''));
}
module.exports = class Config {
    constructor(path, defaultcontent) {
        this.path = path;
        if (!fs.existsSync(path)) {
            function createConfig() {
                fs.writeFileSync(path, fixComments(YAML.stringify(defaultcontent)), function (err) {
                    if (err) return err;
                })
            }
            if (!fs.existsSync('./addon_configs')) {
                fs.mkdirSync('./addon_configs', function (err) { if (err) console.log(err); });
                createConfig();
            } else createConfig();
            return YAML.parse(fs.readFileSync(path, 'utf-8'));
        } else {
            return YAML.parse(fs.readFileSync(path, 'utf-8'));
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
