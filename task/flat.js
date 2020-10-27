var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var rootPath = path.resolve(__dirname, '../127_0_0_1___21025');
/**
 *
 * @param grunt {IGrunt}
 */
module.exports = function (grunt) {
    grunt.registerTask('flat', 'flat file form path to file', function () {
        var that = this;
        var done = this.async();
        var dirList = fs.readdirSync(rootPath);
    });
};
function run(dirs, parentPath) {
    var mp = dirs.map(function (dir) {
        var dirPath = path.resolve(parentPath, dir);
        var op = fs.promises.opendir(dirPath);
        return op.then(function (value) { });
    });
}
