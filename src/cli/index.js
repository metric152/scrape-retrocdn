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

    // Setup the optional properties
    program
        .option('-f, --folder <download folder name>', 'name of the folder to create in the downloads folder')
        .option('-t, --text <text to search for>', 'text to search for on the page');

    // Read in all the options
    program.parse(process.argv);
}

function readOptions() {
    const sites = [
        {
            domain: 'retrocdn.net',
            script: './sites/retro-cdn.js'
        }, {
            domain: 'retromags.com',
            script: './sites/retromags-cdn.js'
        }
    ];

    // Look for the site
    const found = sites.find(site => {
        // Check to see if the site matches the url
        if (program.url.includes(site.domain)) {
            // Read in the script and pass it the URL to parse
            require(site.script)(program);

            return true;
        }
    });

    if (!found) {
        console.log(`Site not found`)
    }
}