pragma solidity 0.4.25;

/*
    Copyright 2018, Vicent Nos & Mireia Puig

    License:
    https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode

 */

library SafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}


contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function Ownable() internal {
      owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    
}


contract HoldersSweeper is Ownable{
    address public owner;

    uint256 public feeTransaction;
    uint256 public feeCreation;
    uint256 public feeAddMarket;
    uint256 public feeBankTransfer;
    uint256 public feeTopUp;
    uint256 public minFee;
    
    address public sweeper;

    event feeTransaction(address hash, address addr);
    event feeCreation(address hash, address addr);
    event feeAddMarket(address hash, address addr);
    event feeBankTransfer(address hash, address addr);
    event feeTopUp(address hash, address addr);
    

    function setTopUpFee(uint256 _fee) public onlyOwner {
        feeTopUp = _fee;
    }


    function setBankTransferFee(uint256 _fee) public onlyOwner {
        feeBankTransfer = _fee;
    }


    function setAddMarketFee(uint256 _fee) public onlyOwner {
        feeAddMarket = _fee;
    }
    
    function setCreationFee(uint256 _fee) public onlyOwner {
        feeCreation = _fee;
    }
    
    function setTransactionFee(uint256 _fee) public onlyOwner {
        feeTransaction = _fee;
    }
 
    function setMinFee(uint256 _fee) public onlyOwner {
        minFee = _fee;
    }   
    
    function callSweeper(address token, uint256 feeType, string fname, string types, string data) payable public{
        
        uint256 fee;
        
        if(feeType==0){
             fee=feeTransaction;
            fee=(msg.value*fee)/1000;
            sweeper.transfer(fee);
            if(!token.call(bytes4(keccak256(fname+"("++")")), data)){revert();}
        }

        if(feeType==1){
            fee=feeCreation;
            fee=(msg.value*fee)/1000;
            sweeper.transfer(fee);
            if(!token.call(bytes4(keccak256(fname+"("++")")), data)){revert();}
        }

        if(feeType==2){
            fee=feeAddMarket;  
            fee=(msg.value*fee)/1000;
            sweeper.transfer(fee);
            if(!token.call(bytes4(keccak256(fname+"("++")")), data)){revert();}
        }

        if(feeType==3){
            fee=feeBankTransfer;
            fee=(msg.value*fee)/1000;
            sweeper.transfer(fee);
            if(!token.call(bytes4(keccak256(fname+"("++")")), data)){revert();}
        }
        
        if(feeType==4){
            fee=feeTopUp;

            fee=(msg.value*fee)/1000;
            sweeper.transfer(fee);
            if(!token.call(bytes4(keccak256(fname+"("++")")), data)){revert();}
        
        }
        
        if(feeType<0 || feeType>4){
            fee=minFee;

            fee=(msg.value*fee)/1000;
            sweeper.transfer(fee);
            if(!token.call(bytes4(keccak256(fname+"("++")")), data)){revert();}
        }


        
    }
    
    
}




