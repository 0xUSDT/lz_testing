// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

contract oToken is OFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
