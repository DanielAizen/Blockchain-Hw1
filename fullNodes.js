//libraries
import topology from "fully-connected-topology";
import * as crypto from "crypto";
import sha256  from "crypto-js/sha256.js";
import EC from "elliptic";
import { MerkleTree } from "merkletreejs";

//classes
import Blockchain from "./classes/blockchain.js";
import { Transaction } from "./classes/transaction.cjs";

//utils
import { log } from "console";
import { argv } from "process";
const {me, peers} = extractPeersAndMyPort()

//const
const hash = crypto.createHash("sha256");
const merkle_tree = new MerkleTree([], sha256);
const Elc = EC.ec;
var ec = new Elc('secp256k1');
var checkHash;

//key pair:
const keyPair = ec.genKeyPair();

//initiate blockchian:
const blockchain = new Blockchain();
const pubKey = keyPair.getPublic('hex');

//initiate topology
//create Ip's:
const self_ip = toLocalIp(me);
const peer_ip_list = getPeerIps(peers);
//create socket
const sockets = {};


log('#'.repeat(100));
log(`Keys:`);
log(`public key: ${keyPair.getPublic('hex')}`);
log(`private key: ${keyPair.getPrivate('hex')}`);
log('#'.repeat(100),"\n");

// Key maps
// public
const pub_key_map = new Map();
pub_key_map.set('alice',
            '0477c5ca69bc1d3a24e543cc30bab6806fc62322887c02cb539443b0aa033bceb7933dd3224d6028953b9632ef88597f26acaedf05a1ef2297f0bb8bfc312e9e83');
pub_key_map.set('bob',
            '048252e04df2675028aa6dfa25ca96cbcd6d86fffd0ef601f21beddc5035039eb2138996dd66ebf7f9b43c1fa578ffc588f947b8f18d5c6bc60159f1f0a5c176b9');
// private
const pri_key_map = new Map();
pri_key_map.set('alice',
            '847231295f6438af70642b0f9f83a85cb486fd1886c1572c15453f5e0038bfcb');
pri_key_map.set('bob',
            '0d25b90f7b60a41ef46a43d724ebac4b5aba2d5e8b9204214327ecd8afaf0b97');

var topology_init = topology(self_ip, peer_ip_list).on("connection", (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);
    console.log("*".repeat(89));
    console.log('connected to peer - ', peerPort);
    console.log("*".repeat(89));
    sockets[peerPort] = socket;
    
    socket.on("data", (data) => {
        if (data.includes("fromAddress")) {
            let pendingTx = JSON.parse(data.toString());
            const newTransaction = new Transaction(
                pendingTx.fromAddress,
                pendingTx.toAddress,
                pendingTx.amount,
                pendingTx.timestamp,
                pendingTx.signature,
                pendingTx.tip
            );
            console.log("#".repeat(89));
            console.log(newTransaction);
            console.log("#".repeat(89));
            blockchain.addTransaction(newTransaction)
            if (blockchain.pendingTransactions.length === 3) {
                blockchain.minePendingTransactions(pubKey);
            }
        }
        if (data.includes("balance") && blockchain.pendingTransactions.length === 0) {
            console.log("#".repeat(89));
            console.log("pending : ", blockchain.pendingTransactions);
            console.log("bob has ", blockchain.getBalanceOfAddress(pub_key_map.get('bob')));
            console.log("alice has ", blockchain.getBalanceOfAddress(pub_key_map.get('alice')));
            console.log("miner has ", blockchain.getBalanceOfAddress(pubKey));
            console.log("Total mined coins: ", blockchain.getTotalMinedCoins());
            console.log("Total burned coins: ", blockchain.getTotalBurnedCoins());
            console.log("Total coins in network: ", blockchain.getNetworkCoins());
            console.log("#".repeat(89));
            exit(0);
        }
        if (data.includes("check")){ // check if data is check request.
            var checkHash = String(data).split(' ')
            var flag = blockchain.verifyTransactionExist(checkHash[1]) // validate transaction in block using merkle tree.
            socket.write(`isTransactionExist result with the hash: ${checkHash[1]} is ${flag}` ) // send back result.
        }
    });
});


//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
    return {
        me: argv[2],
        peers: argv.slice(3, argv.length)
    }
}

//'4000' -> '127.0.0.1:4000'
function toLocalIp(port) {
    return `127.0.0.1:${port}`
}

//['4000', '4001'] -> ['127.0.0.1:4000', '127.0.0.1:4001']
function getPeerIps(peers) {
    return peers.map(peer => toLocalIp(peer))
}


//'127.0.0.1:4000' -> '4000'
function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}
