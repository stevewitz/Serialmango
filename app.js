
/**
 * Module dependencies.
 */
/*                                                                       */
/*                                                                       */
/*              Select one of the two lines below                        */
/*              for Todd's branch or Steve's branch                      */
/*                                                                       */

               //global.branch = 'twi';
                global.branch = 'cs4';

/*                                                                       */
/*                                                                       */
/*                                                                       */
/*                                                                       */



var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var WebSocketServer = require('ws').Server;
var MongoClient = require('mongodb').MongoClient;

global.comlib = require('./comlib');


//Set up all express stuff
app = express();

app.set('port', 3000); // This is a default port.  Change here only if necessary
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//  All route information now is contined in
//  TWI.js or CS4.js


// Set up the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


//Set up the web socket here.. Default port is 8080
wss = new WebSocketServer({port: 8080}, function(err,res){

  //  console.log(wss.url);
    if (err){
        console.log("Websocket error:"+err);
    }
    else
    {
        console.log("Websocket server Listening");
    }
});



//Set up Web socket for a connection and make it global
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
    console.log('received: %s', message);
    if(branch == 'twi')
    {
        twi.websocketDataIn(message)();
    }
    else if(branch == 'cs4')
    {
        cs4.websocketDataIn(message);
    }
    });
    global.websocket=ws;
    ws.send('Log Window Now Active');


});

/*
    Set up for the desired branch
    All code for each branch is contained
    in TWI.js OR CS4.js

    This should keep a common set of
    stuff so we are on the same page

 */

if(branch == 'twi')
{
// Connect to the db
   var twi = require('./twi');
  twi.setup();
}
else if(branch == 'cs4')
{
    var cs4 = require('./cs4');
    cs4.setup();
}




