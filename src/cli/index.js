const { program } = require('commander');

module.exports = {
    init: init,
    readOptions: readOptions
}

function init() {
    // Set the initial version
    program.version('0.0.1');

    // Set up the program options
    program
        .requiredOption('-u, --url <url>', 'url to the page you want to read');

    // Read in all the options
    program.parse(process.argv);
}

function readOptions() {
    const sites = [{domain: 'retrocdn.net', script: './sites/retro-cdn.js'}];

    // Look for the site
    const found = sites.find(site => {
        // Check to see if the site matches the url
        if (program.url.includes(site.domain)) {
            require(site.script)(program.url);

            return true;
        }
    });

    if (!found) {
        console.log(`Site not found`)
    }
}