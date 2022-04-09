//libraries

//classes
import Block from "./block.js";
import { Transaction } from "./transaction.cjs";

//utils

//const

export default class Blockchain {
    constructor() {
      this.chain = [this.createGenesisBlock()];
      this.difficulty = 3;
      this.pendingTransactions = [];
      this.miningReward = 20;
    }
  
    /**
     * @returns {Block}
     */
    createGenesisBlock() {
      return new Block(Date.parse('2017-01-01'), [], '0');
    }
  
    /**
     * Returns the latest block on our chain. Useful when you want to create a
     * new Block and you need the hash of the previous Block.
     *
     * @returns {Block[]}
     */
    getLatestBlock() {
      return this.chain[this.chain.length - 1];
    }
  
    
    /**
     * Add a new transaction to the list of pending transactions (to be added
     * next time the mining process starts). This verifies that the given
     * transaction is properly signed.
     *
     * @param {Transaction} transaction
     */
    addTransaction(transaction) {
      if (!transaction.fromAddress || !transaction.toAddress) {
        throw new Error('Transaction must include from and to address');
      }
      
      // Verify the transactiion
      if (!transaction.isValid(transaction.fromAddress)) {
        throw new Error('Cannot add invalid transaction to chain');
      }
      
      if (transaction.amount <= 0) {
        throw new Error('Transaction amount should be higher than 0');
      }
      
      // Making sure that the amount sent is not greater than existing balance
      if (this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
        throw new Error("Not enough balance");
      }
      
      this.pendingTransactions.push(transaction);
      console.log(`Pending transaction has been added: ${transaction.calculateHash()}`);
    }
    
    /**
     * Returns the balance of a given wallet address.
     *
     * @param {string} address
     * @returns {number} The balance of the wallet
     */
    getBalanceOfAddress(address) {
      let balance = 100;
      
      for (const block of this.chain) {
        for (const trans of block.transactions) {
          if (trans.fromAddress === address) {
            console.log(`The balance is ${balance} \nThe transaction amount is ${trans.amount} \tThe total tips ${trans.tip} \tCurrent burn is ${this.chain.indexOf(block)}`);
            balance -= Number(trans.amount) + trans.tip + this.chain.indexOf(block);    
            console.log('New balace after updating: ', balance);
          }
          if (trans.toAddress === address) {
            balance += Number(trans.amount);
          }
        }
      }
      console.log("#".repeat(15));
      console.log('The new total balance is: ', balance);
      console.log("#".repeat(15));
      return balance;
    }
    
    /**
     * Returns a list of all transactions that happened
     * to and from the given wallet address.
     *
     * @param  {string} address
     * @return {Transaction[]}
     */
    getAllTransactionsForWallet(address) {
      const txs = [];
      
      for (const block of this.chain) {
        for (const tx of block.transactions) {
          if (tx.fromAddress === address || tx.toAddress === address) {
            txs.push(tx);
          }
        }
      }
      console.log(`get transactions for wallet count: ${txs.length}`);
      return txs;
    }
    
    /**
     * Loops over all the blocks in the chain and verify if they are properly
     * linked together and nobody has tampered with the hashes. By checking
     * the blocks it also verifies the (signed) transactions inside of them.
     *
     * @returns {boolean}
     */
    isChainValid() {
      // Check if the Genesis block hasn't been tampered with by comparing
      // the output of createGenesisBlock with the first block on our chain
      const realGenesis = JSON.stringify(this.createGenesisBlock());
      
      if (realGenesis !== JSON.stringify(this.chain[0])) {
        return false;
      }
      // Check the remaining blocks on the chain to see if there hashes and
      // signatures are correct
      for (let i = 1; i < this.chain.length; i++) {
        const currentBlock = this.chain[i];
        const previousBlock = this.chain[i - 1];
        
        if (previousBlock.hash !== currentBlock.previousHash) {
          return false;
        }
        
        if (!currentBlock.hasValidTransactions()) {
          return false;
        }
        
        if (currentBlock.hash !== currentBlock.calculateHash()) {
          return false;
        }
      }
      return true;
    }

    /**
     * Takes all the pending transactions, puts them in a Block and starts the
     * mining process. It also adds a transaction to send the mining reward to
     * the given address.
     *
     * @param {string} miningRewardAddress
     */
    minePendingTransactions(miningRewardAddress) {
      const total_tips = this.getSumOfTips(this.pendingTransactions);
      console.log(`Tips total amount is: ${total_tips}`);
      
      const rewardTx = new Transaction(null, miningRewardAddress , this.miningReward + total_tips, undefined, undefined, 0);
      this.pendingTransactions.push(rewardTx);
      
      let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
      block.mineBlock(this.difficulty);
      
      console.log('Block successfully mined!');

      this.chain.push(block);  
      this.pendingTransactions = [];
    }
    
    getSumOfTips(transactions){
      let curr_sum = 0;
      for (const t in transactions){
        curr_sum += t.tip ? 1 : 0;
      }
      return curr_sum;
    }

    verifyTransactionExist(hash) {
      for (const b of this.chain) {
        const proof = b.merTree.getProof(hash);
        if (b.merTree.verify(proof, hash, b.merTree.getHexRoot())) return true;
      }
      return false;
    }
  
    getTotalMinedCoins() {
      var sum = 0;
      for (const b of this.chain) {
        for (const t of b.transactions) {
          console.log(`Amount mined is: ${Number(t.amount)}, the tip is: ${t.tip}`)
          sum += Number(t.amount);
        }
      }
      return sum;
    }

    getNetworkCoins() {
      let sum = 0;
      let users = new Set();
      for (const b of this.chain) {
        for (const t of b.transactions) {
          users.add(t.fromAddress)
          users.add(t.toAddress)
        }
        sum += this.miningReward
      }
      sum -= this.miningReward // remove 1 reward for genesis block
      sum -= this.getTotalBurnedCoins()
      users.delete(null)
      
      sum += users.size * 100 //users amount * starting balance for each user
  
      return sum;
    }
  
    getTotalBurnedCoins() {
      let sum = 0;
      for (const b of this.chain) {
        sum += this.chain.indexOf(b) * 3
      }
      return sum;
    }
}