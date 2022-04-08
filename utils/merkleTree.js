import { MerkleTree } from 'merkletreejs'
import sha256 from 'crypto-js/sha256.js';

const leaves = ['a', 'b', 'c'].map(x => sha256(x))
const merkleTree = new MerkleTree(leaves, sha256)
const root = merkleTree.getRoot().toString('hex')
const leaf = sha256('b')
const proof = merkleTree.getProof(leaf)
console.log(merkleTree.verify(proof, leaf, root)) /** @returns {boolean} "true" */


const fLeaves = ['a', 'x', 'c'].map(x => sha256(x))
const fMerkleTree = new MerkleTree(fLeaves, sha256)
const fLeaf = sha256('x')
const fProof = fMerkleTree.getProof(fLeaf)
console.log(fMerkleTree.verify(fProof, fLeaf, root)) /** @returns {boolean} "false" */