const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootPath = path.resolve(__dirname, '../127_0_0_1___21025');
/**
 *
 * @param grunt {IGrunt}
 */
module.exports = function (grunt: IGrunt) {
    grunt.registerTask('flat', 'flat file form path to file', function () {
        const that = this;
        const done = this.async();
        const dirList = fs.readdirSync(rootPath);
    });
};

function run(dirs: string[], parentPath: string) {
    const mp = dirs.map(dir => {
        const dirPath = path.resolve(parentPath, dir);
        const op = fs.promises.opendir(dirPath);
        return op.then(value => {});
    });
}
