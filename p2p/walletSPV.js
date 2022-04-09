// Libraries
const topology = require('fully-connected-topology');
const EC = require('elliptic').ec;
// Classes
const { Transaction } = require('../classes/transaction.cjs');
// Utils
const { argv } = process;
const { log } = console;
// Constants
const { me, name, peers } = extractPeersAndMyPort();
const sockets = {};
const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);
const json_trans = require("../transactions.json");
const ec = new EC("secp256k1");
// Variables
let idx = 0;
let first_sender = true;
var checkHash;
// Key maps
// public
let pub_key_map = new Map();
pub_key_map.set('alice',
            '0477c5ca69bc1d3a24e543cc30bab6806fc62322887c02cb539443b0aa033bceb7933dd3224d6028953b9632ef88597f26acaedf05a1ef2297f0bb8bfc312e9e83');
pub_key_map.set('bob',
            '048252e04df2675028aa6dfa25ca96cbcd6d86fffd0ef601f21beddc5035039eb2138996dd66ebf7f9b43c1fa578ffc588f947b8f18d5c6bc60159f1f0a5c176b9');
// private
let pri_key_map = new Map();
pri_key_map.set('alice',
            '847231295f6438af70642b0f9f83a85cb486fd1886c1572c15453f5e0038bfcb');
pri_key_map.set('bob',
            '0d25b90f7b60a41ef46a43d724ebac4b5aba2d5e8b9204214327ecd8afaf0b97');

log('---------------------');
log('Welcome to p2p chat!');
log('me - ', me);
log('peers - ', peers);
log('connecting to peers...');


//connect to peers
var topology_init = topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);
    log('connected to peer - ', peerPort);

    const handleSingleTransaction = (socket) => {
        if (json_trans.transactions[idx] !== undefined) {
            if (json_trans.transactions[idx].fromAddress === name) {
                let privateKey = ec.keyFromPrivate(pri_key_map.get(name), "hex");
                const tx = new Transaction(
                    pub_key_map.get(name),
                    pub_key_map.get(name === "alice" ? "bob" : "alice"),
                    json_trans.transactions[idx].amount,
                    undefined,
                    undefined,
                    json_trans.transactions[idx].tip !== undefined ? 1 : 0
                );
                tx.signTransaction(privateKey);
                let buf = Buffer.from(JSON.stringify(tx))
                console.log(tx);
                checkHash = tx.calculateHash();
                socket.write(buf);
            }
            idx++;
            
        } else {
            if (name === "bob") {
                setTimeout(() => socket.write(`check ${checkHash}`), 3000)
                setTimeout(() => socket.write("balance"), 6000)
            }
        }
    };

    sockets[peerPort] = socket;

    if ((name === "bob") && first_sender) {
        setTimeout(() => setInterval(() => handleSingleTransaction(socket), 3000), 12500);
        first_sender = false;
    } else {
        setInterval(() => handleSingleTransaction(socket), 3000);
    }
    socket.on('data', data => log(data.toString('utf8')));
});


//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
    return {
        name: argv[2],
        me: argv[3],
        peers: argv.slice(4, argv.length)
    };
}

//'4000' -> '127.0.0.1:4000'
function toLocalIp(port) {
    return `127.0.0.1:${port}`;
}

//['4000', '4001'] -> ['127.0.0.1:4000', '127.0.0.1:4001']
function getPeerIps(peers) {
    return peers.map(peer => toLocalIp(peer));
}

//'127.0.0.1:4000' -> '4000'
function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}