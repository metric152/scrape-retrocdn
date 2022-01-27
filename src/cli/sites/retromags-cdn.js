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
    // Assign the response to a dom object
    const { document } = (new JSDOM(data)).window;

    let urls = [];
    let urlGenerator;
    
    // Create a new progress bar instance and use shades_classic theme
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    // Get all the links we're looking for
    document.querySelectorAll("a[href$='cbr']").forEach(link => {
        // Check to see if the link contains the text we want
        if (!cliProgramObj.text) {
            urls.push(`${domain}${link.href}`);
        } else if (cliProgramObj.text && link.text.toLowerCase().includes(cliProgramObj.text)) {
            urls.push(`${domain}${link.href}`);
        }
    });

    // Update the progress bar
    bar1.start(urls.length, 0);

    // Save the array to an iterator
    urlGenerator = urls[Symbol.iterator]();

    console.log(`urls:`, urls);
}