const mongoose = require('mongoose');

const HackerPost = mongoose.model('HackerPost', mongoose.Schema({
    id: String,
    extLink: String,
    title: String,
    source: String,
    score: String,
    postedBy: String,
    userProfile: String,
    datePosted: String,
    timePosted: String,
    comments: String
}));

module.exports = HackerPost;