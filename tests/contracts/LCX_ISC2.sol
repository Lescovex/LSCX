pragma solidity ^0.4.19;

/*
    Copyright 2018, Vicent Nos, Enrique Santos & Mireia Puig
    
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


//////////////////////////////////////////////////////////////
//                                                          //
//  Lescovex Equity ERC20                                   //
//                                                          //
//////////////////////////////////////////////////////////////

contract LescovexERC20 is Ownable {

    using SafeMath for uint256;


    mapping (address => uint256) public balances;

    mapping (address => mapping (address => uint256)) internal allowed;

    mapping (address => timeHold) holded;

    struct timeHold{
        uint256[] amount;
        uint256[] time;
        uint256 length;
    }



    /* Public variables for the ERC20 token */
    string public constant standard = "ERC20 Lescovex ISC2 Income Smart Contract";
    uint8 public constant decimals = 8; // hardcoded to be a constant
    uint256 public totalSupply;
    uint256 public holdTime;
    string public name;
    string public symbol;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);


    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }


    function holdedOf(address _owner, uint256 n) public view returns (uint256) {
        return holded[_owner].amount[n];
    }

    function hold(address _to, uint256 _value) internal {
        holded[_to].amount.push(_value);
        holded[_to].time.push(block.number);
        holded[_to].length++;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {

        require(_to != address(0));
        require(_value <= balances[msg.sender]);
        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);

        delete holded[msg.sender];
        hold(msg.sender,balances[msg.sender]);
        hold(_to,_value);

        balances[_to] = balances[_to].add(_value);

        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);
        balances[_from] = balances[_from].sub(_value);

        delete holded[msg.sender];
        hold(msg.sender,balances[_from]);
        hold(_to,_value);

        balances[_to] = balances[_to].add(_value);
        //allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);

        Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256) {
        return allowed[_owner][_spender];
    }

    function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
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


contract Lescovex_ISC2 is LescovexERC20 {

    uint256 public tokenReward = 0;
    // constant to simplify conversion of token amounts into integer form
    uint256 public tokenUnit = uint256(10)**decimals;

    //Declare logging events
    event LogDeposit(address sender, uint amount);
    event LogWithdrawal(address receiver, uint amount);


    /* Initializes contract with initial supply tokens to the creator of the contract */
    function Lescovex_ISC2(
        uint256 initialSupply,
        string name,
        string symbol,
        uint256 holdTime,
        address owner

        ) public {
        totalSupply = initialSupply;  // Update total supply
        name = name;             // Set the name for display purposes
        symbol = symbol;         // Set the symbol for display purposes
        holdTime=holdTime;
        balances[owner]= balances[owner].add(totalSupply);

    }

    function () public {

    }


  uint256 public contractBalance=0;

    function deposit() external payable onlyOwner returns(bool success) {
        // Check for overflows;

        assert (this.balance + msg.value >= this.balance); // Check for overflows
        contractBalance=this.balance;
        tokenReward = this.balance / totalSupply;

        //executes event to reflect the changes
        LogDeposit(msg.sender, msg.value);

        return true;
    }

    function withdrawReward() external {

        uint i = 0;
        uint256 ethAmount = 0;
        uint256 len = holded[msg.sender].length;

        while (i <= len - 1){
            if (block.number -  holded[msg.sender].time[i] > holdTime){
                ethAmount += tokenReward * holded[msg.sender].amount[i];
            }
            i++;
        }

        delete holded[msg.sender];
        hold(msg.sender,balances[msg.sender]);
        require(ethAmount > 0);

        //send eth to owner address
        msg.sender.transfer(ethAmount);

        //executes event to register the changes
        LogWithdrawal(msg.sender, ethAmount);
    }

    function withdraw(uint256 value) external onlyOwner {
        //send eth to owner address
        msg.sender.transfer(value);

        //executes event to register the changes
        LogWithdrawal(msg.sender, value);
    }



}
