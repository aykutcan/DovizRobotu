'use strict';
var request = require('request');
var cheerio = require('cheerio');
var Twit = require('twit');
var jsonfile = require('jsonfile');

process.title = "DovizRobotu";

const dataFile = "./data.json";


var robotConfig = {
    currencies : {
        usd: {
            name: 'Dolar',
            updateurl: 'http://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=TRY',
            lastPrice: 0,
            lastPriceTime: '',
            currentPrice: 0
        },
        eur: {
            name: 'Euro',
            updateurl: 'http://www.xe.com/currencyconverter/convert/?Amount=1&From=EUR&To=TRY',
            lastPrice: 0,
            lastPriceTime: '',
            currentPrice: 0
        },
        xbt: {
            name: 'Bitcoin',
            updateurl: 'http://www.xe.com/currencyconverter/convert/?Amount=1&From=XBT&To=TRY',
            lastPrice: 0,
            lastPriceTime: '',
            currentPrice: 0
        },
        gbp: {
            name: 'Pound',
            updateurl: 'http://www.xe.com/currencyconverter/convert/?Amount=1&From=GBP&To=TRY',
            lastPrice: 0,
            lastPriceTime: '',
            currentPrice: 0
        }
    },
    crawlerFrequency: 5000,
    crawlerTimeout: 10000,
    twitterFrequency: 30000,   
    twitterTimeout: 10000,
    twitterInfoFrequency: 3600000
}


//Read Json Data
jsonfile.readFile(dataFile, function(err, obj) {   
    if(obj){
        robotConfig = obj;
        console.log('Data file loaded');
    }    
});

// Set Web Crawlers
Object.keys(robotConfig.currencies).forEach(function(key) {
    setInterval(function(key){
        request(robotConfig.currencies[key].updateurl, function (error, response, html) {        
            if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var price = $('span.uccResultAmount').first().html();
            if(price){
                robotConfig.currencies[key].currentPrice = parseFloat(price.replace(",", ""));                   
                return price !== null;
            } else {
                console.log('return false');
                return false;
            }  
            } else {
                return true;
            }
        });

    },robotConfig.crawlerFrequency,key);
});

var T = new Twit({
    consumer_key: '',
    consumer_secret: '',
    access_token: '',
    access_token_secret: ''
});


// Set Twitter Senders
Object.keys(robotConfig.currencies).forEach(function(key) {
    setInterval(function(key){
       const willSendTweet = robotConfig.currencies[key].currentPrice > robotConfig.currencies[key].lastPrice;
       if(willSendTweet){
            console.log(robotConfig.currencies[key].name + " yeni rekor kırdı. 1 " + robotConfig.currencies[key].name + " = " +  robotConfig.currencies[key].currentPrice + " TL");
            T.post('statuses/update', 
                { status: robotConfig.currencies[key].name + " yeni rekor kırdı. \n1 " + robotConfig.currencies[key].name + " = " +  robotConfig.currencies[key].currentPrice + " TL" }, 
                function(err, data, response) {
                   
                }
            );
            robotConfig.currencies[key].lastPrice =  robotConfig.currencies[key].currentPrice;
       }
       jsonfile.writeFileSync(dataFile, robotConfig);
    },robotConfig.twitterFrequency,key);
});


setInterval(function(){
    var infoMsg = "Dovizde son durum:\n\n";
    Object.keys(robotConfig.currencies).forEach(function(key) {
            infoMsg = infoMsg + robotConfig.currencies[key].name + " = " + robotConfig.currencies[key].currentPrice + " TL\n";
    });
    console.log('Sending Info Tweet')        
    T.post('statuses/update', { status: infoMsg }, function(err, data, response) {
        console.log(data)
    });    
 },robotConfig.twitterInfoFrequency);