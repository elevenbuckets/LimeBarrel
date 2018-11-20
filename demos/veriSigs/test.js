'use strict';

const EthTx = require('ethereumjs-tx');
const LimeBarrel = require('./core/Wrap3.js');
const lbapi = new LimeBarrel('/home/jasonlin/.rinkeby/config.json');
const ethUtils = require('ethereumjs-utils');

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

lbapi.connect()
  .then((rc) => 
{
	if (!rc) throw "failed to connect to geth";
	let address = lbapi.allAccounts()[0]
	return lbapi.unlockAndSign(passwd)(address, 'Hello World');
})
  .then((p) =>
{
	if(!p.rc) throw "failed to unlock account";

	let params = 
	{
		nonce: 0,
		originAddress: '0xb440ea2780614b3c6a00e512f432785e7dfafa3e',
		validatorAddress: '0x5e05bf686664b3e5e5d6de88dbba5c5bb1930b8f',
		timestamp: 1542498233, // making signature repeatable for debugging;
		type: '0x11be0000001',
		payload: 'Hello World!'	
	}

	let __tmp  = {}; 
	let mesh11 = {};
	ethUtils.defineProperties(__tmp, fields, params)

/* First trial: generate and sign the whole rlphash
 *	let data = __tmp.serialize();
 *	let datahash = ethUtils.hashPersonalMessage(data); 
 *	let signature = ethUtils.ecsign(datahash, p.pkey, 4); 
 */	

// Second trail: compile the data and the sha3 signature of packed data
	let data = lbapi.abi.encodeParameters(
		[
		 'uint', 
		 'address', 
		 'address', 
		 'uint', 
		 'bytes32', 
		 'string'
		], 
		[
		 params.nonce,
		 params.originAddress,
		 params.validatorAddress,
		 params.timestamp,
		 params.type,
		 params.payload
		]
	);
 	let datahash = ethUtils.hashPersonalMessage(new Buffer(data)); 
 	let signature = ethUtils.ecsign(datahash, p.pkey, 4); 
	ethUtils.defineProperties(mesh11, fields, {...params, ...signature});
	return mesh11.serialize(); // serialized data, ready to be relayed via p2p network
	
})
  .then((s) => //pretending the variable s is received by validator via p2p network 
{
	let m = {};
	ethUtils.defineProperties(m, fields, s);
	let signature = {v: ethUtils.bufferToInt(m.v), r: m.r, s: m.s};

	//let ra = {};
	//ethUtils.defineProperties(ra, fields, params);
	//let chkhash = ethUtils.hashPersonalMessage(ra.serialize()); 
	let data = lbapi.abi.encodeParameters(
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
 	let chkhash = ethUtils.hashPersonalMessage(new Buffer(data)); 

	console.log(pubKeyToAddress({chkhash, ...signature, originAddress: ethUtils.bufferToHex(m.originAddress)}));
}) 
  .then(() => 
{
  	lbapi.closeIPC();
  	process.exit(0);
})
  .catch((err) => 
{
  	console.log(err);
  	process.exit(1);
})
