'use strict';
var request = require('request');
var cheerio = require('cheerio');
var Twit = require('twit');
var jsonfile = require('jsonfile');
var util = require('util');

process.title = "DovizRobotu";

const dataFile = "./data.json";


var robotConfig = {
    currencies: {
        USD: {
            name: 'Dolar',
            symbol: 'USD',
            convertTo: 'TRY',
            highestPrice: 0,
            lastPostedPrice: 0,
            lastPriceTime: '',
            currentPrice: 0
        },
        EUR: {
            name: 'Euro',
            symbol: 'EUR',
            convertTo: 'TRY',
            highestPrice: 0,
            lastPostedPrice: 0,
            lastPriceTime: '',
            currentPrice: 0
        },
        XBT: {
            name: 'Bitcoin',
            symbol: 'XBT',
            convertTo: 'USD',
            highestPrice: 0,
            lastPostedPrice: 0,
            lastPriceTime: '',
            currentPrice: 0
        },
        GBP: {
            name: 'Pound',
            symbol: 'GBP',
            convertTo: 'TRY',
            highestPrice: 0,
            lastPostedPrice: 0,
            lastPriceTime: '',
            currentPrice: 0
        },
        TRY: {
            name: 'TL'
        }
    },

    updateurl: 'http://www.xe.com/currencyconverter/convert/?Amount=1&From=%s&To=%s',
    watchedCurrencies: ['USD', 'EUR', 'XBT', 'GBP'],

    crawlerInterval: 5000,
    twitterInterval: 30000,
    twitterInfoInterval: 3600000
}


//Read Json Data
jsonfile.readFile(dataFile, function (err, obj) {
    if (obj) {
        robotConfig = obj;
        console.log('Data file loaded');
    }
});

// Set Web Crawlers
robotConfig.watchedCurrencies.forEach(function (key) {
    //Set All Timer seperately
    setInterval(function (key) {

        //Determine URL
        var updateUrl = util.format(robotConfig.updateurl, robotConfig.currencies[key].symbol, robotConfig.currencies[key].convertTo);

        //Request Page
        request(updateUrl, function (error, response, html) {
            //Check No error
            if (!error && response.statusCode == 200) {
                //Load HTML
                var $ = cheerio.load(html);
                var price = $('span.uccResultAmount').first().html();
                //Get Price and check highestPrice
                if (price) {
                    robotConfig.currencies[key].currentPrice = parseFloat(price.replace(",", ""));
                    if (robotConfig.currencies[key].highestPrice < robotConfig.currencies[key].currentPrice) {
                        robotConfig.currencies[key].highestPrice = robotConfig.currencies[key].currentPrice
                    }
                    return price !== null;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        });

    }, robotConfig.crawlerInterval, key);
});

var T = new Twit({
    consumer_key: '',
    consumer_secret: '',
    access_token: '',
    access_token_secret: ''
});



// Set Twitter Senders
robotConfig.watchedCurrencies.forEach(function (key) {
    setInterval(function (key) {
        //Check new highest price
        var willSendTweet = robotConfig.currencies[key].highestPrice > robotConfig.currencies[key].lastPostedPrice;

        if (willSendTweet) {
            //Set Message
            var messageTemplate = "%s yeni bir rekor kırdı. \n\n1 %s = %s %s";
            var message = util.format(
                messageTemplate,
                robotConfig.currencies[key].name,
                robotConfig.currencies[key].name,
                robotConfig.currencies[key].highestPrice,
                robotConfig.currencies[robotConfig.currencies[key].convertTo].name
            );
            
            //Send Message
            console.log('==============Sending Tweet\n');
            console.log(message);
            T.post('statuses/update', { status: message }, function (err, data, response) { });
            robotConfig.currencies[key].lastPostedPrice = robotConfig.currencies[key].highestPrice;
        }
        //Sync Config
        jsonfile.writeFileSync(dataFile, robotConfig);
    }, robotConfig.twitterInterval, key);
});


setInterval(function () {
    var infoMsg = "Dovizde son durum:\n\n";
    var infoEntry = "%s = %s %s";
    robotConfig.watchedCurrencies.forEach(function (key) {
        infoMsg = infoMsg + util.format(infoEntry,robotConfig.currencies[key].name,robotConfig.currencies[key].currentPrice, robotConfig.currencies[robotConfig.currencies[key].convertTo].name)  + "\n";
    });
    console.log('============Sending Info Tweet\n')
    console.log(infoMsg);
    T.post('statuses/update', { status: infoMsg }, function (err, data, response) { });
}, robotConfig.twitterInfoInterval);