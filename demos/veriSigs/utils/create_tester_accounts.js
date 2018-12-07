var i;

//personal.unlockAccount(eth.accounts[0], "dc384ZU@b9lab", 86400);

for (i = 1; i <= 105; i++) {
    //personal.unlockAccount(eth.accounts[i], "dc384ZU@b9lab", 86400);
    //console.log(web3.toDecimal(eth.getBalance(eth.accounts[i])));
    personal.newAccount("dc384ZU@b9lab");
    //eth.sendTransaction({from: eth.accounts[0], to: eth.accounts[i], value: web3.toWei(1,'ether')});
}


