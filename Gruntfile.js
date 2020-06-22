module.exports = function(grunt) {


    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-screeps');

    const config=require('./user.json')

    const dist='127_0_0_1___21025/default'

    grunt.initConfig({
        screeps: {
            options: {
                email: config.email,
                password: config.password,
                branch: config.branch,
                ptr: config.ptr
            },
            dist: {
                src: [`${dist}/*.js`]
            },
        },
        ts: {
            default : {
                tsconfig: './tsconfig.json'
            }
        },
    });

    grunt.registerTask('default',  ['screeps']);
}