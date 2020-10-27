const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../127_0_0_1___21025');

async function main() {
    const a = fs.opendirSync(root);
    debugger;
}

main().then(() => {
    console.log('done');
});
