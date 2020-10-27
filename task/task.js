var exec = require('child_process').exec;
/**
 *
 * @param grunt {IGrunt}
 */
module.exports = function (grunt) {
    grunt.registerTask('tsc', 'tsc compile', function () {
        var that = this;
        var done = this.async();
        exec('tsc', function (err, res) {
            done(true);
        });
    });
};
