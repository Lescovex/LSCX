var contractAddress="0x2c3807C913Bb00B4AFEbFF83996083ae25e9db5b";
var contractAbi= [
	{
		"constant": true,
		"inputs": [
			{
				"name": "_of",
				"type": "address"
			}
		],
		"name": "getOwnerSignature",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "v",
				"type": "uint256[1]"
			}
		],
		"name": "uints2bytes",
		"outputs": [
			{
				"name": "",
				"type": "bytes"
			}
		],
		"payable": false,
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "contractAddr",
				"type": "address"
			},
			{
				"name": "owner",
				"type": "address"
			}
		],
		"name": "getSignature",
		"outputs": [
			{
				"name": "",
				"type": "string"
			},
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "addr",
				"type": "address"
			}
		],
		"name": "getEntity",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "issuer",
				"type": "string"
			},
			{
				"name": "fingerprint",
				"type": "uint256"
			},
			{
				"name": "certificate",
				"type": "string"
			}
		],
		"name": "addCA",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "hash",
				"type": "bytes32"
			},
			{
				"name": "s",
				"type": "bytes"
			},
			{
				"name": "e",
				"type": "bytes"
			},
			{
				"name": "m",
				"type": "bytes"
			}
		],
		"name": "pkcs1Sha256Verify",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "addr",
				"type": "address"
			},
			{
				"name": "entity",
				"type": "string"
			},
			{
				"name": "signature",
				"type": "string"
			}
		],
		"name": "addEntity",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "v",
				"type": "uint256[4]"
			}
		],
		"name": "uints2bytes",
		"outputs": [
			{
				"name": "",
				"type": "bytes"
			}
		],
		"payable": false,
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "addr",
				"type": "address"
			},
			{
				"name": "signature",
				"type": "string"
			},
			{
				"name": "contractAddr",
				"type": "address"
			},
			{
				"name": "certificate",
				"type": "string"
			}
		],
		"name": "addSignature",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "contractAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "certificate",
				"type": "string"
			}
		],
		"name": "AddCA",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "publicKey",
				"type": "string"
			},
			{
				"indexed": false,
				"name": "signature",
				"type": "string"
			}
		],
		"name": "AddEntity",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "contractAddr",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "certificate",
				"type": "string"
			},
			{
				"indexed": false,
				"name": "signature",
				"type": "string"
			}
		],
		"name": "AddSignature",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	}
];