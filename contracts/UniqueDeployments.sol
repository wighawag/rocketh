pragma solidity ^0.5.0;

contract UniqueDeployments{
    
    mapping(bytes32 => address) deployed; 

    event Deployment(bytes32 indexed hash, address deployedAddress);

    function saveDeployment(bytes32 _hash, address _deployedAddress) external {
        if(deployed[_hash] == address(0)) {
            deployed[_hash] = _deployedAddress;
            emit Deployment(_hash, _deployedAddress);
        }
    }

    function getDeployedAddress(bytes32 _hash) external view returns(address) {
        return deployed[_hash];
    }
}