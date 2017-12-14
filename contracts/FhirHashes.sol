pragma solidity ^0.4.15;


// import contract1.sol
// import contract2.sol


/** title FHIRsignatures contract
 * This contracts stores a mapping from a (versioned) fhir resource url to a signature
 *  in de testfuncties roep je dit contract aan samen met een URL en een hash.
 */

contract FhirHashes {
    address owner;

    /***** general functions ****/

    /** Store address that created this contract as owner */
    function FhirHashes() {
        owner = msg.sender;
    }

    /** modifier for owner-only actions:
     * if the sender isn the owner then he/she cannot do anything
     * alternatively, if the sender is the owner, then the sender can modify the contract
     */
    modifier owner_only() {
        if (msg.sender == owner) {
            _;
        }
    }

    /** stop the contract
     *  function to ensure that only the owner can terminate the contract
     */
    function terminate() owner_only {
        selfdestruct(owner);
    }

    /** return the owner: displays the address of the contract owner */
    function getOwner() constant returns (address) {
        return owner;
    }

    /** map fhir hashed url's to fhir resource hashes
     * 'mapping' is not a function or a variable, but a data structure
     * here, a new private 'mapping' data structure is created, named 'hashes'
     * so here we create a variable/parameter named 'signatures' of type 'mapping'
     */
    mapping (bytes32 => string) private hashes;
    string private hashestr;

    /** storeHash: puts resource hash on the blockchain
     * if not, then store a signature associated with a url (fhir resource)
     * params:
     * hashedUrl: the 32 bytes hash of the url of the resource:
     * hashedResource: the 32 bytes hash or the fhir resource
     * signature: a new variable, resulting from the mapping of a string (named 'signature')
     *  to bytes ('signature')
     */
    function storeHash(string hashedUrl, string hashedResource) {
        hashes[sha3(hashedUrl)] = hashedResource;
    }

    /** check if the signature of an URL is present in the blockchain */
    function checkHash(string hashedUrl, string hashedResource) constant returns (bool) {
        return keccak256(hashes[sha3(hashedUrl)]) == keccak256(hashedResource);
    }


    // end of contract FhirHashes

}
