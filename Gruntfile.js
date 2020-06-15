module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps');

    grunt.initConfig({
        screeps: {
            options: {
                email: '1336753721@qq.com',
                password: 'wan@com123',
                branch: 'test',
                ptr: false
            },
            dist: {
                src: ['127_0_0_1___21025/default/*.js']
            }
        }
    });
}