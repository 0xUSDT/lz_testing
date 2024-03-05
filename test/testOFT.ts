import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import hre, { ethers } from 'hardhat'
import { deployments } from 'hardhat'
// import {OFT} from '../typechain-types'
import { EndpointV2Mock, OToken } from '../typechain-types'
import { Options } from '@layerzerolabs/lz-v2-utilities'

describe('MyOFT Test', async function () {
	it('should send a token from A address to B address via each OFT', async function () {
		// Constant representing a mock Endpoint ID for testing purposes
		const eidA = 1
		const eidB = 2

		// Before hook for setup that runs once before all tests in the block
		// Contract factory for our tested contract
		const MyOFTFactory = await ethers.getContractFactory('oToken')

		// Fetching the first three signers (accounts) from Hardhat's local Ethereum network
		const [ownerA, ownerB, endpointOwner] = await ethers.getSigners()

		const EndpointV2MockArtifact =
			await deployments.getArtifact('EndpointV2Mock')

		const EndpointV2Mock = new ContractFactory(
			EndpointV2MockArtifact.abi,
			EndpointV2MockArtifact.bytecode,
			endpointOwner,
		)

		const mockEndpointA = (await EndpointV2Mock.deploy(
			eidA,
		)) as EndpointV2Mock

		const mockEndpointB = (await EndpointV2Mock.deploy(
			eidB,
		)) as EndpointV2Mock

		console.log('mockEndpoint', mockEndpointA.target)
		console.log('mockEndpointB', mockEndpointB.target)

		const myOFTA = (await MyOFTFactory.deploy(
			'aOFT',
			'aOFT',
			mockEndpointA.target,
			ownerA.address,
		)) as OToken

		const myOFTB = (await MyOFTFactory.deploy(
			'bOFT',
			'bOFT',
			mockEndpointB.target,
			ownerB.address,
		)) as OToken

		await mockEndpointA.setDestLzEndpoint(
			myOFTB.target,
			mockEndpointB.target,
		)
		await mockEndpointB.setDestLzEndpoint(
			myOFTA.target,
			mockEndpointA.target,
		)

		await myOFTA
			.connect(ownerA)
			.setPeer(eidB, ethers.zeroPadValue(myOFTB.target, 32))
		await myOFTB
			.connect(ownerB)
			.setPeer(eidA, ethers.zeroPadValue(myOFTA.target, 32))

		const initialAmount = ethers.parseEther('100')

		await myOFTA.mint(ownerA.address, initialAmount)

		const tokensToSend = ethers.parseEther('1')
		const sendParam = [
			eidB,
			ethers.zeroPadValue(ownerB.address, 32),
			tokensToSend,
			tokensToSend,
		]
		const options = Options.newOptions()
			.addExecutorLzReceiveOption(200000, 0)
			.toHex()
			.toString()

		const [nativeFee] = await myOFTA.quoteSend(
			sendParam,
			options,
			false,
			`0x`,
			`0x`,
		)

		console.log(
			'Quote data',
			await myOFTA.quoteSend(sendParam, options, false, `0x`, `0x`),
		)

		await myOFTA.send(
			sendParam,
			options,
			[nativeFee, 0],
			ownerA.address,
			'0x',
			'0x',
			{
				value: nativeFee,
			},
		)
		const finalBalanceA = await myOFTA.balanceOf(ownerA.address)
		const finalBalanceB = await myOFTB.balanceOf(ownerB.address)

		console.log('Tokens sent: ', tokensToSend)
		console.log('Final balance A: ', finalBalanceA)
		console.log('Final balance B: ', finalBalanceB)

		expect(finalBalanceA).to.equal(initialAmount - tokensToSend)
		expect(finalBalanceB).to.equal(tokensToSend)
		return 0
	})
})

// 		// Asserting that the final balances are as expected after the send operation
// 		expect(finalBalanceA.eq(initialAmount.sub(tokensToSend))).to.be.true
// 		expect(finalBalanceB.eq(tokensToSend)).to.be.true
// 	})
// })
