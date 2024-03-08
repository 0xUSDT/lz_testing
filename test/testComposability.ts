import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import hre, { ethers } from 'hardhat'
import { deployments } from 'hardhat'
// import {OFT} from '../typechain-types'
import { EndpointV2Mock, OToken } from '../typechain-types'
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { BytesLike } from 'ethers'

describe('Composability test', async function () {
	it('should send omnichain msg via composer', async function () {
		const eidA = 1
		const eidB = 2

		const OmniSenderFactory = await ethers.getContractFactory('OmniSender')
		const CounterFactory = await ethers.getContractFactory('Counter')

		const [ownerA, ownerB, endpointOwner] = await ethers.getSigners()

		const EndpointV2MockArtifact =
			await deployments.getArtifact('EndpointV2Mock')
		const EndpointV2Mock = new ContractFactory(
			EndpointV2MockArtifact.abi,
			EndpointV2MockArtifact.bytecode,
			endpointOwner,
		)

		//deploy Counter
		const counterB = await CounterFactory.deploy()

		//deploy Endpoints
		const mockEndpointA = (await EndpointV2Mock.deploy(
			eidA,
		)) as EndpointV2Mock

		const mockEndpointB = (await EndpointV2Mock.deploy(
			eidB,
		)) as EndpointV2Mock

		// console.log('mockEndpointA', mockEndpointA.target)
		// console.log('mockEndpointB', mockEndpointB.target)

		//deploy OApps
		const myOAppA = await OmniSenderFactory.deploy(
			mockEndpointA.target,
			ownerA.address,
		)
		const myOAppB = await OmniSenderFactory.deploy(
			mockEndpointB.target,
			ownerB.address,
		)
		await mockEndpointA.setDestLzEndpoint(
			myOAppB.target,
			mockEndpointB.target,
		)
		await mockEndpointB.setDestLzEndpoint(
			myOAppA.target,
			mockEndpointA.target,
		)

		//set peers
		await myOAppA
			.connect(ownerA)
			.setPeer(eidB, ethers.zeroPadValue(myOAppB.target, 32))

		await myOAppB
			.connect(ownerB)
			.setPeer(eidA, ethers.zeroPadValue(myOAppA.target, 32))

		let _options = Options.newOptions().addExecutorLzReceiveOption(
			10000000,
			0,
		)
		// .addExecutorComposeOption(0, 1000000, 0)

		const optionsBytes: BytesLike = _options.toHex().toString()

		const msgToSend = 'NewMsg'

		// console.log('MSG ON COUNTER BEFORE', await counterB.message())
		// console.log('MSG ON OMNI CHAIN B BEFORE', await myOAppB.message())

		const [nativeFee] = await myOAppA.quote(
			eidB,
			msgToSend,
			counterB.target,
			optionsBytes,
		)

		await myOAppA
			.connect(ownerA)
			.increaseCounterOnOtherChain(
				eidB,
				optionsBytes,
				counterB.target,
				msgToSend,
				{ value: nativeFee },
			)

		// console.log('MSG ON COUNTER AFTER', await counterB.message())
		// console.log('Counter = ', await counterB.count())
		// console.log('MSG ON OMNI CHAIN B AFTER', await myOAppB.message())

		expect(await counterB.message()).to.equal(msgToSend)
		expect(await counterB.count()).to.equal(1)
		expect(await myOAppB.message()).to.equal(msgToSend)
	})
})
