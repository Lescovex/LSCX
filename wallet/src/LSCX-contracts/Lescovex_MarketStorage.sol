pragma solidity 0.4.24;


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
    using SafeMath for uint256;
    
    address LSCX_Market;

    //string[] public orders;
    //string orders = "";
    //string tikers = "";
    
    string tmpO;
    string tmpT;
    string tmpUint;
    string tmpAddr;
    
    mapping(uint256 => string) public orders;
    mapping(uint256 => string) public tikers;
    
    uint256 public ordersId = 1;
    uint256 public tikersId = 1;
    
    uint256 public ordersCount = 0;
    uint256 public tikersCount = 0;
    
    string public testing;
    /* Initializes contract with initial supply tokens to the creator of the contract */
    constructor () public {
        
    }
    function changeMarket(address _market) public onlyOwner{
        LSCX_Market = _market;
    }
    
    function concatTiker(string _string, string _symbol) public {
        require(msg.sender == LSCX_Market);
        if(tikersCount == 0){
            tikers[tikersId] = string(abi.encodePacked(_string, _symbol));
            tikersCount++;
        }else{
            string  memory x = tikers[tikersId];
            tikers[tikersId] = string(abi.encodePacked(x, _string, _symbol));
            tikersCount ++;
        }
        if(tikersCount == 50){
            tikersCount = 0;
            tikersId++;
        }
        
   }

   function concatOrder(string _string, string _symbol) public {
       require(msg.sender == LSCX_Market);
        if(ordersCount == 0){
            orders[ordersId] = string(abi.encodePacked(_string, _symbol));
            ordersCount++;
        }else{
            string memory x = orders[ordersId];
            orders[ordersId] = string(abi.encodePacked(x, _string, _symbol));
            ordersCount++;
        }
        if(ordersCount == 50){
            ordersCount = 0;
            ordersId++;
        }
   }
    
   
   
}
