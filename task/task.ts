const { exec } = require('child_process');

module.exports = function (grunt) {
    grunt.registerTask('tsc', 'tsc compile', function () {
        const that = this;
        const done = this.async();
        exec('tsc', (err, res) => {
            done(true);
        });
    });
};
