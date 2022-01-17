const fs = require('fs');
const request = require('request-promise');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const objectsToCSV = require('objects-to-csv');
const HackerPost = require('./HackerPost.js');

const BASE_URL = 'https://news.ycombinator.com/';
const PAGE_URL = 'https://news.ycombinator.com/news?p=';

(async () => {
    // Connect to MongoDB
    await connectToMongo();

    let posts = await getPosts(3);
    console.log(posts);

    // Save scraped data to JSON
    fs.writeFileSync('./output.json', JSON.stringify(posts));

    // Save scraped data to CSV
    const csv = new objectsToCSV(posts);
    await csv.toDisk('./output.csv', { bom: true });
})();

async function connectToMongo() {
    const connect = await mongoose.connect('mongodb+srv://hackernews:b4ssl1n3@cluster0.zmd8d.mongodb.net/hnPosts?retryWrites=true&w=majority');
    console.log('Connected to Mongo...');
    return connect;
}

async function getPosts(pageNum) {
    try {
        const html = await request({
            uri: PAGE_URL + pageNum,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
            }
        });
        const $ = cheerio.load(html);

        let results = [];
        // Iterate through each post
        $('tr.athing').each((_, elem) => {
            if ($(elem).children('td:nth-child(2)').attr('class')) {
                // Scrape post details
                let id = $(elem).attr('id');
                let extLink = $(elem).find('td.title > a').attr('href');
                let title = $(elem).find('td.title > a').text().trim();
                let source = $(elem).find('td.title > span.comhead > a').text().trim();
                let score = $(`#score_${id}`).text().trim();
                let postedBy = $(`#score_${id} + .hnuser`).text().trim();
                let userProfile = BASE_URL + $(`#score_${id} + .hnuser`).attr('href');
                let datePosted = new Date(Date.parse($(`#score_${id}`).siblings('.age').attr('title'))).toDateString();
                let timePosted = new Date(Date.parse($(`#score_${id}`).siblings('.age').attr('title'))).toLocaleTimeString('en-GB');
                let comments = $(`#score_${id}`).parent().children('a:last-child').text().trim();
                comments = comments === 'discuss' ? 0 : comments;
    
                results.push({ id, extLink, title, source, score, postedBy, userProfile, datePosted, timePosted, comments });
                const hpost = new HackerPost({ id, extLink, title, source, score, postedBy, userProfile, datePosted, timePosted, comments });
                hpost.save();
            }
        });
        return results;
    } catch (err) {
        console.error(err);
    }
}