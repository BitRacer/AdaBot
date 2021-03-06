'use strict';

//firebase
const functions = require('firebase-functions');
//google actions
const {actionssdk} = require('actions-on-google');
const app = actionssdk({debug: true});
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const axios = require('axios');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  const agent = new WebhookClient({ request, response });
  const parameters = request.body.queryResult.parameters;
  let conv = agent.conv();

  const domainName = conv.user.storage.server;
  const theKey = conv.user.storage.apiKey;
  const dataURL = `https://` + domainName + `/api/data?token=` + theKey;
  const enableSomURL = `https://` + domainName + `/api/sellOnlyMode?token=` + theKey;
  const disableSomURL = `https://` + domainName + `/api/sellOnlyMode?token=` + theKey;
  
  let instance = axios.create({timeout: 5000});

  function checkSettings(agent) {
    if(!domainName && !theKey) {
      agent.add(`You need to add your server and API key.`);
    }
    else if (! domainName) {
      agent.add(`You need to add your server.`);
    }
    else if(! theKey) {
      agent.add(`You need to add API key.`);
    }  
    if(domainName && theKey) {
      return true;
    }
    else {
      return false;
    }
  }

  function welcome(agent) {
    // conv.ask(new SimpleResponse({
    //   speech: 'Welcome to ProfitTrailer.  I can do a few things for you.  Here are a few ideas.',
    //   text: 'Welcome to ProfitTrailer.  I can do a few things for you.  Here are a few ideas.',
    // }));    
    agent.add(`Welcome to Profit Trailer.`);
    checkSettings(agent);
  }

  function getExchange(agent) {
    //console.log("Getting Exchange");
    //console.log(`dataURL=` + dataURL);
    if(checkSettings(agent)) {
      return instance.get(dataURL)
        .then(response => agent.add(`Your exchange is ` + response.data.exchange))
        .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
    }   
  }

  function getMarket(agent) {
    //console.log("Getting Market");
    if(checkSettings(agent)) {
      return instance.get(dataURL)
        .then(response => agent.add(`Your market is ` + response.data.market))
        .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
    }
  }

  function getCurrency(agent) {
    //console.log("Getting Market");
    if(checkSettings(agent)) {
      return instance.get(dataURL)
        .then(response => agent.add(`Your currency is ` + response.data.settings.currency))
        .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
    }
  }

  // need to handle MARKET/currency rather than assuming BTCUSD
  function getPrice(agent) {
    if(checkSettings(agent)) {
      return instance.get(dataURL)
        .then(response => agent.add(`Your the current price for ` + response.data.market +  ` is ` + response.data.BTCUSDTPrice + ` ` + response.data.settings.currency))
        .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
    }
  }

    // need to handle MARKET/currency rather than assuming BTCUSD
    function getYesterdayProfit(agent) {
      if(checkSettings(agent)) {
        return instance.get(dataURL)
          .then(response => agent.add(`Yesterdays profit was  ` +  (response.data.BTCUSDTPrice * response.data.totalProfitYesterday).toFixed(2) + ` ` + response.data.settings.currency))
          .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
      }
    }
    function getTodayProfit(agent) {
      if(checkSettings(agent)) {
        return instance.get(dataURL)
          .then(response => agent.add(`Todays profit is  ` +  (response.data.BTCUSDTPrice * response.data.totalProfitToday).toFixed(2) + ` ` + response.data.settings.currency))
          .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
      }
    }
    function getWeeklyProfit(agent) {
      if(checkSettings(agent)) {
        return instance.get(dataURL)
          .then(response => agent.add(`This weeks profit is  ` +  (response.data.BTCUSDTPrice * response.data.totalProfitWeek).toFixed(2) + ` ` + response.data.settings.currency))
          .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
      }
    }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  // function getBalance(agent) {
  //   //console.log("Getting Balance");
  //   if(checkSettings(agent)) {
  //     return instance.get(dataURL)
  //       .then(response => agent.add(`Your balance is ` + response.data.realBalance + " " + response.data.market))
  //       .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
  //   } 
  // }
  function getValue(agent) {
    //console.log("Getting Value");
    if(checkSettings(agent)) {
      return instance.get(dataURL)
        .then(response => agent.add(`The value of your account is $` + ((response.data.realBalance + response.data.totalDCACurrentValue + response.data.totalPairsCurrentValue) * response.data.BTCUSDTPrice).toFixed(2) ))
        .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
    }
  }

  // function getDCAValue(agent) {
  //   //console.log("Getting DCA Value");
  //   if(checkSettings(agent)) {
  //     return instance.get(dataURL)
  //       .then(response => agent.add(`Your DCA value is $` + (response.data.DCABalance * response.data.BTCUSDTPrice).toFixed(2)  ))
  //       .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
  //   }
  // }

  // function getDCABalance(agent) {
  //   //console.log("Getting DCA Balance");
  //   if(checkSettings(agent)) {
  //     return instance.get(dataURL)
  //     .then(response => agent.add(`Your DCA balance is ` + response.data.DCABalance + ` ` + response.data.market))
  //     .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
  //   }
  // }
  
  function getMarketChange(agent) {
    //console.log("Getting Market Change");
    if(checkSettings(agent)) {
      return instance.get(dataURL)
        .then(response => agent.add(`The change in ` + response.data.market + ` in the last 24 hours is ` + response.data.BTCUSDTPercChange + ` percent`))
        .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
    }
  }

  function setKey(agent) {
    var myRegexp = /my (?:key|API key) is (.*)/gi;
    var queryText = request.body.queryResult.queryText;
    var match = myRegexp.exec(queryText);
    conv.user.storage.apiKey = match[1];
    conv.ask('Ok, saving ' + match[1]);
    agent.add(conv);
  }

  function getKey(agent) {
    agent.add(`Your current key is ` + conv.user.storage.apiKey);
  }

  function setServer(agent) {
    var myRegexp = /my (?:server|domain) is (.*)/gi;
    var queryText = request.body.queryResult.queryText;
    var match = myRegexp.exec(queryText);
    conv.user.storage.server = match[1];
    conv.ask('Ok, saving ' + match[1]);
    agent.add(conv);
  }

  function getServer(agent) {
    agent.add(`Your current server is ` + conv.user.storage.server);
  }

  function clearSettings() {
    conv.user.storage.apiKey = null;
    conv.user.storage.server = null;
    conv.ask(`Ok cleared the server and API Key`);
    agent.add(conv);
  }

  function enableSOM(agent) {
    console.log(`enableSomURL=` + enableSomURL);
    if(checkSettings(agent)) {
      return instance.get(enableSomURL, {params: {enabled: 'true', type: 'GoogleAction'}} )
        .then(response => agent.add(`Sell only mode has been enabled.`))
        .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
    } 
  }

  function disableSOM(agent) {
    //console.log(`disableSomURL=` + disableSomURL);
    if(checkSettings(agent)) {
      return instance.get(disableSomURL, {params: {enabled: 'false', type: 'GoogleAction'}} )
        .then(response => agent.add(`Sell only mode has been disabled.`))
        .catch(error => agent.add(`There was an error.  Your service returned a ` + error.response.status + ` ` + error.response.reason))
    } 
  }

  // function suggestions(agent) {

  // }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  // intentMap.set('Get Balance', getBalance);
  intentMap.set('Get Value', getValue);
  // intentMap.set(`Get DCA Balance`, getDCABalance);
  // intentMap.set(`Get DCA Value`, getDCAValue);
  intentMap.set('Get Exchange', getExchange);
  intentMap.set('Get Market', getMarket);
  intentMap.set(`Get Market Change`, getMarketChange);
  intentMap.set(`Get Currency`, getCurrency);
  intentMap.set(`Get Price`, getPrice);
  intentMap.set(`Set Key`, setKey);  
  intentMap.set(`Get Key`, getKey);
  intentMap.set(`Set Server`, setServer);  
  intentMap.set(`Get Server`, getServer);
  intentMap.set(`Clear Settings`, clearSettings);    
  intentMap.set(`EnableSOM`, enableSOM);
  intentMap.set(`DisableSOM`, disableSOM); 
  intentMap.set(`Get Todays Profit`, getTodayProfit);
  intentMap.set(`Get Yesterdays Profit`, getYesterdayProfit);
  intentMap.set(`Get Weekly Profit`, getWeeklyProfit);
  //intentMap.set(`Suggestions`, suggestions);   

  agent.handleRequest(intentMap);
});

