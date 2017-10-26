var FhirHashes = artifacts.require("./FhirHashes.sol");

module.exports = function(deployer) {
  deployer.deploy(FhirHashes);
};
