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
   {name: 'player', length: 20, allowZero: true, default: new Buffer([]) },
   {name: 'secret', length: 32, allowLess: true, default: new Buffer([]) },
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

let stage = Promise.resolve();

lbapi.connect()
  .then((rc) => 
{
	if (!rc) throw "failed to connect to geth";
	let address = lbapi.allAccounts()[0];
	return lbapi.unlockAndSign(passwd)(address, 'Hello World').then((p) => {
		if(!p.rc) throw "failed to unlock account";

		let secret = new Buffer('11beec052573aa');
		let data = lbapi.abi.encodeParameters(['bytes32'],[secret]); console.dir(data);
	 	let chkhash = ethUtils.hashPersonalMessage(new Buffer(data)); 
	 	let signature = ethUtils.ecsign(chkhash, p.pkey, 4); 

		let __tmp  = {}; console.dir({player: address, secret, v: signature.v, r: signature.r, s: signature.s });
                ethUtils.defineProperties(__tmp, fields, {player: address, secret, v: signature.v, r: signature.r, s: signature.s })
	
		console.log(pubKeyToAddress({chkhash, ...signature, originAddress: address}));
			
		fs.writeFileSync("./" + ethUtils.bufferToHex(chkhash), __tmp.serialize()); console.log(`output: ./${ethUtils.bufferToHex(chkhash)}`);
	})
})

/*
stage
  .then(() => {
	lbapi.closeIPC();
	process.exit(0);
})
*/
  .catch((err) => 
{
  	console.log(err);
  	process.exit(1);
})
