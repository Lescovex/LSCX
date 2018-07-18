var Web3 = require('web3');

const chalk = require('chalk')
const { DPT } = require('ethereumjs-devp2p')
const Buffer = require('buffer').Buffer

const PRIVATE_KEY = 'd772e3d6a001a38064dd23964dd2836239fa0e6cec8b28972a87460a17210fe9'
const BOOTNODES = require('ethereum-common').bootstrapNodes.map((node) => {
return {
  address: node.ip,
  udpPort: node.port,
  tcpPort: node.port
}
})
//var devp2p=require('devp2p');

  var web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8100/api'));
//console.log(web3.eth.getBalance(sender));

//web3.personal.unlockAccount(sender, pass,1000000);
//LOAD THE CONTRACT

var vcontract =web3.eth.contract(json_iface2).at(caddr);
//console.log(vcontract);
//Getcontract
//// Variables Data
//// Functions Structure


function getContractData(caddr,json_iface,sender, pass){

  web3.personal.unlockAccount(sender, pass,1000000);
  //LOAD THE CONTRACT
  var vcontract =web3.eth.contract(json_iface2).at(caddr);
  var cdata=vcontract.abi;
  var i=0;
  var n=0;
  var last="";
  var functions=new Array();
  var variables=new Array();
  var data=new Array();

  for (var prop in cdata) {
    //console.log(cdata[prop]);

      variables[i]=new Array();
      if(cdata[prop]['constant']==true){
        variables[i]={name:cdata[prop]['name'],value:cdata[prop]['outputs'][0]['value']};
        i++;
      }

  var last=prop;

  n++;
  }
  console.log(variables);
  return JSON.stringify(variables);
}



//Get Contract Funcions

function getContractFunc(caddr,json_iface,sender, pass){

  console.log(vcontract.abi);
  var cdata=vcontract.abi;


  var i=0;
  var n=0;
  var last="";
  var functions=new Array();
  var variables=new Array();
  var data=new Array();

  for (var prop in cdata) {


      functions[i]=new Array();
      if(cdata[prop]['constant']==false){

        if(cdata[prop]['inputs'].length>0){
          for (var inputs in cdata[prop]['inputs']) {
            functions[i]={name:cdata[prop]['name'],inputs:cdata[prop]['inputs'][inputs]['type'],input:true};
          }
          //functions[i]={name:cdata[prop]['name'],inputs:cdata[prop]['inputs']};

        }else{
          functions[i]={name:cdata[prop]['name']};
        }

        i++;
      }

  var last=prop;

  n++;
  }
  console.log(functions);
  return JSON.stringify(functions);
}

//Get Balance

  function ethBalance(sender) {
      return web3.eth.getBalance(sender);
  }


function sendEth(from,to,amount){


}

//Get Balance Tokens

  function tknBalance(sender) {

      return vcontract.balanceOf(sender);
  }

function countProperties(obj) {
    var count = 0;

    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            ++count;
    }

    return count;
}


  function newAccount(pass){
    var accountObject = new Accounts();
    var acc = accountObject.new(pass);
    //console.log(acc);
    if(!localStorage.getItem('acc')){
      var acca= new Array();
      acca[0]=acc;
      localStorage.setItem('acc',JSON.stringify(acca));
      console.log(localStorage.getItem('acc'));
    }else{

      var acca= JSON.parse(localStorage.getItem('acc'));
      acca[countProperties(acca)]=acc;
      localStorage.setItem('acc',JSON.stringify(acca));
      console.log(localStorage.getItem('acc'));

    }
  }


  function addContract(json_iface,addr){
    var acc = web3.eth.contract(json_iface2).at(caddr);

    //console.log(acc);
    if(!localStorage.getItem('con')){
      var acca= new Array();
      acca[0]=acc;
      localStorage.setItem('con',JSON.stringify(acca));
      console.log(localStorage.getItem('con'));
    }else{

      var acca= JSON.parse(localStorage.getItem('con'));
      acca[countProperties(acca)]=acc;
      localStorage.setItem('con',JSON.stringify(acca));
      console.log(localStorage.getItem('con'));

    }

  }





//WarDeal Send money to the contract and win x money by rand 33 %, max bet 3 ETH



//Make war proposal (URL, DURATION, N VOTES, )

function makeProposal(){


}

//List contract Events


//History

function getEvents(addr){


}

//Get TEIO auth code

function genCode(){


}

function checkCode(){


}
