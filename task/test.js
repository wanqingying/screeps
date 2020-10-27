const fs = require('fs');
const path = require('path');

/**
 *
 * @param grunt {IGrunt}
 */
module.exports = function (grunt) {
    grunt.registerTask('flat', 'flat file form path to file', function () {
        const that = this;
        const done = this.async();
        flat().then(()=>{
            done(true)
        })
    });
};

const root = path.resolve(__dirname, '../127_0_0_1___21025/test');

async function flat() {
    await resolveDir(root);
}
async function resolveDir(name) {
    const a = fs.readdirSync(name);
    for (let i = 0; i < a.length; i++) {
        const s = a[i];
        const stPath = path.resolve(name, s);
        const st = fs.statSync(stPath);
        if (st.isFile()) {
            await resolveFile(stPath);
        } else {
            await resolveDir(stPath);
        }
    }
}

async function resolveFile(name) {
    const dirName = path.dirname(name);
    const fileName = path.basename(name);
    let newFileName = fileName;
    const absDir = dirName.replace(root, '');
    if (absDir.trim()) {
        newFileName = absDir.replace(/\\/g, '_') + '_' + fileName;
    }
    const f = fs.readFileSync(name, { flag: 'r' });
    const str = f.toString('utf-8');
    const newStr = replaceStr(str, dirName);
    const newName = path.resolve(root, newFileName);
    fs.writeFileSync(newName, newStr);
}

function replaceStr(str = '', dirName) {
    const reg = /require\(['"](.*)['"]\)/g;
    return str.replace(reg, function replacer(match, p1) {
        const targetFileName = path.resolve(dirName, p1);
        const targetDir = path.dirname(targetFileName);
        const absDir = targetDir.replace(root, '');
        if (absDir.trim()) {
            const newName = absDir.replace(/\\/g, '_') + '_' + path.basename(targetFileName);
            const newS = match.replace(p1, './' + newName);
            return newS;
        } else {
            return match;
        }
    });
}
