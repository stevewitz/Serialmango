/**
 * Created by Steve on 9/30/13.
 */

MongoClient = require('mongodb').MongoClient;
var os = require('os');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');

exports.websocketDataIn = function(data){
    // if you want to get socket data it's here!!
};

exports.socketDataOut  = function(data)
{
   //console.log(data);

   try{
       var serialData = JSON.parse(data);

   }
   catch(err)
   {
       console.log("parse serial data error"+err)
   }
    if(serialData)
    {
        //serialData.Time = new Date(serialData.Time);
        serialData.Time = new Date();

    }
    else
    {
        console.log("serialData.time not defined");
        return;
    }
    //console.log(serialData.Time);
   if (global.collectionLog){

       collectionLog.insert(serialData, {w:1}, function(err, result) {
     //  collectionLog.insert({"test":1}, {w:1}, function(err, result) {
        console.log(result);
    });
   }
    else
   {
       console.log("Serial data rec - no database connections yet;")
   }


         try
        {
           serialData.datatype="Sensor Update";
            global.websocket.send(JSON.stringify(serialData));
        }
        catch(err)
        {
            console.log("ws error"+err);
        }
 //  console.log("Sending ws");
//    if (global.collectionLog){
//    collectionLog.find({'UnitID':1}).sort( { _id : -1 } ).limit(100).toArray(function(err,item)
//    {
//     if (err){
//         console.log("Error in mongo find"+err);
//         return;
//     }
//      //  console.log(item[0].Time);
//        try
//        {
//            global.websocket.send(JSON.stringify(item));
//        }
//        catch(err)
//        {
//
//        }
//      });
//    }
};


exports.setup = function()
{
    MongoClient.connect("mongodb://10.6.1.119:27017/test", function(err, db)
    {
        if (err)
        {
            console.log("Connection to mongo failed:"+err)  ;
        }
        else
        {
            console.log("TWI: We are connected to mondo test database");
            global.collectionLog = db.collection('todd');
            global.collectionAvg = db.collection('avg');
           setInterval(function(){updateAvg();},60000);
           // updateAvg();
            console.log("average updates set to 60 seconds");
        }
    });


    //iterate through all of the system IPv4 addresses
    // we should connect to address[0] with the webserver
    //so lets grab it and make a global variable to
    //use elseware
    var interfaces = os.networkInterfaces();
    global.addresses = [];
    for (k in interfaces) {
        for (k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family == 'IPv4' && !address.internal) {
                addresses.push(address.address)
            }
        }
    }
    console.log('My IP Address is: ' + addresses[0]);

    //now lets find out if we are on a windows system
    // if we are open the required com port
    //if not open the pi port
    console.log("Host System Name: " + os.type());
    if(os.type() == 'Windows_NT')
    {
        comlib.openSerialPort('com17'); //windows
    }
    else
    {

        comlib.openSerialPort("/dev/ttyACM0"); //not windows
    }

    //set up all routes HERE


    app.get('/com', routes.com);
    app.get('/', routes.index);
    app.get('/users', user.list);
    app.get('/data', routes.data);
};

function updateAvg()
{
    // update the average temp collection
    collectionLog.find({},{Time : 1 ,_id: 0 }).sort( { _id : -1 } ).limit(1).toArray(function(err,item){
        console.log("latest item "+item[0].Time);
        var curPeriod = item[0].Time.setSeconds(0)-60000;

        collectionAvg.find({},{Time : 1 ,_id: 0 }).sort( { _id : -1 } ).limit(1).toArray(function(err,aitem){
            // now find the most recent avg time entry
            console.log("Last avg entry"+aitem[0].Time);
            var lastavg = aitem[0].Time.getTime();
            console.log("lastavg"+lastavg);
            for (var i = lastavg+60000; i <= curPeriod; i=i+60000){

                console.log("Running Sensor averages for:"+new Date(i));
                avgReadings(new Date(i),60);
            }
        });

    });
}
function avgReadings(startTime,seconds)
{
    startTime.setSeconds(0);
    console.log(startTime);
    var avgitem = [];
    var avgitemcount = [];
    collectionLog.find({"Time":{$gte : startTime,$lte : new Date(startTime.getTime()+(seconds*1000))}}).toArray(function(err,item)
    {

        if (err){
            console.log("Error in mongo find: "+err);
            return;
        }
        item.forEach(function(initem)
        {


            for(var prop in initem){
                if (prop.substr(0,4) == 'Temp'){
                    if(avgitem[prop]){
                        avgitem[prop]=avgitem[prop]+(initem[prop]);
                        avgitemcount[prop]=avgitemcount[prop]+1;
                    }else
                    {
                        avgitem[prop]=(initem[prop]);
                        avgitemcount[prop]=1;
                    }


                }

                //   console.log(prop + 'is ' + initem[prop]);
            }

        });



        for(var prop in avgitem){
            avgitem[prop]=Math.round((avgitem[prop]/avgitemcount[prop])*100)/100;
        }
        avgitem.Time = startTime;
        //console.log(avgitem);
        global.collectionAvg.update({"Time":startTime} ,avgitem ,{ upsert: true },function (err,res){
       //     console.log("res"+res);
        });



    });

}