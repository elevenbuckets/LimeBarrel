'use strict';

const EthTx = require('ethereumjs-tx');
const LimeBarrel = require('LimeBarrel/core/Wrap3.js');
const lbapi = new LimeBarrel('/home/jasonlin/.rinkeby/config.json');
const ethUtils = require('ethereumjs-utils');
const fs = require('fs');

// testing PoC here
let passwd = 'dc384ZU@b9lab';

// mocked message format to be signed
const fields = 
[
   {name: 'nonce', length: 32, allowLess: true, default: new Buffer([]) },
   {name: 'validatorAddress', length: 20, allowZero: true, default: new Buffer([]) },
   {name: 'originAddress', length: 20, allowZero: true, default: new Buffer([]) },
   {name: 'timestamp', length: 32, allowLess: true, default: new Buffer([]) },
   {name: 'type', length: 32, allowLess: true, default: new Buffer([]) },
   {name: 'payload', length: 32, allowLess: true, default: new Buffer([]) },
   {name: 'v', allowZero: true, default: new Buffer([0x1c]) },
   {name: 'r', allowZero: true, length: 32, default: new Buffer([]) },
   {name: 's', allowZero: true, length: 32, default: new Buffer([]) }
]

const pubKeyToAddress = (sigObj) => 
{
	let signer = '0x' + 
	      ethUtils.bufferToHex(
		ethUtils.sha3(
		  ethUtils.bufferToHex(
			ethUtils.ecrecover(sigObj.chkhash, sigObj.v, sigObj.r, sigObj.s, 4)
		  )
                )
              ).slice(26);

	console.log(`signer address: ${signer}`);

	return signer === ethUtils.bufferToHex(sigObj.originAddress); 
}

// reduce function
const verifyTx = (RLPxBin) => 
{
	let m = {};
	ethUtils.defineProperties(m, fields, RLPxBin);

	let signature = {v: ethUtils.bufferToInt(m.v), r: m.r, s: m.s};

	let dout = lbapi.abi.encodeParameters(
		[
		 'uint', 
		 'address', 
		 'address', 
		 'uint', 
		 'bytes32', 
		 'string'
		], 
		[
		 ethUtils.bufferToInt(m.nonce),
		 ethUtils.bufferToHex(m.originAddress),
		 ethUtils.bufferToHex(m.validatorAddress),
		 ethUtils.bufferToInt(m.timestamp),
		 m.type,
		 m.payload.toString()
		]
	);
 	let chkhash = ethUtils.hashPersonalMessage(new Buffer(dout)); 

	// !!!!!! Need to also (first) check originAddress for valid membership and sufficient side-chain balance !!!!!!!

	if (pubKeyToAddress({chkhash, ...signature, originAddress: ethUtils.bufferToHex(m.originAddress)})) 
	{
		// include in the block cache
		// generating merkle root (sub-tree, 16 groups)
		// generating final mmerkle root of the block
	}
})
