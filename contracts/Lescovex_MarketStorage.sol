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
    bytes32[] arr;
    string symbol;
    
    uint256 public tikersId = 0;
    uint256 public tikersCount = 0;
    
    mapping(uint256 => string) public tikers;
    
    mapping(address => tikerInfo) tikersInfo;
    
    struct tikerInfo{
        
        bytes32[] sellOrders; //show highest price
        bytes32[] buyOrders; //show lowest price
        mapping(bytes32 => tikerOrders) orders;
    }
    
    struct tikerOrders{
        address tokenGet;
        address tokenGive;
        uint expires;
        string order;
        uint256 price;
    }
    
    constructor (string _symbol) public {
        symbol = _symbol;
    }
    
    function changeMarket(address _market) public onlyOwner{
        LSCX_Market = _market;
    }
    
    function changeSymbol(string _symbol) public onlyOwner{
        symbol = _symbol;
    }
    
    function concatTiker(string _string) public {
        require(msg.sender == LSCX_Market);

        if(tikersCount == 0){
            tikers[tikersId] = string(abi.encodePacked(_string, symbol));
            tikersCount++;
        }else{
            string  memory x = tikers[tikersId];
            tikers[tikersId] = string(abi.encodePacked(x, _string, symbol));
            tikersCount ++;
        }
        if(tikersCount == 50){
            tikersCount = 0;
            tikersId++;
        }
    }

    function getSellOrders(address token) public view returns(bytes32[]){
        return tikersInfo[token].sellOrders;
    }
    
    function getBuyOrders(address token) public view returns(bytes32[]){
        return tikersInfo[token].buyOrders;
    }
    
    function getOrderInfo(address token, bytes32 id) public view returns(address,  address, string){
        return (tikersInfo[token].orders[id].tokenGet, tikersInfo[token].orders[id].tokenGive, tikersInfo[token].orders[id].order);
    }
  
    function getOrdersToSell(address token)public view returns(string){
        uint256 len;
        len = tikersInfo[token].sellOrders.length;
        string memory result = "";
        for(uint i=0; i<len; i++){
            bytes32 id = tikersInfo[token].sellOrders[i];
            if(i==0){
                result = string(abi.encodePacked(tikersInfo[token].orders[id].order));
            }
            if(i>0){
                result = string(abi.encodePacked(result, symbol, tikersInfo[token].orders[id].order));
            }
        }
        return result;
    }
  
    function getOrdersToBuy(address token)public view returns(string){
        uint256 len;
        len = tikersInfo[token].buyOrders.length;
        string memory result = "";
        for(uint i=0; i<len; i++){
            bytes32 id = tikersInfo[token].buyOrders[i];
            if(i==0){
                result = string(abi.encodePacked(tikersInfo[token].orders[id].order));
            }
            if(i>0){
                result = string(abi.encodePacked(result, symbol, tikersInfo[token].orders[id].order));
            }
        }
        return result;
    }
  
    function setOrders(address tokenGet,  address tokenGive, string _string, uint256 _price, uint _expires, bytes32 _hash) public {
        require(msg.sender == LSCX_Market);
        require(_expires > block.number);
        
        if(tokenGet == 0x0000000000000000000000000000000000000000){
            if(tikersInfo[tokenGive].sellOrders.length > 0){
                checkStoredSells(tokenGive);    
            }
            sell(tokenGet, tokenGive, _string, _price, _expires, _hash);
        }
        
        if(tokenGive == 0x0000000000000000000000000000000000000000){
            if(tikersInfo[tokenGet].buyOrders.length > 0){
                checkStoredBuys(tokenGet);    
            }
            buy(tokenGet, tokenGive, _string, _price, _expires, _hash);
        }
    }
  
    function sell(address tokenGet, address tokenGive, string _string, uint256 _price, uint _expires, bytes32 _id) internal {
        uint256 len;
        bytes32 referenceId;
        bytes32 mem = 0;

        tikersInfo[tokenGive].orders[_id].tokenGet = tokenGet;
        tikersInfo[tokenGive].orders[_id].tokenGive = tokenGive;
        tikersInfo[tokenGive].orders[_id].order = _string;
        tikersInfo[tokenGive].orders[_id].price = _price;
        tikersInfo[tokenGive].orders[_id].expires = _expires;
          
        len = tikersInfo[tokenGive].sellOrders.length;
          
        if(len == 0){
            tikersInfo[tokenGive].sellOrders.push(_id);
        }
          
        if(len > 0 && len < 25){
            //len = tikersInfo[tokenGive].sellOrders.length;
            referenceId = tikersInfo[tokenGive].sellOrders[len-1];
              
              
            if(tikersInfo[tokenGive].orders[referenceId].price >= _price){
                tikersInfo[tokenGive].sellOrders.push(_id);
            }else{
                
                for(uint i = 0; i < len; i++){
                    referenceId = tikersInfo[tokenGive].sellOrders[i];
                    if(tikersInfo[tokenGive].orders[referenceId].price < _price){
                        //checks that id saved amount be lower than amountGive
                        if(mem > 0){
                            tikersInfo[tokenGive].sellOrders[i] = mem;
                        }else{
                            tikersInfo[tokenGive].sellOrders[i] = _id;    
                        }
                        mem = referenceId;                          
                        _price = tikersInfo[tokenGive].orders[mem].price;
                    }
                }
                if(mem > 0){
                    tikersInfo[tokenGive].sellOrders.push(mem);
                }
            }
        }
          
        if(len == 25){
            referenceId = tikersInfo[tokenGive].sellOrders[len-1];
            if(tikersInfo[tokenGive].orders[referenceId].price >= _price){
                revert();
            }else{
                for(uint j = 0; j < len; j++){
                    referenceId = tikersInfo[tokenGive].sellOrders[j];
 
                    if(tikersInfo[tokenGive].orders[referenceId].price < _price){
                        if(mem > 0){
                            tikersInfo[tokenGive].sellOrders[j] = mem;
                        }else{
                            tikersInfo[tokenGive].sellOrders[j] = _id;
                        }
                        mem = referenceId;                          
                        _price = tikersInfo[tokenGive].orders[mem].price;
                    }
                }
            }
        }
    }
    
        function buy(address tokenGet, address tokenGive,  string _string, uint256 _price, uint _expires, bytes32 _id) internal {

          uint256 len;
          bytes32 referenceId;
          bytes32 mem = 0;
          
          tikersInfo[tokenGet].orders[_id].tokenGet = tokenGet;
          tikersInfo[tokenGet].orders[_id].tokenGive = tokenGive;
          tikersInfo[tokenGet].orders[_id].order = _string;
          tikersInfo[tokenGet].orders[_id].price = _price;
          tikersInfo[tokenGet].orders[_id].expires = _expires;
          
          len = tikersInfo[tokenGet].buyOrders.length;
          if(len == 0){
              tikersInfo[tokenGet].buyOrders.push(_id);
          }
          
          if(len > 0 && len < 25){
              referenceId = tikersInfo[tokenGet].buyOrders[len-1];
              if(tikersInfo[tokenGet].orders[referenceId].price <= _price){
                  tikersInfo[tokenGet].buyOrders.push(_id);
              }else{
                  for(uint k=0; k < len; k++){
                      referenceId = tikersInfo[tokenGet].buyOrders[k];
                      if(tikersInfo[tokenGet].orders[referenceId].price > _price){
                          //checks that id saved amount be higher than amountGive
                          if(mem > 0){
                            tikersInfo[tokenGet].buyOrders[k] = mem;
                          }else{
                            tikersInfo[tokenGet].buyOrders[k] = _id;
                          }
                          mem = referenceId;                          
                          _price = tikersInfo[tokenGet].orders[mem].price;
                      }
                  }
                  if(mem > 0){
                      tikersInfo[tokenGet].buyOrders.push(mem);
                  }
              }
          }
          
          if(len == 25){
              referenceId = tikersInfo[tokenGet].buyOrders[len-1];
              if(tikersInfo[tokenGet].orders[referenceId].price <= _price){
                  revert();
              }else{
                  
                  for(uint l=0; l < len; l++){
                      referenceId = tikersInfo[tokenGet].buyOrders[l];
                      if(tikersInfo[tokenGet].orders[referenceId].price > _price){
                          if(mem > 0){
                            tikersInfo[tokenGet].buyOrders[l] = mem;
                          }else{
                            tikersInfo[tokenGet].buyOrders[l] = _id;
                          }
                          mem = referenceId;
                          _price = tikersInfo[tokenGet].orders[mem].price;
                      }
                  }
              }
          }
    }
    
    function getBuyLength(address token) public view returns(uint){
        return tikersInfo[token].buyOrders.length;
    }
    
    function getSellLength(address token) public view returns(uint){
        return tikersInfo[token].sellOrders.length;
    }
    
    function checkStoredBuys(address _token) internal{
        uint len = tikersInfo[_token].buyOrders.length;
        bytes32 referenceId;
        if(len > 0){
            for(uint index = 0; index < len; index++) {
                referenceId = tikersInfo[_token].buyOrders[index];
                if(tikersInfo[_token].orders[referenceId].expires > block.number) {
                    arr.push(referenceId);
                }
            }
                
            delete tikersInfo[_token].buyOrders;
            tikersInfo[_token].buyOrders = arr;
            
            delete arr;
          }
    }
    
    function checkStoredSells(address _token) internal{
        uint len = tikersInfo[_token].sellOrders.length;
        bytes32 referenceId;
        if(len > 0){           
            for(uint index = 0; index < len; index++) {
                referenceId = tikersInfo[_token].sellOrders[index];
                if(tikersInfo[_token].orders[referenceId].expires > block.number) {
                    arr.push(referenceId);
                }
            }
                
            delete tikersInfo[_token].sellOrders;
            tikersInfo[_token].sellOrders = arr;
            
            delete arr;
          }
    }

    function deleteOrders(address _tokenGet, address _tokenGive, bytes32 _hash) public {
        require(msg.sender == LSCX_Market);
        if(_tokenGet == 0x0000000000000000000000000000000000000000){
            deleteSellOrders(_tokenGive, _hash);
        }
        
        if(_tokenGive == 0x0000000000000000000000000000000000000000){
            deleteBuyOrders(_tokenGet, _hash);
        }
    }
    
    function deleteSellOrders(address _token, bytes32 _hash) internal{
        uint len = tikersInfo[_token].sellOrders.length;
        bytes32 referenceId;
        
        if(len > 0){
            for(uint index = 0; index < len; index++){
                referenceId = tikersInfo[_token].sellOrders[index];
                
                if(referenceId != _hash){
                    arr.push(referenceId);
                }
            }
            delete tikersInfo[_token].sellOrders;
            tikersInfo[_token].sellOrders = arr;
            
            delete arr;
        }
    }
    
    function deleteBuyOrders(address _token, bytes32 _hash) internal{
        uint len = tikersInfo[_token].buyOrders.length;
        bytes32 referenceId;
        
        if(len > 0){
            for(uint index = 0; index < len; index++){
                referenceId = tikersInfo[_token].buyOrders[index];
                if(referenceId != _hash){
                    arr.push(referenceId);
                }
            }
            delete tikersInfo[_token].buyOrders;
            tikersInfo[_token].buyOrders = arr;
            
            delete arr;
        }
    }
}