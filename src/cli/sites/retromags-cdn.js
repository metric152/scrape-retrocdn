const cliProgress = require('cli-progress');
const axios = require('axios').default;
const jsdom = require("jsdom");
const fs = require('fs');
const https = require('https');
const { JSDOM } = jsdom;

module.exports = (program) => {
    // Fix the cert issue with this server
    const agent = new https.Agent({  
        rejectUnauthorized: false
    });

    const axiosOptions = {
        httpsAgent: agent
    };

    // Fetch the page
    axios.get(program.url, axiosOptions)
        .then(response => getMagazines(response.config.url, program.folder, program.text, response.data, axiosOptions))
        .catch(err => {
            console.log(`an error happened:`, err.code);
        });
};

function getMagazines(domain, folder, text, data, axiosOptions) {
    // Assign the response to a dom object
    const { document } = (new JSDOM(data)).window;

    let urls = [];
    let urlGenerator;
    
    // Create a new progress bar instance and use shades_classic theme
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    // Function to get the magazine
    function getNextMag(item) {
        if (item.done) {
            bar1.stop();
            return;
        }

        // Get the magazine. It's a direct download
        downloadMagazine(item.value, axiosOptions, folder)
            .then(() => {
                // Add one to the bar
                bar1.increment();

                // Get the next magazine
                getNextMag(urlGenerator.next());
            })
            .catch(error => {
                console.log(error);
            })
    }

    // Get all the links we're looking for
    document.querySelectorAll("a[href$='cbr'], a[href$='cbz'], a[href$='pdf']").forEach(link => {
        // Check to see if the link contains the text we want
        if (!text) {
            urls.push(`${domain}${link.href}`);
        } else if (text && link.text.toLowerCase().includes(text)) {
            urls.push(`${domain}${link.href}`);
        }
    });

    // Update the progress bar
    bar1.start(urls.length, 0);

    // Save the array to an iterator
    urlGenerator = urls[Symbol.iterator]();

    // Get the first magazine
    getNextMag(urlGenerator.next());

    // console.log(`urls:`, urls);
}

function downloadMagazine(magazineUrl, axiosOptions, folderName) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: magazineUrl,
            responseType: 'stream',
            httpsAgent: axiosOptions.httpsAgent
        })
        .then(response => saveMagazine(response, folderName))
        .then(msg => resolve(msg))
        .catch(error => {
            console.log('an error happened', error);
            reject(error);
        })
    });
}

function saveMagazine(response, folderName) {
    // response.config.url. break the file name off
    let fileName = decodeURI(response.config.url.split('/').splice(-1,1));
    let destination = `downloads/`;

    // Check for folder name
    if (folderName) {
        destination += `${folderName}/`;
    }

    // Write the directory with a promise
    return fs.promises.mkdir(destination, { recursive: true})
        .then(result => {
            const writer = fs.createWriteStream(`${destination}/${fileName}`);

            // Save the magazine
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('close', () => {
                    const msg = `saved ${fileName} to ${destination}`;
                    resolve(msg);
                });
                writer.on('error', (error) => {
                    const msg = `an error occured writing the file`;
                    console.log(msg, error);
                    reject(error);
                })
            })
        });
}