
var account = web3.eth.accounts[0];



if(account==undefined){
	alert('Enable metamask, you need matamask browser extension to use this tool');
}

$('#signAccount').val(account);

var BCAContract = web3.eth.contract(contractAbi);

function addCA(issuer, fingerprint,certificate){
    
    certificateAuthority[fingerprint].issuer=issuer;
    certificateAuthority[fingerprint].certificate=certificate;

}

genSelectorKeys();

function genSelectorKeys(){
	var accountStore=JSON.parse(localStorage.getItem('acc'));
	$.each(accountStore, function(key,value){
		$("#selAccount").append("<option value='"+value.split("-")[0]+"'>"+value.split("-")[1]+"</option>");
	});
}

function addEntity() {
   
	var privateKey=document.getElementById('genprivkey').value;
	var privkey=hdkey.fromExtendedKey(privateKey).getWallet().getPrivateKey();
	var pubKey=EthJS.Util.privateToPublic(privkey);
	var addrb=EthJS.Util.privateToAddress(privkey);
	
	if(!localStorage.getItem('acc')){

		var acca= new Array();
		acca[0]=privateKey+"-"+EthJS.Util.bufferToHex(addrb);
		
		localStorage.setItem('acc',JSON.stringify(acca));
		console.log(localStorage.getItem('acc'));

	}else{
		
		var acca= JSON.parse(localStorage.getItem('acc'));
		acca[countProperties(acca)]=privateKey+"-"+EthJS.Util.bufferToHex(addrb);;
		localStorage.setItem('acc',JSON.stringify(acca));
		console.log(localStorage.getItem('acc'));

	}


	alert(EthJS.Util.hashPersonalMessage(pubKey, EthJS.Util.bufferToHex(addrb)));
	web3.eth.contract(contractAbi).at(contractAddress).addEntity(EthJS.Util.bufferToHex(addrb),EthJS.Util.bufferToHex(pubKey), EthJS.Util.hashPersonalMessage(pubKey, EthJS.Util.bufferToHex(addrb)), function(err,result){

		console.log(result);
	});

   
}


function signCertificatePublish(){

	var privkeySelected=$("#selAccount").val();
	var privkey=hdkey.fromExtendedKey(privkeySelected).getWallet().getPrivateKey();
	var pubKey=EthJS.Util.privateToPublic(privkey);
	var addrb=EthJS.Util.privateToAddress(privkey);

	var addrOwner=EthJS.Util.bufferToHex(addrb);
	var addrSignature=EthJS.Util.hashPersonalMessage(pubKey, $("#addrToSign").val());
	var contractAddr=$("#addrToSign").val();
	alert(document.getElementById('new_cypher').innerHTML.length);
	var certificateSigned=document.getElementById('new_cypher').innerHTML.substr(0,5000);


	web3.eth.contract(contractAbi).at(contractAddress).addSignature(addrOwner,web3.toHex(addrSignature),contractAddr,certificateSigned, function(err,result){
			console.log(result);
	});

}

function addSignature(address,signature, contractAddr,certificate){
    
    Signatures[contractAddr][msg.sender].certificate=certificate;
    Signatures[contractAddr][msg.sender].signature=signature;
    OwnerSignatures[msg.sender].contractAddress=contractAddr;

}


function encryptCertificate(pubKey , message){
	//alert(pubKey+ " " +message);
	web3.eth.sign(account, message, function(err, result){
		if(!err){
			console.log(result);
		}else{
			console.log(err);
		}
	});

}



var seed;


	function countProperties(obj) {
	    var count = 0;

	    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            ++count;
	    }

	    return count;
	}


function enableCustomDerivationPathToggle(){
	document.getElementById('toggleCustomDerivationPath').checked = true;
}

function showDerivationPath(selection) {
	let coinType = document.getElementById('coinlist').value;
	let account = document.getElementById('account').value;
	let change = document.getElementById('change').value;
	let addressIndex = document.getElementById('startAddressIndex').value;

	if(selection) {
		let id = selection.id;

		if(id == "coinlist") {
			coinType = selection.value; // example: 60 (ethereum)
		}

		if(id == "account" && selection.value.trim() != "") {
			// The account value is a positive integer 0 - ???
			if(!isNaN(selection.value) && selection.value >= 0) {
				account = selection.value.trim(); // example: 0
			} else {
				account = 0;
			}
		}

		if(id == "change" && selection.value.trim() != "") {
			// The change value is a positive integer 0 - ???
			if(!isNaN(selection.value) && selection.value >= 0) {
				change = selection.value.trim();
			} else {
				change = 0;
			}
		}

		if(id == "startAddressIndex" && selection.value.trim() != "") {
			// The change value is a positive integer 0 - ???
			if(!isNaN(selection.value) && selection.value >= 0) {
				addressIndex = selection.value.trim();
			} else {
				addressIndex = 0;
			}
		}
	}

	let path = "m/44&#39;/";
	path += coinType + "&#39;/";
	path += account + "&#39;/";
	path += change + "/";
	path += addressIndex;

	let output = "<input type='text' id='derivationPath' value='"+path+"' style='width:20%' readonly='readonly' />";
	document.getElementById('derivationPathDiv').innerHTML = output;
}

function showCoinTypes(){
	let output = "";
	output += "<select id='coinlist' onchange='showDerivationPath(this)'>";
	// iterate through constants
	Object.keys(data).forEach(function (coin) {
		let constant = data[coin]
		// Subtract: 0x80000000 which is 2147483648 dec
		let constantNum = parseInt(constant, 16) - 2147483648;
		let selected = "";

		// Make Ether default selected
		if(constantNum == 60) {
			selected = "selected='selected'";
		}

		output += "<option value='"+constantNum+"' "+selected+">"+coin+" ("+constantNum+")<"+"/option>";
	})

	output += "<"+"/select>";
	document.getElementById('coinlistDiv').innerHTML = output;
}

function showLanguages(selectId,divId){
	let output = "";
	output += "<select id='"+selectId+"'>";
	output += "<option value='chinese_simplified'>chinese_simplified<"+"/option>";
	output += "<option value='chinese_traditional'>chinese_traditional<"+"/option>";
	output += "<option value='english' selected='selected'>english<"+"/option>";
	output += "<option value='french'>french<"+"/option>";
	output += "<option value='italian'>italian<"+"/option>";
	output += "<option value='japanese'>japanese<"+"/option>";
	output += "<option value='spanish'>spanish<"+"/option>";
	output += "<"+"/select>";
	document.getElementById(divId).innerHTML = output;
}

function seedDetails(mnemonic, isMnemonicValid, numberOfWords, seedHex, randomNumber, privateExtendedKey, publicExtendedKey, EthAddress){
	let output = "";
	output += "Generated mnemonic words:<br />";
	output += "<textarea>"+mnemonic+"<"+"/textarea>";
	output += "<br /><br />";
	output += "Number of mnemonic words:<br />";
	output += numberOfWords;
	output += "<br /><br />";
	if(isMnemonicValid) {
		output += "mnemonic is valid";
		document.getElementById("bip39Seed").value = seedHex;
	} else {
		output += "mnemonic is not valid";
	}
	output += "<br /><br />";
	output += "BIP-39 seed (Hex, 512 bits)<br />";
	output += seedHex;
	output += "<br /><br />";
	output += "Random number (ENT)<br />";
	output += randomNumber;
	output += "<br /><br />";
	output += "BIP32 Root Key extended private key<br />";
	output += privateExtendedKey;
	output += "<br /><br />";
	output += "BIP32 Root Key extended public key<br />";
	output += publicExtendedKey;
	output += "<br /><br />";
	output += "Ethereum Address<br />";
	output += EthAddress;
	output += "<br /><br />";

	return output;
}

function generateSeed() {
	document.getElementById("outputSeed").innerHTML = "";

	const strength = document.getElementById("entLength").value;
	const wordName = document.getElementById('wordlist').value;
	const password = document.getElementById('password').value;

	const rng = null;  // Let module randombytes create this for us.
	const wordList = eval('bip39.wordlists.'+wordName);

	const mnemonic = bip39.generateMnemonic(strength, rng, wordList);
	const seedHex = bip39.mnemonicToSeedHex(mnemonic, password);
	seed = bip39.mnemonicToSeed(mnemonic, password);
	const randomNumber = bip39.mnemonicToEntropy(mnemonic, wordList);

	const isMnemonicValid = bip39.validateMnemonic(mnemonic, wordList);

	const numberOfWords = (parseInt(strength) + (strength / 32)) / 11;

	const hdwallet = hdkey.fromMasterSeed(seed);
	const privateExtendedKey= hdwallet.privateExtendedKey();
	const publicExtendedKey= hdwallet.publicExtendedKey();

	var privkey=hdkey.fromMasterSeed(privateExtendedKey).getWallet().getPrivateKey();
	var addrb=EthJS.Util.privateToAddress(privkey);

	let output= "<div id='outputContainer'>";
	output += seedDetails(mnemonic, isMnemonicValid, numberOfWords, seedHex, randomNumber, privateExtendedKey, publicExtendedKey, EthJS.Util.bufferToHex(addrb));
	output += "<"+"/div>";

	document.getElementById("outputSeed").innerHTML = output;

	document.getElementById('genprivkey').value=privateExtendedKey;
	document.getElementById('genpubkey').value=publicExtendedKey;
	document.getElementById('genaddr').value=publicExtendedKey;

	document.getElementById('publishButton').style="display:block";
}


function generateAddresses(){
	document.getElementById("outputKeys").innerHTML = "";

	// Get coinType
	const coinType = document.getElementById('coinlist').value;

	// Get BIP39 seed
	const seedHex = document.getElementById("bip39Seed").value;

	// Check BIP39 seed
	if (!seedHex.match(/[0-9A-F]{128}/gi)) {
		alert("Not a valid BIP-39 seed");
		return;
	}

	let startIndex = document.getElementById('startAddressIndex').value;
	if(isNaN(startIndex) || startIndex < 0) {
		alert("Not a valid start address index value");
		return;
	}

	let endIndex = document.getElementById('endAddressIndex').value;
	if(isNaN(endIndex) || endIndex < 0) {
		alert("Not a valid end address index value");
	}

	// I have stored seed in a global variable. This is a hacky solution.
	// Better solution (not implemented): let seed = new Buffer(seedHex, 'hex');
	const hd = hdkey.fromMasterSeed(seed);

	const privateExtendedKey= hd.privateExtendedKey();
	const publicExtendedKey= hd.publicExtendedKey();

	const toggle = document.getElementById('toggleCustomDerivationPath').checked;

	let output="";

	if(toggle) {
		// Custom derivation path
		let nodeDerivationPath = document.getElementById('derivationPath2').value;

		// Remove all white spaces
		nodeDerivationPath = nodeDerivationPath.replace(/\s/g,'');

		// Check the derivationPath
		const re = /^m(\/[0-9]+'?)+$/g;
		if(!re.test(nodeDerivationPath)) {
			alert("The custom derivation path is invalid");
			return;
		}

		const node = hd.derivePath(nodeDerivationPath);
		const nodeExtendedPrivateKey= node.privateExtendedKey();
		const nodeExtendedPublicKey= node.publicExtendedKey();

		output += "<div id='outputContainer3'>";
		output += "Node:<br />";
		output += "Derivation path: "+nodeDerivationPath+"<br />";
		output += "Extended private key: "+nodeExtendedPrivateKey+"<br />";
		output += "Extended public key: "+nodeExtendedPublicKey;
		output += "<br /><br />";
		output += "------------------------------------------------------------";
		output += "<br /><br />";

		for(let i=startIndex; i<endIndex; i++) {
			let addressIndexDerivationPath = nodeDerivationPath + "/" + i;
			let addressIndexWallet = node.deriveChild(i).getWallet();
			let publicKey = addressIndexWallet.getPublicKey().toString('hex');
			let privateKey = addressIndexWallet.getPrivateKey().toString('hex');

			output += "Derivation path: "+addressIndexDerivationPath + "<br />";

			// The ethereumjs library can only generate valid addresses for Ethereum and not for other coin types.
			if(coinType == 60) {
				let address = addressIndexWallet.getAddress().toString("hex");
				output += "Address: "+ address + "<br />";
			}
			output += "Private key: "+ privateKey + "<br />";
			output += "Public key: "+ publicKey;

			output += "<br /><br />";
		}
		output += "<"+"/div>";
	} else {
		// Get the derivationPath: m / purpose' / coin_type' / account' / change / address_index
		let derivationPath = document.getElementById('derivationPath').value;

		// Parse the derivationPath
		const parts = derivationPath.split('/');
		const m_part = parts[0];
		const purpose_part = parts[1];
		const coinType_part = parts[2];
		const account_part = parts[3];
		const change_part = parts[4];

		// Construct
		// accountNodeDerivationPath: m / purpose' / coin_type' / account'
		// changeNodeDerivationPath: m / purpose' / coin_type' / account' / change
		const accountNodeDerivationPath = m_part + "/" + purpose_part + "/" + coinType_part + "/" + account_part;
		const changeNodeDerivationPath = accountNodeDerivationPath + "/" + change_part;

		// Get Account xprv key and xpub key
		const accountNode = hd.derivePath(accountNodeDerivationPath);
		const accountNodeExtendedPrivateKey= accountNode.privateExtendedKey();
		const accountNodeExtendedPublicKey= accountNode.publicExtendedKey();

		// Get Change xprv key and xpub key
		const changeNode = hd.derivePath(changeNodeDerivationPath);
		const changeNodeExtendedPrivateKey= changeNode.privateExtendedKey();
		const changeNodeExtendedPublicKey= changeNode.publicExtendedKey();

		output += "<div id='outputContainer3'>";
		output += "Account:<br />";
		output += "Derivation path: "+accountNodeDerivationPath+"<br />";
		output += "Extended private key: "+accountNodeExtendedPrivateKey+"<br />";
		output += "Extended public key: "+accountNodeExtendedPublicKey;
		output += "<br /><br />";
		output += "Change or BIP32:<br />";
		output += "Derivation path: "+changeNodeDerivationPath+"<br />";
		output += "Extended private key: "+changeNodeExtendedPrivateKey+"<br />";
		output += "Extended public key: "+changeNodeExtendedPublicKey;

		output += "<br /><br />";
		output += "------------------------------------------------------------";
		output += "<br /><br />";

		for(let i=startIndex; i<endIndex; i++) {
			let addressIndexDerivationPath = changeNodeDerivationPath + "/" + i;

			// There are two methods to create the addressIndexWallet.
			// Method A:
			// let addressIndexWallet = hd.derivePath(addressIndexDerivationPath).getWallet();
			// Method B:
			let addressIndexWallet = changeNode.deriveChild(i).getWallet();

			let publicKey = addressIndexWallet.getPublicKey().toString('hex');
			let privateKey = addressIndexWallet.getPrivateKey().toString('hex');

			output += "Derivation path: "+addressIndexDerivationPath + "<br />";

			// The ethereumjs library can only generate valid addresses for Ethereum and not for other coin types.
			if(coinType == 60) {
				let address = addressIndexWallet.getAddress().toString("hex");
				output += "Address: "+ address + "<br />";
			}
			output += "Private key: "+ privateKey + "<br />";
			output += "Public key: "+ publicKey;

			output += "<br /><br />";
		}
		output += "<"+"/div>";
	} // end if(toggle)

	document.getElementById("outputKeys").innerHTML = output;
}

function restoreAddresses(){
	let restoreKey = document.getElementById('restoreKey').value;
	restoreKey = restoreKey.trim();

	document.getElementById("outputRestore").innerHTML = "";

	const toggle = document.getElementById('toggleFromEthreumWallet').checked;

	let startIndex = document.getElementById('startAddressIndex2').value;
	if(isNaN(startIndex) || startIndex < 0) {
		alert("Not a valid start address index value");
		return;
	}

	let endIndex = document.getElementById('endAddressIndex2').value;
	if(isNaN(endIndex) || endIndex < 0) {
		alert("Not a valid end address index value");
	}

	// Simpel check
	const prefix = restoreKey.substring(0, 4);

	if(prefix != "xprv" && prefix != "xpub") {
		alert("Not a valid xprv or xpub key");
		return;
	}

	var hdnode = hdkey.fromExtendedKey(restoreKey);

	let extendedPublicKey = "";
	let extendedPrivateKey = "";

	if(prefix == "xprv"){
		extendedPublicKey = hdnode.publicExtendedKey();
		extendedPrivateKey = hdnode.privateExtendedKey();
	}

	if(prefix == "xpub"){
		extendedPublicKey = hdnode.publicExtendedKey();
	}

	let output= "<div id='outputContainer4'>";
	if(prefix == "xprv"){
		output += "Extended private key: " +extendedPrivateKey +"<br />";
	}
	output += "Extended public key: " +extendedPublicKey;

	output += "<br /><br />";
	output += "------------------------------------------------------------";
	output += "<br /><br />";

	for(let i=startIndex; i<endIndex; i++) {
		let childWallet = hdnode.deriveChild(i).getWallet();
		let publicKey = childWallet.getPublicKey().toString('hex');
		let privateKey = "";
		if(prefix == "xprv"){
			privateKey = childWallet.getPrivateKey().toString('hex');
		}

		output += "Address index: "+ i + "<br />";

		// The ethereumjs library can only generate valid addresses for Ethereum and not for other coin types.
		if(toggle) {
			let address = childWallet.getAddress().toString("hex");
			output += "Address: "+ address + "<br />";
		}
		if(prefix == "xprv"){
			output += "Private key: "+privateKey+"<br />";
		}
		output += "Public key: "+ publicKey;

		output += "<br /><br />";
	}
	output += "<"+"/div>";
	document.getElementById("outputRestore").innerHTML = output;
}



  
