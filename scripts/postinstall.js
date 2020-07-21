require('dotenv').config();

const package = require('../package.json');
const fs = require('fs');

const { PERSONAL_ACCESS_TOKEN } = process.env;

package.dependencies["set-protocol-v2"] = package.dependencies["set-protocol-v2"]
    .replace(PERSONAL_ACCESS_TOKEN, "${$PERSONAL_ACCESS_TOKEN}");

fs.writeFileSync('package.json', JSON.stringify(package, null, 4));
