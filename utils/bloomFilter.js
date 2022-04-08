import { BloomFilter } from 'bloom-filters'
// create a Bloom Filter with a size of 10 and 4 hash functions
let filter = new BloomFilter(10, 4)
// insert data
filter.add('alpha')
filter.add('beta')
filter.add('charlie')
filter.add('delta')
console.log(filter);

// lookup for some data
console.log(filter.has('beta')) // output: true
console.log(filter.has('daniel')) // output: false
console.log(filter.random())

// print the error rate
console.log(filter.rate())

// alternatively, create a bloom filter optimal for a number of items and a desired error rate
const bf = ['alpha', 'beta']
const errorRate = 0.025 // 2.5% error rate
let filter2 = BloomFilter.create(bf.length, errorRate)

// or create a bloom filter optimal for a collections of items and a desired error rate
filter2 = BloomFilter.from(bf, errorRate)