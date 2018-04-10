
var ethjs=require("ethereumjs-util");
var hdkey=require("ethereumjs-wallet/hdkey");
const Async = require('async');

var ethcrypto=require("eth-crypto");

var privkey=hdkey.fromExtendedKey("xprv9s21ZrQH143K3hudBg295aruHZGXLrq2Nv4CkQNeHdYfF1p4VXpGUDxvWNcP9ouYq7UwGVW39nijpicPk19pac3hzsJAEH2EdGs88VGsGvZ").getWallet().getPrivateKey();
var pubKey=ethjs.privateToPublic(privkey);

var pubhex=ethjs.bufferToHex(pubKey);

var prvhex=ethjs.bufferToHex(privkey);

console.log("clave publica : "+ pubhex.replace("0x",""));

console.log("clave privada : "+ prvhex.replace("0x",""));


  async function(pubhex) {
	constant cyphertext=await ethcrypto.encryptWithPublicKey(pubhex.replace("0x",""), "esto es un mensaje cifrado con la llave publica 2");
	console.log(cyphertext);
  }

	constant cyphertext=ethcrypto.encryptWithPublicKey(pubhex.replace("0x",""), "esto es un mensaje cifrado con la llave publica 2");

	console.log("texto cifrado con llave publica : ");
	setTimeout(function(){ 
		console.log(cyphertext); 
		var message = ethcrypto.decryptWithPrivateKey(prvhex.replace("0x",""), JSON.parse(cyphertext));

		setTimeout(function(){ console.log(message); },3000);

	}, 3000);






//setTimeOut(function(){console.log(cyphertext)},3000);

