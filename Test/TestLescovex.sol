pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/LCX_Equity.sol";

contract TestLescovex {
  Lescovex lescovex = Lescovex(DeployedAddresses.Lescovex());
  /*
            ////LescovexERC20 testing////
  */

	function testCheckOwner() public{
	    address account = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;
      Assert.equal(msg.sender, account, "No es el mateix Address");
  }
  
  function testCheckWrongOwner() public {
    address account = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    Assert.notEqual(msg.sender, account, "Es el mateix");
  }

  
  function testTransferOriginDestination() public{
    address destination = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    Assert.notEqual(msg.sender, destination, "Es la mateixa adreça");
  }

  
  function testBalanceOf() public{
    Lescovex lescovexcontracte = new Lescovex();
    uint256 expected = msg.value;

    Assert.equal( expected, lescovexcontracte.balanceOf(msg.sender), "No es el mateix balanç");
  }

  function testTransfer() public{
    Lescovex lescovexcontracte = new Lescovex();

    address destino = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    uint256 transfiere =10;
    Assert.isTrue(lescovexcontracte.transfer(destino, transfiere), "No funciona");
  }
  function testTransferFrom() public payable{
    Lescovex lescovexcontracte = new Lescovex();
    address origen = msg.sender;
    address destino = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    uint256 transfiere = msg.value /10;
  
    Assert.isTrue(lescovexcontracte.transferFrom(origen, destino, transfiere), "No Funciona");
  }
  function testApprove () public{
    Lescovex lescovexcontracte = new Lescovex();
 
    address spender = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    uint256 gasta = 15;
 
 
    Assert.isTrue(lescovexcontracte.approve(spender, gasta), "No Aprobado");
  }

  function testIncreaseApproval() public{
    Lescovex lescovexcontracte = new Lescovex();
    address spender = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    uint256 suma = 150;
 
    Assert.isTrue(lescovexcontracte.increaseApproval(spender, suma), "No incrementa approval");
  }
  function testDecreaseApproval() public{
    Lescovex lescovexcontracte = new Lescovex();
    address spender = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    uint256 resta = 150;
 
    Assert.isTrue(lescovexcontracte.decreaseApproval(spender, resta), "No incrementa approval");
  }


  function testGetHoldedAmount() public {
    Lescovex lescovexcontracte = new Lescovex();
    lescovexcontracte.transfer(0xf17f52151EbEF6C7334FAD080c5704D77216b732
, 1);
    lescovexcontracte.transfer(0xf17f52151EbEF6C7334FAD080c5704D77216b732
, 2);
    lescovexcontracte.transfer(0xf17f52151EbEF6C7334FAD080c5704D77216b732
, 20);
    address who = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;

      uint256 test =20;
     Assert.equal(test, lescovexcontracte.getHoldedAmount(who, 2), "No son el mateix");
  }

  /*
                ////Lescovex testing////
  */

 
    function testConstructorSupply() public{
  	   Lescovex lescovexcontracte = new Lescovex();
       uint256 test =1000000000000000;
       uint256 test2 = lescovexcontracte.totalSupply();
       Assert.equal(test, test2, "No es el mateix supply");
    }
 
    function testDeposit() public{
      Lescovex lescovexcontracte = new Lescovex();
      Assert.isTrue(lescovexcontracte.deposit(), "No funciona");
    }
 

}
