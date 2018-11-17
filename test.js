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
   {name: 'payload', length: 32, allowLess: true, default: new Buffer([]) }
]

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
	//let tx = new EthTx(params);	
	//tx.sign(data.pkey);
	//return tx;

	let params = 
	{
		nonce: 0,
		originAddress: '0xb440ea2780614b3c6a00e512f432785e7dfafa3e',
		validatorAddress: '0x5e05bf686664b3e5e5d6de88dbba5c5bb1930b8f',
		timestamp: 1542498233, // making signature repeatable for debugging;
		type: '0x11be0000001',
		payload: 'Hello World!'	
	}

	let mesh11 = {};
	ethUtils.defineProperties(mesh11, fields, params)

	let data = mesh11.serialize();
	let datahash = ethUtils.hashPersonalMessage(data);
	return {...mesh11, ...ethUtils.ecsign(datahash, p.pkey, 3)};
	
})
  .then((sig) => 
{
	console.log(sig);
	//console.dir(ethUtils.baToJSON(tx.raw));
	//console.log(ethUtils.bufferToHex(ethUtils.sha3(ethUtils.bufferToHex(tx.getSenderPublicKey()))));
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
