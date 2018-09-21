pragma solidity ^0.4.20;

/*
    Copyright 2018, Vicent Nos & Enrique Santos
    
    License:
    https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode

 */


//////////////////////////////////////////////////////////////
//                                                          //
//  Lescovex, Certificates x509 Signature                           //
//                                                          //
//////////////////////////////////////////////////////////////

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

contract LCX_Certificates_x509 is Ownable{
    

    mapping (uint256 => CA) certificateAuthority;
    mapping (address => Entity) entities;
    mapping (address => mapping (address => Signature)) Signatures;
    mapping (address => ownerSignatures) OwnerSignatures;

   struct CA{
        string issuer;
        string certificate;
    }

    struct Entity{
        string publicKey;
        string signature;
      
    }

    struct Signature{
       
        string certificate;
        string signature;
    }

    struct ownerSignatures{
        address contractAddress;
      
    }

    event AddCA(address owner ,address contractAddress, string certificate);
    event AddEntity(address owner, string publicKey ,string signature);
    event AddSignature(address contractAddr, address owner, string certificate, string signature);


    function addCA(string issuer, uint256 fingerprint, string certificate) public onlyOwner{
        
        certificateAuthority[fingerprint].issuer=issuer;
        certificateAuthority[fingerprint].certificate=certificate;

    }

    function addEntity(address addr,string entity, string signature) public {
       
        entities[addr].publicKey=entity;
        entities[addr].signature=signature;
       
    }

    function addSignature(address addr,string signature, address contractAddr, string certificate) public {
      
        
        Signatures[contractAddr][addr].certificate=certificate;
        Signatures[contractAddr][addr].signature=signature;
        OwnerSignatures[addr].contractAddress=contractAddr;

    }
    
   
    function getSignature(address contractAddr, address owner) public view returns(string,string) {
        return (Signatures[contractAddr][owner].certificate, Signatures[contractAddr][owner].signature);
    }

    function getOwnerSignature(address _of) public view returns(address) { 
        return (OwnerSignatures[_of].contractAddress);
    }

    function getEntity(address addr) public view returns(string) {
        return entities[addr].publicKey;
    }
    
}