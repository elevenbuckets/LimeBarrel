'use strict';

const EthTx = require('ethereumjs-tx');
const LimeBarrel = require('./core/Wrap3.js');
const lbapi = new LimeBarrel('/home/jasonlin/.rinkeby/config.json');
const ethUtils = require('ethereumjs-utils');

// testing PoC here
let passwd = 'dc384ZU@b9lab';
let params = 
{
  nonce: '0x00',
  gasPrice: '0x09184e72a000', 
  gasLimit: '0xa710',
  to: '0x0000000000000000000000000000000000000000', 
  value: '0x00', 
  data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
  // EIP 155 chainId - mainnet: 1, ropsten: 3
  chainId: 4
} 

lbapi.connect()
  .then((rc) => 
{
	if (!rc) throw "failed to connect to geth";
	let address = lbapi.allAccounts()[0]
	return lbapi.unlockAndSign(passwd)(address, 'Hello World');
})
  .then((data) =>
{
	if(!data.rc) throw "failed to unlock account";
	let tx = new EthTx(params);	
	tx.sign(data.pkey);
	return tx;
})
  .then((tx) => 
{
	console.log(tx.validate());
	console.log(ethUtils.bufferToHex(ethUtils.sha3(ethUtils.bufferToHex(tx.getSenderPublicKey()))));
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
