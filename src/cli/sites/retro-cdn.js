const axios = require('axios').default;
const jsdom = require("jsdom");
const url = require('url');
const fs = require('fs');
const { JSDOM } = jsdom;

// Get the base URL from the domain
let urlObj;
let domain;

module.exports = (urlStr) => {
    urlObj = new URL(urlStr);
    domain = `${urlObj.protocol}//${urlObj.hostname}`;

    // Fetch the page
    axios.get(urlStr).then(response => getMagazinePages(response.data));
};

function getMagazinePages(data) {
    // Assign the response to a dom object
    const { document } = (new JSDOM(data)).window;
    let urls = [];
    let urlGenerator;

    function getNextMag(item) {
        if (item.done) {
            return;
        }

        // Get the individual magazine page
        axios.get(item.value).then(magPageResponse => {
            getMagazineLink(magPageResponse.data).then(data => {
                // Log the saved magazine
                console.log(data);
                // Get the next magazine
                getNextMag(urlGenerator.next());
            }).catch(error => {
                console.log(error);
            });
        })
    }

    // Get the first level of links
    document.querySelectorAll('.galleryfilename').forEach(link => {
        // Create full urls for the pages
        urls.push(`${domain}${link.href}`);
    });

    // Save the array to an iterator
    urlGenerator = urls[Symbol.iterator]();

    // Get the first magazine
    getNextMag(urlGenerator.next());
}

function getMagazineLink (data) {
    // Assign the response to a dom object
    const { document } = (new JSDOM(data)).window;
    let url = '';

    // Get the first level of links
    document.querySelectorAll('.fullMedia a').forEach(link => {
        // Create full urls for the pages
        url = `${domain}${link.href}`;
    });

    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        }).then(response => saveMagazine(response).then((msg) => resolve(msg)))
        .catch(error => {
            console.log('an error happened', error);
            reject(error);
        });
    });
}

function saveMagazine(response) {
    // response.config.url. break the file name off
    let fileName = response.config.url.split('/').splice(-1,1);
    const destination = `downloads/${fileName}`;
    const writer = fs.createWriteStream(destination);

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
}