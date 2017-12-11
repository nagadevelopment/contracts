pragma solidity 0.4.18;


import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/ownership/NoOwner.sol";


contract NAGACoin is MintableToken, NoOwner {
    string public constant name = "NAGA Coin";
    string public constant symbol = "NGC";
    uint8 public constant decimals = 18;

    mapping (address => uint256) public releaseTimes;

    function mintWithTimeLock(address _to, uint256 _amount, uint256 _releaseTime) public returns (bool) {
        if (_releaseTime > releaseTimes[_to]) {
            releaseTimes[_to] = _releaseTime;
        }

        return mint(_to, _amount);
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        // Transfer of time-locked funds is forbidden
        require(!timeLocked(msg.sender));

        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        // Transfer of time-locked funds is forbidden
        require(!timeLocked(_from));

        return super.transferFrom(_from, _to, _value);
    }

    // Checks if funds of a given address are time-locked
    function timeLocked(address _spender) public returns (bool) {
        if (releaseTimes[_spender] == 0) {
            return false;
        }

        // If time-lock is expired, delete it
        // We consider timestamp dependency to be safe enough in this application
        if (releaseTimes[_spender] <= block.timestamp) {
            delete releaseTimes[_spender];
            return false;
        }

        return true;
    }
}
