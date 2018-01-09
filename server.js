var http = require('http');
var path = require('path');
var crypto = require('crypto');


var async = require('async');
var amdloader = require("amd-loader");
var fs = require('fs');
var socketio = require('socket.io');
var express = require('express');
var Web3 = require('web3');
var web3 = new Web3();

var json_stringify_deterministic = require('./client/js/json_stringify_deterministic');
const InputDataDecoder = require('ethereum-input-data-decoder');
var abi = JSON.parse(fs.readFileSync('build/contracts/FhirHashes.json'));
const decoder = new InputDataDecoder(abi.abi);

var provider = new web3.providers.HttpProvider();
web3.setProvider(provider);

var contract = require('truffle-contract');
var fhir_artifacts = require('./build/contracts/FhirHashes.json');
var fhir = contract(fhir_artifacts);
fhir.setProvider(provider);

fhir.currentProvider.sendAsync = function () {
    return fhir.currentProvider.send.apply(fhir.currentProvider, arguments);
};

var address = '0xaeab34f5ad9479a9fe221672780ed09d29802651';
//var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
web3.eth.getAccounts().then(function(a) {
   address = a[0];
   console.log("address " + address);
   web3.eth.defaultAccount = address;
   console.log(web3.utils.isAddress(address));
   web3.eth.getBalance(address, function(error, result){
       console.log("balance " + result);
   });
});



//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var bodyParser = require('body-parser');
var json_body_parser = bodyParser.json();
router.use(json_body_parser);

var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));

router.post('/hash', function (req, res) {
  console.log(' Body : ' + JSON.stringify(req.body));
  var fhirResource = req.body
  var con = json_stringify_deterministic(fhirResource, null, 2);
  var hash = crypto.createHash('sha256').update(con).digest('hex');
  res.send({hash: hash})
});

router.post('/tx', function (req, res) {

    console.log(' Body : ' + JSON.stringify(req.body));

    fhir.deployed().then(function(instance) {
        console.log("deployed");
        console.log(req.body.url, req.body.hash)
        instance.storeHash(req.body.url, req.body.hash, {from: address, gas: 1000000}).then(function(tx) {
            console.log("store");
            console.dir(tx);
            // console.dir(res);
            res.send(tx);
        });

    });
});

router.post('/verify', function (req, res) {

    console.log(' Body : ' + JSON.stringify(req.body));

    fhir.deployed().then(function(instance) {
        console.log("deployed");
        // console.dir(instance);
        instance.checkHash.call(req.body.url, req.body.hash).then(function(result) {
            console.log("ispresent " + result);
            res.send({ result : result});
        });

});
});

router.get('/nrOfBlocks', function (req, res) {

    web3.eth.getBlockNumber().then(function(blockNum) {
        console.log("blockNum : " + blockNum);
        const blocks = [];
        res.send({ nrOfBlocks : blockNum});
    });
});

router.get('/block/:blockNum', function (req, res) {
        var blockNum = req.params.blockNum;

        console.log("Get blockNum : " + blockNum);


            web3.eth.getBlock(blockNum).then(function(block){
                // console.log(JSON.stringify(block));
                res.send(block);
            });


});

router.get('/transaction/:txid', function (req, res) {
        var txid = req.params.txid;

        console.log("Get blockNum : " + txid);


            web3.eth.getTransaction(txid).then(function(block){
                block.translatedInput = decoder.decodeData(block.input);
                console.log(JSON.stringify(block));
                res.send(block);
            });


});



var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("1upHealth provenance server listening at", addr.address + ":" + addr.port);
});
