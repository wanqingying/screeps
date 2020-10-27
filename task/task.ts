const { exec } = require('child_process');

/**
 *
 * @param grunt {IGrunt}
 */
module.exports = function (grunt: IGrunt) {
    grunt.registerTask('tsc', 'tsc compile', function () {
        const that = this;
        const done = this.async();
        exec('tsc', (err, res) => {
            done(true);
        });
    });
};
