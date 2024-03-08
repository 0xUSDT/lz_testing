// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;
import {ILayerZeroComposer} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroComposer.sol";
import "hardhat/console.sol";

contract Counter is ILayerZeroComposer {
    uint256 public count;
    string public message;

    constructor() {
        count = 0;
        message = "None";
    }

    function increment() public {
        count++;
    }

    function lzCompose(
        address _from,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable override {
        //Decode _msg
        (bytes memory _functionCallPayload, string memory _msg) = abi.decode(
            _message,
            (bytes, string)
        );

        // console.log("BLA%s", _functionCallPayload);
        message = _msg;
        (bool success, ) = address(this).call(_functionCallPayload);
    }
}
