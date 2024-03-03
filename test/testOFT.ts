import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import hre, { ethers } from 'hardhat'
import { deployments } from 'hardhat'

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

		// const EndpointV2MockFactory = new ethers.ContractFactory(
		// 	EndpointV2MockArtifact.abi,
		// 	EndpointV2MockArtifact.bytecode,
		// 	endpointOwner, // or another signer if needed
		// )

		const mockEndpointA = await EndpointV2Mock.deploy(eidA)
		const mockEndpointB = await EndpointV2Mock.deploy(eidB)

		const myOFTA = await MyOFTFactory.deploy(
			'aOFT',
			'aOFT',
			mockEndpointA.target,
			ownerA.address,
			ethers.parseEther('1000'),
		)
		const myOFTB = await MyOFTFactory.deploy(
			'bOFT',
			'bOFT',
			mockEndpointB.target,
			ownerB.address,
			ethers.parseEther('1000'),
		)

		await mockEndpointA.setDestLzEndpoint(
			myOFTB.target,
			mockEndpointB.target,
		)
		await mockEndpointB.setDestLzEndpoint(
			myOFTA.target,
			mockEndpointA.target,
		)

		return 0
	})
})

// 	// Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
// 	await mockEndpointA.setDestLzEndpoint(myOFTB.address, mockEndpointB.address)
// 	await mockEndpointB.setDestLzEndpoint(myOFTA.address, mockEndpointA.address)

// 	// Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
// 	await myOFTA
// 		.connect(ownerA)
// 		.setPeer(eidB, ethers.utils.zeroPad(myOFTB.address, 32))
// 	await myOFTB
// 		.connect(ownerB)
// 		.setPeer(eidA, ethers.utils.zeroPad(myOFTA.address, 32))

// 	// A test case to verify token transfer functionality
// 	it('should send a token from A address to B address via each OFT', async function () {
// 		// Minting an initial amount of tokens to ownerA's address in the myOFTA contract
// 		const initialAmount = ethers.utils.parseEther('100')
// 		await myOFTA.mint(ownerA.address, initialAmount)

// 		// Defining the amount of tokens to send and constructing the parameters for the send operation
// 		const tokensToSend = ethers.utils.parseEther('1')
// 		const sendParam = [
// 			eidB,
// 			ethers.utils.zeroPad(ownerB.address, 32),
// 			tokensToSend,
// 			tokensToSend,
// 		]

// 		// Defining extra message execution options for the send operation
// 		const options = Options.newOptions()
// 			.addExecutorLzReceiveOption(200000, 0)
// 			.toHex()
// 			.toString()

// 		// Fetching the native fee for the token send operation
// 		const [nativeFee] = await myOFTA.quoteSend(
// 			sendParam,
// 			options,
// 			false,
// 			`0x`,
// 			`0x`,
// 		)

// 		// Executing the send operation from myOFTA contract
// 		await myOFTA.send(
// 			sendParam,
// 			options,
// 			[nativeFee, 0],
// 			ownerA.address,
// 			'0x',
// 			'0x',
// 			{
// 				value: nativeFee,
// 			},
// 		)

// 		// Fetching the final token balances of ownerA and ownerB
// 		const finalBalanceA = await myOFTA.balanceOf(ownerA.address)
// 		const finalBalanceB = await myOFTB.balanceOf(ownerB.address)

// 		// Asserting that the final balances are as expected after the send operation
// 		expect(finalBalanceA.eq(initialAmount.sub(tokensToSend))).to.be.true
// 		expect(finalBalanceB.eq(tokensToSend)).to.be.true
// 	})
// })
