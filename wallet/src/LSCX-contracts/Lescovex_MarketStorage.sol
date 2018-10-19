pragma solidity 0.4.24;


/*
    Copyright 2018, Vicent Nos & Mireia Puig
    
    License:
    https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode

 */

contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() internal {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}


//////////////////////////////////////////////////////////////
//                                                          //
//                Lescovex_MarketStorage                    //
//                                                          //
//////////////////////////////////////////////////////////////



contract Lescovex_MarketStorage is Ownable {
    
    address LSCX_Market;

    //string[] public orders;
    string orders = "";
    string tikers = "";
    
    string tmpO;
    string tmpT;
    /* Initializes contract with initial supply tokens to the creator of the contract */
    constructor () public {
        
    }
    function changeMarket(address _market) public onlyOwner{
        LSCX_Market = _market;
    }
    
    function orderConcat(string _symbol, string _owner, string _tokenGet, string _amountGet, string _tokenGive, string _amountGive, string _expires, string _nonce, string _hash, string _v, string _r, string _s) public {
        require(msg.sender == LSCX_Market);
        tmpO = string(abi.encodePacked(_owner, _symbol, _tokenGet, _symbol, _amountGet));
        tmpO = string(abi.encodePacked(tmpO, _symbol, _tokenGive, _symbol, _amountGive ));
        tmpO = string(abi.encodePacked(tmpO, _symbol, _expires, _symbol, _nonce ));
        tmpO = string(abi.encodePacked(tmpO, _symbol, _hash, _symbol, _v ));
        tmpO = string(abi.encodePacked(tmpO, _symbol, _r, _symbol, _s ));
        
        setOrder("*", tmpO);
    }
   
   function setOrder(string _symbol, string _order) internal {
       orders = string(abi.encodePacked(orders, _order, _symbol));
       tmpO = "";
   }
   function getOrders()public view returns (string){
       require(msg.sender == LSCX_Market);
       return orders;
   }
   
   function tikerConcat(string _symbol, string _token, string _tokenName, string _decimals) public {
       require(msg.sender == LSCX_Market);
       tmpT = string(abi.encodePacked(_token, _symbol, _tokenName, _symbol, _decimals));
       setTiker("*", tmpT);
   }
   function setTiker(string _symbol, string _tiker) internal{
       tikers = string(abi.encodePacked(tikers, _tiker, _symbol));
       tmpT = "";
   }
   function getTikers() public view returns(string){
       require(msg.sender == LSCX_Market);
       return tikers;
   }
   
}
