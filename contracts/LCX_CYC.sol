pragma solidity 0.4.24;

/*
    Copyright 2018, Vicent Nos, Enrique Santos & Mireia Puig

    License:
    https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode

 */


 /**
  * @title OpenZeppelin SafeMath
  * @dev Math operations with safety checks that throw on error
  */
  library SafeMath {

   /**
   * @dev Multiplies two numbers, throws on overflow.
   */
   function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
     // Gas optimization: this is cheaper than asserting 'a' not being zero, but the
     // benefit is lost if 'b' is also tested.
     // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
     if (a == 0) {
       return 0;
     }

     c = a * b;
     assert(c / a == b);
     return c;
   }

   /**
   * @dev Integer division of two numbers, truncating the quotient.
   */
   function div(uint256 a, uint256 b) internal pure returns (uint256) {
     // assert(b > 0); // Solidity automatically throws when dividing by 0
     // uint256 c = a / b;
     // assert(a == b * c + a % b); // There is no case in which this doesn't hold
     return a / b;
   }

   /**
   * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
   */
   function sub(uint256 a, uint256 b) internal pure returns (uint256) {
     assert(b <= a);
     return a - b;
   }

   /**
   * @dev Adds two numbers, throws on overflow.
   */
   function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
     c = a + b;
     assert(c >= a);
     return c;
   }
 }


 /**
  * @title OpenZeppelin Ownable
  * @dev The Ownable contract has an owner address, and provides basic authorization control
  * functions, this simplifies the implementation of "user permissions".
  */
 contract Ownable {
   address public owner;

   event OwnershipRenounced(address indexed previousOwner);
   event OwnershipTransferred(
     address indexed previousOwner,
     address indexed newOwner
   );

   /**
    * @dev The Ownable constructor sets the original `owner` of the contract to the sender
    * account.
    */
   constructor() public {
     owner = msg.sender;
   }

   /**
    * @dev Throws if called by any account other than the owner.
    */
   modifier onlyOwner() {
     require(msg.sender == owner);
     _;
   }

   /**
    * @dev Allows the current owner to relinquish control of the contract.
    * @notice Renouncing to ownership will leave the contract without an owner.
    * It will not be possible to call the functions with the `onlyOwner`
    * modifier anymore.
    */
   function renounceOwnership() public onlyOwner {
     emit OwnershipRenounced(owner);
     owner = address(0);
   }

   /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
   function transferOwnership(address _newOwner) public onlyOwner {
     _transferOwnership(_newOwner);
   }

   /**
    * @dev Transfers control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
   function _transferOwnership(address _newOwner) internal {
     require(_newOwner != address(0));
     emit OwnershipTransferred(owner, _newOwner);
     owner = _newOwner;
   }
 }


//////////////////////////////////////////////////////////////
//                                                          //
//  Lescovex, Open End Crypto Fund ERC20                    //
//                                                          //
//////////////////////////////////////////////////////////////

contract LescovexERC20 is Ownable {

  using SafeMath for uint256;

  mapping (address => uint256) public balances;

  mapping (address => mapping (address => uint256)) internal allowed;

  /* Public variables for the ERC20 token */
  string public constant standard = "ERC20 Lescovex CYC";
  uint8 public constant decimals = 18; // hardcoded to be a constant
  uint256 public totalSupply;
  string public name;
  string public symbol;

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

  function transfer(address _to, uint256 _value) public returns (bool) {

    require(_to != address(0));
    require(_value <= balances[msg.sender]);

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);

    balances[_to] = balances[_to].add(_value);

    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);

    balances[_from] = balances[_from].sub(_value);

    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);

    emit Transfer(_from, _to, _value);
    return true;
  }

  function approve(address _spender, uint256 _value) public returns (bool) {
    allowed[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) public view returns (uint256) {
    return allowed[_owner][_spender];
  }

  function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
    allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
    emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
    uint oldValue = allowed[msg.sender][_spender];
    if (_subtractedValue > oldValue) {
        allowed[msg.sender][_spender] = 0;
    } else {
        allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
    }
    emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

    /* Approve and then communicate the approved contract in a single tx */
  function approveAndCall(address _spender, uint256 _value, bytes _extraData) public returns (bool success) {
    tokenRecipient spender = tokenRecipient(_spender);

    if (approve(_spender, _value)) {
        spender.receiveApproval(msg.sender, _value, this, _extraData);
        return true;
      }
  }
}


interface tokenRecipient {
    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external ;
}


contract Lescovex_CYC is LescovexERC20 {

  //constant to simplify conversion of token amounts into integer form
    uint256 public tokenUnit = uint256(10)**decimals;

  //Declare logging events
    event LogDeposit(address sender, uint amount);

  /* Initializes contract with initial supply tokens to the creator of the contract */
    constructor(
            uint256 initialSupply,
            string contractName,
            string tokenSymbol,
            address contractOwner
        ) public {

        totalSupply = initialSupply;  // Update total supply
        name = contractName;             // Set the name for display purposes
        symbol = tokenSymbol;         // Set the symbol for display purposes
        owner = contractOwner;
        balances[contractOwner] = balances[contractOwner].add(totalSupply);

    }
}
