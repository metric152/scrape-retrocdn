const cliProgress = require('cli-progress');
const axios = require('axios').default;
const jsdom = require("jsdom");
const url = require('url');
const fs = require('fs');
const https = require('https');
const { JSDOM } = jsdom;

// Get the base URL from the domain
let urlObj;
let domain;
let cliProgramObj;

module.exports = (programObj) => {
    // Capture the object so we can read it later
    cliProgramObj = programObj;

    urlObj = new URL(programObj.url);
    domain = `${urlObj.protocol}//${urlObj.hostname}`;

    // Fix the cert issue with this server
    const agent = new https.Agent({  
        rejectUnauthorized: false
    });

    // Fetch the page
    axios.get(programObj.url, { httpsAgent: agent })
        .then(response => getMagazines(response.data))
        .catch(err => {
            console.log(`an error happened:`, err.code);
        });
};

function getMagazines(data) {
    console.log(`data:`, JSON.stringify(data, null, 4));
}