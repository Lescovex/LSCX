pragma solidity ^0.4.20;



/*
    Copyright 2018, Vicent Nos & Enrique Santos

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    

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
    


    mapping (address => mapping (address => Cert)) Certificates;

    mapping (address => ownerCerts) OwnerCertificates;
    mapping (uint256 => CA) certificateAuthority;


    struct Cert{
        
        uint256 CA;
        string subjectKeyIdentifier;
        string signature;
        string certificate;
        string publicKey;
        
    }

    struct ownerCerts{
        address[] contractAddress;
        uint256 length;
    }

    struct CA{

        string issuer;
        string publicKey;
        string webPage;
        string certificate;
    
    }

    event AddCertificate(address owner,uint256 CA, string subject,address contractAddress, string signature);

    function addCA(string issuer, uint256 fingerprint, string pubkey, string webpage, string certificate) public onlyOwner{
        
        certificateAuthority[fingerprint].issuer=issuer;
        certificateAuthority[fingerprint].publicKey=pubkey;
        certificateAuthority[fingerprint].webPage=webpage;
        certificateAuthority[fingerprint].certificate=certificate;

    }

    function addCertificate(uint256 ca, string serialNumber, address contractAddr, string signature, string pubkey,string certificate) public {
      
        uint256 n = OwnerCertificates[msg.sender].length;

        Certificates[contractAddr][msg.sender].CA=ca;
     
        Certificates[contractAddr][msg.sender].subjectKeyIdentifier=serialNumber;
        Certificates[contractAddr][msg.sender].publicKey=pubkey;
        Certificates[contractAddr][msg.sender].signature=signature;
        Certificates[contractAddr][msg.sender].certificate=certificate;
        
        OwnerCertificates[msg.sender].contractAddress[n]=contractAddr;
        OwnerCertificates[msg.sender].length++;

        AddCertificate(msg.sender, ca, serialNumber,contractAddr, signature);
    
    }
    
   
    function getCertificate(address contractAddr, address owner) public view returns(uint256,string,string,string) {
        return (Certificates[contractAddr][owner].CA, Certificates[contractAddr][owner].subjectKeyIdentifier, Certificates[contractAddr][owner].publicKey, Certificates[contractAddr][owner].signature);
    }

    function getOwnerCertificate(address _of, uint256 n) public view returns(address) { 
        return (OwnerCertificates[_of].contractAddress[n]);
    }








    function memcpy(uint dest, uint src, uint len) private pure{
        // Copy word-length chunks while possible
        for(; len >= 32; len -= 32) {
            assembly {
                mstore(dest, mload(src))
            }
            dest += 32;
            src += 32;
        }

        // Copy remaining bytes
        uint mask = 256 ** (32 - len) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask))
            let destpart := and(mload(dest), mask)
            mstore(dest, or(destpart, srcpart))
        }
    }


    uint8[]  SHA256PREFIX = [
        0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20
    ];
    
    function join(bytes s, bytes e, bytes m) internal pure returns (bytes) {
        uint input_len = 0x60+s.length+e.length+m.length;
        
        uint s_len = s.length;
        uint e_len = e.length;
        uint m_len = m.length;
        uint s_ptr;
        uint e_ptr;
        uint m_ptr;
        uint input_ptr;
        
        bytes memory input = new bytes(input_len);
        assembly {
            s_ptr := add(s,0x20)
            e_ptr := add(e,0x20)
            m_ptr := add(m,0x20)
            mstore(add(input,0x20),s_len)
            mstore(add(input,0x40),e_len)
            mstore(add(input,0x60),m_len)
            input_ptr := add(input,0x20)
        }
        memcpy(input_ptr+0x60,s_ptr,s.length);        
        memcpy(input_ptr+0x60+s.length,e_ptr,e.length);        
        memcpy(input_ptr+0x60+s.length+e.length,m_ptr,m.length);

        return input;
    }



    function pkcs1Sha256Verify(bytes32 hash, bytes s, bytes e, bytes m) public returns (uint){
        uint i;
        
        require(m.length >= SHA256PREFIX.length+hash.length+11);

        /// decipher
        bytes memory input = join(s,e,m);
        uint input_len = input.length;

        uint decipherlen = m.length;
        bytes memory decipher=new bytes(decipherlen);
        bool success;
        assembly {
            success := call(sub(gas, 2000), 5, 0, add(input,0x20), input_len, add(decipher,0x20), decipherlen)
            switch success case 0 { invalid }
        }

        /// 0x00 || 0x01 || PS || 0x00 || DigestInfo
        /// PS is padding filled with 0xff
        //  DigestInfo ::= SEQUENCE {
        //     digestAlgorithm AlgorithmIdentifier,
        //     digest OCTET STRING
        //  }
        
        uint paddingLen = decipherlen - 3 - SHA256PREFIX.length - 32;
        
        if (decipher[0] != 0 || decipher[1] != 1) {
            return 1;
        }
        for (i=2;i<2+paddingLen;i++) {
            if (decipher[i] != 0xff) {
                return 2;
            }
        }
        if (decipher[2+paddingLen] != 0) {
            return 3;
        }
        for (i=0;i<SHA256PREFIX.length;i++) {
            if (uint8(decipher[3+paddingLen+i])!=SHA256PREFIX[i]) {
                return 4;
            }
        }
        for (i=0;i<hash.length;i++) {
            if (decipher[3+paddingLen+SHA256PREFIX.length+i]!=hash[i]) {
                return 5;
            }
        }

        return 0;
    }

    function uints2bytes(uint[4] memory v) public pure returns (bytes) {
        bytes memory b = new bytes(4*32);
        uint v_ptr;
        uint b_ptr;
        assembly {
            v_ptr := v
            b_ptr := add(b,0x20)
        }
         memcpy(b_ptr,v_ptr,b.length); 
         return b;
    }
    
    function uints2bytes(uint[1] memory v) public pure returns (bytes) {
        bytes memory b = new bytes(32);
        uint v_ptr;
        uint b_ptr;
        assembly {
            v_ptr := v
            b_ptr := add(b,0x20)
        }
        memcpy(b_ptr,v_ptr,b.length); 
        return b;
    }

    
}