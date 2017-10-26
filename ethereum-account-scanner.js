/**
 * Ethereum Account Scanner
 *
 * To run this, you need your own geth node, accepting RPC
 * connections on a port you can access.
 *
 * Install pre-requisites:
 *     sudo npm install -g web3
 *
 * Usage:
 *     nodejs ./ethereum-account-scanner.js
 */

let Web3 = require('web3');

////////////////////////////////////////////////////////////////////////////////
// BEGIN CONFIGURATION SECTION
////////////////////////////////////////////////////////////////////////////////

/**
 * Location of your geth server
 *
 * It must be running with RPC enabled, and you must have access to
 * connect to it through your and its firewall.
 *
 * @type {{host: string, port: number}}
 */
let gethServer = {
    host: '127.0.0.1', // change this to your geth hostname/IP
    port: 8545 // change this to your geth RPC port
};

/**
 * Address of the Ethereum account you wish to scan
 *
 * Example: 0x0123456789012345678090123456789012345678
 *
 * @type {string}
 */
let wallet = '0x7c5929724341bff5a8816932ca4236c872de653e'; // change this to your Ethereum account number

/**
 * Which block to start scanning.
 *
 * You can start at block 0, but it will take FOREVER to scan,
 * so you probably don't want to do that.
 *
 * Generally speaking on a dual-core CPU that runs both geth
 * and this scanning client, I can scan ~ 300 blocks/second,
 * but in so doing, the CPU maxed at 100%.
 *
 * @type {number}
 */
let firstBlockNumber = 0;

/**
 * Maximum number of threads to create.
 *
 * The higher you set this, the faster the scan will run.  However if
 * you set it too high, you will overload the geth server and/or your
 * client machine and you may start getting networking errors.
 *
 * Generally speaking on a dual-core CPU that runs both geth
 * and this scanning client, I can scan ~ 300 blocks/second,
 * but in so doing, the CPU maxed at 100%.
 *
 * On the same dual-core CPU, settings higher than 200 threads
 * actually SLOW DOWN the processing since the I/O overhead exceeds
 * the capabilities of the machine.  Your results may vary.
 *
 * @type {number}
 */
let maxThreads = 200;

////////////////////////////////////////////////////////////////////////////////
// END CONFIGURATION SECTION
////////////////////////////////////////////////////////////////////////////////

/**
 * Initialize Ethereum Web3 client (if we haven't already)
 * @type {Web3}
 */
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    console.log(`Connecting to geth on RPC @ ${gethServer.host}:${gethServer.port}`);
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider(`http://${gethServer.host}:${gethServer.port}`));
}

/**
 * Scan an individual transaction
 *
 * This is called once for every transaction found between the
 * starting block and the ending block.
 *
 * Do whatever you want with this transaction.
 *
 * NOTE- This is called asynchronously, so the txn/block you
 * see here might have actually happened AFTER the txn/block
 * you see the next time is is called.  To determine
 * synchronicity, you need to look at `block.timestamp`
 *
 * @param {Object} txn (See https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethgettransaction)
 * @param {Object} block The parent block of the transaction (See https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethgetblock)
 */
function scanTransactionCallback(txn, block) {

//    console.log(JSON.stringify(block, null, 4));
//    console.log(JSON.stringify(txn, null, 4));

    if (txn.to === wallet) {

        // A transaction credited ether into this wallet
        var ether = web3.fromWei(txn.value, 'ether');
        console.log(`\r${block.timestamp} +${ether} from ${txn.from}`);

    } else if (txn.from === wallet) {

        // A transaction debitted ether from this wallet
        var ether = web3.fromWei(txn.value, 'ether');
        console.log(`\r${block.timestamp} -${ether} to ${txn.to}`);

    }
}

/**
 * Scan an individual block
 *
 * This is called once for every block found between the
 * starting block and the ending block.
 *
 * Here we just look for transactions in the block, and then
 * we scan each of those.
 *
 * NOTE- This is called asynchronously, so the block you
 * see here might have actually happened AFTER the block
 * you see the next time this is called.  To determine
 * synchronicity, you need to look at `block.timestamp`
 *
 * @param {Object} block (See https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethgetblock)
 */
function scanBlockCallback(block) {

    if (block.transactions) {
        for (var i = 0; i < block.transactions.length; i++) {
            var txn = block.transactions[i];
            scanTransactionCallback(txn, block);
        }
    }
}

/**
 * Scan a range of blocks
 *
 * Spawn up to `maxThreads` threads to scan blocks in the
 * range provided.
 *
 * Note that if you pass undefined for `stoppingBlock`, its
 * value will be computed at the beginning of the function,
 * so any blocks added during the scan will not be processed.
 *
 * @param {number|hex} startingBlock First block to scan.
 * @param {number|hex} stoppingBlock (Optional) Last block to scan. If undefined, scan all blocks.
 * @param {function} callback Function to call after this range has been fully scanned.
 * It must accept these arguments: (error, lastScannedBlockNumber)
 * @returns {number} Number of threads started. They will continue working asynchronously in the background.
 */
function scanBlockRange(startingBlock, stoppingBlock, callback) {

    // If they didn't provide an explicit stopping block, then read
    // ALL of the blocks up to the current one.

    if (typeof stoppingBlock === 'undefined') {
        stoppingBlock = web3.eth.blockNumber;
    }

    // If they asked for a starting block that's after the stopping block,
    // that is an error (or they're waiting for more blocks to appear,
    // which hasn't yet happened).

    if (startingBlock > stoppingBlock) {
        return -1;
    }

    let blockNumber = startingBlock,
        gotError = false,
        numThreads = 0,
        startTime = new Date();

    function getPercentComplete(bn) {
        var t = stoppingBlock - startingBlock,
            n = bn - startingBlock;
        return Math.floor(n / t * 100, 2);
    }

    function exitThread() {
        if (--numThreads == 0) {
            var numBlocksScanned = 1 + stoppingBlock - startingBlock,
                stopTime = new Date(),
                duration = (stopTime.getTime() - startTime.getTime())/1000,
                blocksPerSec = Math.floor(numBlocksScanned / duration, 2),
                msg = `Scanned to block ${stoppingBlock} (${numBlocksScanned} in ${duration} seconds; ${blocksPerSec} blocks/sec).`,
                len = msg.length,
                numSpaces = process.stdout.columns - len,
                spaces = Array(1+numSpaces).join(" ");

            process.stdout.write("\r"+msg+spaces+"\n");
            if (callback) {
                callback(gotError, stoppingBlock);
            }
        }
        return numThreads;
    }

    function asyncScanNextBlock() {

        // If we've encountered an error, stop scanning blocks
        if (gotError) {
            return exitThread();
        }

        // If we've reached the end, don't scan more blocks
        if (blockNumber > stoppingBlock) {
            return exitThread();
        }

        // Scan the next block and assign a callback to scan even more
        // once that is done.
        var myBlockNumber = blockNumber++;

        // Write periodic status update so we can tell something is happening
        if (myBlockNumber % maxThreads == 0 || myBlockNumber == stoppingBlock) {
            var pctDone = getPercentComplete(myBlockNumber);
            process.stdout.write(`\rScanning block ${myBlockNumber} - ${pctDone} %`);
        }

        // Async call to getBlock() means we can run more than 1 thread
        // at a time, which is MUCH faster for scanning.

        web3.eth.getBlock(myBlockNumber, true, (error, block) => {

            if (error) {
                // Error retrieving this block
                gotError = true;
                console.error("Error:", error);
            } else {
                scanBlockCallback(block);
                asyncScanNextBlock();
            }
        });
    }

    var nt;
    for (nt = 0; nt < maxThreads && startingBlock + nt <= stoppingBlock; nt++) {
        numThreads++;
        asyncScanNextBlock();
    }

    return nt; // number of threads spawned (they'll continue processing)
}

// Scan all blocks from the starting block up to current,
// and then keep scanning forever.

scanBlockRange(firstBlockNumber, undefined);