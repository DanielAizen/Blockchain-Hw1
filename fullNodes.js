//libraries
import topology from "fully-connected-topology";
import * as crypto from "crypto";
import sha256  from "crypto-js/sha256.js";
import EC from "elliptic";
import { MerkleTree } from "merkletreejs";

//classes
import Blockchain from "./classes/blockchain.js";
import Transaction from "./classes/transaction.js";

//utils
import { log } from "console";
import { stdin, stdout, argv } from "process";
const {me, peers} = extractPeersAndMyPort()

//const
const hash = crypto.createHash("sha256");
const merkle_tree = new MerkleTree([], sha256);
const Elc = EC.ec;
var ec = new Elc('secp256k1');

//key pair:
const keyPair = ec.genKeyPair();

//initiate blockchian:
const blockchain = new Blockchain();
const puKey = keyPair.getPublic('hex');

//initiate topology
//create Ip's:
const self_ip = toLocalIp(me);
const peer_ip_list = getPeerIps(peers);
//create socket
const sockets = {};


log("\n",'#'.repeat(100));
log(`Keys:`);
log(`public key: ${keyPair.getPublic('hex')}`);
log(`private key: ${keyPair.getPrivate('hex')}`);
log('#'.repeat(100),"\n");


var topology_init = topology(self_ip, peer_ip_list).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp)
    log('connected to peer - ', peerPort)
    sockets[peerPort] = socket

    socket.on('data', data => { //on user input
        const message = data.toString().trim()
        if (message === 'exit') { //on exit
            log('Bye bye')
            exit(0)
        }

        const receiverPeer = extractReceiverPeer(message)
        if (sockets[receiverPeer]) { //message to specific peer
            if (peerPort === receiverPeer) { //write only once
                sockets[receiverPeer].write(formatMessage(extractMessageToSpecificPeer(message)))
            }
        } else { //broadcast message to everyone
            socket.write(formatMessage(message))
        }
    })

    //print data when received
    socket.on('data', data => log(data.toString('utf8')))
})


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

//'hello' -> 'myPort:hello'
function formatMessage(message) {
    return `${me}>${message}`
}

//'127.0.0.1:4000' -> '4000'
function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}

//'4000>hello' -> '4000'
function extractReceiverPeer(message) {
    return message.slice(0, 4);
}

//'4000>hello' -> 'hello'
function extractMessageToSpecificPeer(message) {
    return message.slice(5, message.length);
}