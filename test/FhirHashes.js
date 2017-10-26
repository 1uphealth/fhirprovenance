
var FhirHashes = artifacts.require("./FhirHashes.sol");
var hash = require("sha256");

contract('FhirHashes', function(accounts) {


    // add URL1 and hash 12345678 and check if hash '12345678' and url 'url1' are present in the blockchain
    var inst;
    it("checkHash should return true if the stored hash matches the given hash for the url", function() {
        var url = "http://www.1uphealth.com/patient/10/_history/1";
        var hashedUrl = hash(url);

        var resource = "{name :  'name', id='id'}";
        var hashedResource = hash(resource);

        // Need to convert the javascript string to a Solidity string so that it is
        // automatically cast to bytes32 when calling the smart contract
        var hashedUrlString = new String(hashedUrl);
        var hashedResourceString = new String(hashedResource);

        return FhirHashes.deployed().then(function(instance) {
            inst = instance;
            return instance.storeHash(hashedUrlString.valueOf(), hashedResourceString.valueOf());
        }).then(function(tx) {
            console.log(tx);
            return inst.checkHash.call(hashedUrlString.valueOf(), hashedResourceString.valueOf());
        }).then(function(check) {
            assert.equal(check, true, "url that has not been added is not present");
        });
    });

    it("checkHash should return false if the stored hash does not match the given hash for the url", function() {
        var url = "http://www.1uphealth.com/patient/10/_history/1";
        var hashedUrl = "0x"+ hash(url);
        console.log("hashedUrl : " + hashedUrl);

        var resource = "{name :  'name', id='id'}";
        var hashedResource = "0x"+hash(resource);
        console.log("hashedResource : " + hashedResource);

        var otherResource = "{name :  'name2', id='id'}";
        var incorrectHashedResource = "0x"+hash(otherResource);

        // Need to convert the javascript string to a Solidity string so that it is
        // automatically cast to bytes32 when calling the smart contract
        var hashedUrlString = new String(hashedUrl);
        var hashedResourceString = new String(hashedResource);
        var incorrectHashedResourceString = new String(incorrectHashedResource);

        return FhirHashes.deployed().then(function(instance) {
            inst = instance;
            return instance.storeHash(hashedUrlString.valueOf(), hashedResourceString.valueOf());
        }).then(function(tx) {
            console.log(tx);
            return inst.checkHash.call(hashedUrlString.valueOf(), incorrectHashedResourceString.valueOf());
        }).then(function(check) {
            assert.equal(check, false, "url that has not been added is not present");
        });
    });

});
