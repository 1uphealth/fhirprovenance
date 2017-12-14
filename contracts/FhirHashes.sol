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

    mapping(string=>string) private map;

    function parseAddr(string _a) internal returns (address){
      bytes memory tmp = bytes(_a);
      uint160 iaddr = 0;
      uint160 b1;
      uint160 b2;
      for (uint i=2; i<2+2*20; i+=2){
          iaddr *= 256;
          b1 = uint160(tmp[i]);
          b2 = uint160(tmp[i+1]);
          if ((b1 >= 97)&&(b1 <= 102)) b1 -= 87;
          else if ((b1 >= 48)&&(b1 <= 57)) b1 -= 48;
          if ((b2 >= 97)&&(b2 <= 102)) b2 -= 87;
          else if ((b2 >= 48)&&(b2 <= 57)) b2 -= 48;
          iaddr += (b1*16+b2);
      }
      return address(iaddr);
    }

    function bytes32ToString(bytes32 x) constant returns (string) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;
        for (uint j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }

    function strConcat(string _a, string _b, string _c, string _d, string _e) internal returns (string){
        bytes memory _ba = bytes(_a);
        bytes memory _bb = bytes(_b);
        bytes memory _bc = bytes(_c);
        bytes memory _bd = bytes(_d);
        bytes memory _be = bytes(_e);
        string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
        bytes memory babcde = bytes(abcde);
        uint k = 0;
        for (uint i = 0; i < _ba.length; i++) babcde[k++] = _ba[i];
        for (i = 0; i < _bb.length; i++) babcde[k++] = _bb[i];
        for (i = 0; i < _bc.length; i++) babcde[k++] = _bc[i];
        for (i = 0; i < _bd.length; i++) babcde[k++] = _bd[i];
        for (i = 0; i < _be.length; i++) babcde[k++] = _be[i];
        return string(babcde);
    }

    function strConcat(string _a, string _b, string _c) internal returns (string) {
        return strConcat(_a, _b, _c, "", "");
    }

    /** storeHash: puts resource hash on the blockchain
     * if not, then store a signature associated with a url (fhir resource)
     * params:
     * hashedUrl: the 32 bytes hash of the url of the resource:
     * hashedResource: the 32 bytes hash or the fhir resource
     * signature: a new variable, resulting from the mapping of a string (named 'signature')
     *  to bytes ('signature')
     */
    function storeHash(string hashedUrl, string hashedResource) {
        map["x"] = "hi";
        // hashestr = strConcat(hashestr, bytes32ToString(hashedUrl), bytes32ToString(hashedResource));
        // hashes[bytes32ToString(hashedUrl)] = bytes32ToString(hashedResource);
        hashes[sha3(hashedUrl)] = hashedResource;
    }

    function toBytes(address a) constant returns (bytes b){
       assembly {
            let m := mload(0x40)
            mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
            mstore(0x40, add(m, 52))
            b := m
       }
    }

    /** check if the signature of an URL is present in the blockchain */
    function checkHash(string hashedUrl, string hashedResource) constant returns (string) {
        // return JSON.stringify(hashes);
        // return hashes[hashedUrl];
        // return map["x"];
        return strConcat(hashes[sha3(hashedUrl)], hashedUrl, map["x"]);
        // return hashestr;
    }


    // end of contract FhirHashes

}
