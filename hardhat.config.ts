import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import dotenv from 'dotenv'
import networks from './networks'
import 'hardhat-tracer'
import 'solidity-docgen'

dotenv.config()

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.22',
		settings: {
			viaIR: true,
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks,
	gasReporter: {
		enabled: true,
		currency: 'USD',
		gasPrice: 30,
		coinmarketcap: 'af8ddfb6-5886-41fe-80b5-19259a3a03be',
	},
	etherscan: {
		apiKey: {
			// Moonbeam
			moonbeam: process.env.MOONBEAMSCAN_TOKEN as string,
			moonbaseAlpha: process.env.MOONBEAMSCAN_TOKEN as string, // Moonbeam Moonscan API Key
			// Ethereum
			mainnet: process.env.ETHERSCAN_TOKEN as string,
			goerli: process.env.ETHERSCAN_TOKEN as string,
			// Polygon
			polygon: process.env.POLYGONSCAN_TOKEN as string,
			polygonMumbai: process.env.POLYGONSCAN_TOKEN as string,
			bsc: process.env.BSCSCAN_TOKEN as string,
			bscTestnet: process.env.BSCSCAN_TOKEN as string,
			arbitrumOne: process.env.ARBISCAN_TOKEN as string,
			fantom: process.env.FTMSCAN_TOKEN as string,
		},
		customChains: [
			{
				network: 'fantom',
				chainId: 250,
				urls: {
					apiURL: 'https://api.ftmscan.com/api',
					browserURL: 'https://ftmscan.com/',
				},
			},
		],
	},
	docgen: {
		pages: 'files',
	},
}

export default config
