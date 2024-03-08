// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroComposer.sol";
import {MessagingParams, MessagingFee, MessagingReceipt} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import "./Counter.sol";

library MsgCodec {
    uint8 internal constant VANILLA_TYPE = 1;
    uint8 internal constant COMPOSED_TYPE = 2;
    uint8 internal constant ABA_TYPE = 3;
    uint8 internal constant COMPOSED_ABA_TYPE = 4;

    uint8 internal constant MSG_TYPE_OFFSET = 0;
    uint8 internal constant SRC_EID_OFFSET = 1;
    uint8 internal constant VALUE_OFFSET = 5;

    function encode(
        uint8 _type,
        uint32 _srcEid
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(_type, _srcEid);
    }

    function encode(
        uint8 _type,
        uint32 _srcEid,
        uint256 _value
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(_type, _srcEid, _value);
    }

    function msgType(bytes calldata _message) internal pure returns (uint8) {
        return uint8(bytes1(_message[MSG_TYPE_OFFSET:SRC_EID_OFFSET]));
    }

    function srcEid(bytes calldata _message) internal pure returns (uint32) {
        return uint32(bytes4(_message[SRC_EID_OFFSET:VALUE_OFFSET]));
    }

    function value(bytes calldata _message) internal pure returns (uint256) {
        return uint256(bytes32(_message[VALUE_OFFSET:]));
    }
}

contract OmniSender is OApp {
    string public message;

    constructor(address _endpoint, address _owner) OApp(_endpoint, _owner) {}

    function increaseCounterOnOtherChain(
        uint32 _dstEid,
        bytes calldata _options,
        address counterContract,
        string memory _message
    ) external payable returns (MessagingReceipt memory receipt) {
        // Encodes the message before invoking _lzSend.
        bytes memory _functionCallPayload = abi.encodeWithSignature(
            "increment()"
        );

        bytes memory _msgToSend = abi.encode(_functionCallPayload, _message);

        bytes memory _payload = abi.encode(_msgToSend, counterContract);

        receipt = _lzSend(
            _dstEid,
            _payload,
            _options,
            // Fee in native gas and ZRO token.
            MessagingFee(msg.value, 0),
            // Refund address in case of failed source message.
            payable(msg.sender)
        );
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        // Decode the payload to get the message
        (bytes memory _data, address _counterContract) = abi.decode(
            _message,
            (bytes, address)
        );

        //Decode _msg
        (bytes memory _functionCallPayload, string memory _msg) = abi.decode(
            _data,
            (bytes, string)
        );

        // (bool success, ) = _counterContract.call(_functionCallPayload);
        // require(success, "Call to lzCompose failed.");

        //call lzCompose function
        Counter(_counterContract).lzCompose(
            address(this),
            _guid,
            _data,
            _executor,
            _extraData
        );
        message = _msg;
    }

    function quote(
        uint32 _eid,
        string memory _msg,
        address _counterContract,
        bytes calldata _options
    ) public view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory _functionCallPayload = abi.encodeWithSignature(
            "increment()"
        );

        bytes memory _msgToSend = abi.encode(_functionCallPayload, _msg);

        bytes memory _payload = abi.encode(_msgToSend, _counterContract);

        MessagingFee memory fee = _quote(_eid, _payload, _options, false);
        return (fee.nativeFee, fee.lzTokenFee);
    }
}
