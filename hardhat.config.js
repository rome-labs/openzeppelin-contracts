/// ENVVAR
// - CI:                output gas report to file instead of stdout
// - COVERAGE:          enable coverage report
// - ENABLE_GAS_REPORT: enable gas report
// - COMPILE_MODE:      production modes enables optimizations (default: development)
// - COMPILE_VERSION:   compiler version (default: 0.8.9)
// - COINMARKETCAP:     coinmarkercat api key for USD value in gas report

const getStringValue = (input) => {
  return input === undefined ? '' : input;
};

const getArrayValue = (input) => {
  return input === undefined ? [] : String(input).split(',');
};

const Config = {
  privateKeys: getArrayValue(process.env.PRIVATE_KEYS),
  networkId: getStringValue(process.env.NETWORK_ID),
  proxyUrl: getStringValue(process.env.PROXY_URL),
};

const fs = require('fs');
const path = require('path');
const argv = require('yargs/yargs')()
  .env('')
  .options({
    coverage: {
      type: 'boolean',
      default: false,
    },
    gas: {
      alias: 'enableGasReport',
      type: 'boolean',
      default: false,
    },
    gasReport: {
      alias: 'enableGasReportPath',
      type: 'string',
      implies: 'gas',
      default: undefined,
    },
    mode: {
      alias: 'compileMode',
      type: 'string',
      choices: ['production', 'development'],
      default: 'development',
    },
    ir: {
      alias: 'enableIR',
      type: 'boolean',
      default: false,
    },
    compiler: {
      alias: 'compileVersion',
      type: 'string',
      default: '0.8.13',
    },
    coinmarketcap: {
      alias: 'coinmarketcapApiKey',
      type: 'string',
    },
  }).argv;

require('@nomiclabs/hardhat-truffle5');
require('hardhat-ignore-warnings');
require('hardhat-exposed');

require('solidity-docgen');

for (const f of fs.readdirSync(path.join(__dirname, 'hardhat'))) {
  require(path.join(__dirname, 'hardhat', f));
}

const withOptimizations = argv.gas || argv.compileMode === 'production';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: argv.compiler,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: withOptimizations && argv.ir,
    },
  },
  defaultNetwork: 'neonlabs',
  networks: {
    neonlabs: {
      url: Config.proxyUrl,
      accounts: Config.privateKeys,
      network_id: parseInt(Config.networkId),
      gas: 'auto',
      gasPrice: 'auto',
      allowUnlimitedContractSize: !withOptimizations,
      timeout: 180000,
      isFork: true,
    },
    proxy: {
      url: "http://proxy:9090",
      accounts: [
        '0x9dd8ddd87e32f889d418bcd439a7ed655080ff1398e2c40e0c51f97f8144f1d7',
        '0xfecc92070c894cc391255e994d139dd985ea9d6d7fa56bfa26bdbac3d4e20529',
        '0x50668d800b0b4ae6f8f2b8a6d33e41d0343fb9b0eeeffc1455394da980c7630b',
        '0x8fbc3706df502f376bcd9bf7490416e763182268afa8f10077267bf927ce9732',
        '0xe33f5542f7f1aa9a9a4b03868a79c421494326aa711e886145d8592aa7ecabcb',
        '0x10598591937c4978776b4876446a146a530af4bc6bb896732fcfff8d8b0732cb',
      ],
      timeout: 180000,
      allowUnlimitedContractSize: true,
      initialBaseFeePerGas: argv.coverage ? 0 : undefined,
    },
    op_geth: {
      url: "http://geth:8545",
      accounts: [
        '0x9dd8ddd87e32f889d418bcd439a7ed655080ff1398e2c40e0c51f97f8144f1d7',
        '0xfecc92070c894cc391255e994d139dd985ea9d6d7fa56bfa26bdbac3d4e20529',
        '0x50668d800b0b4ae6f8f2b8a6d33e41d0343fb9b0eeeffc1455394da980c7630b',
        '0x8fbc3706df502f376bcd9bf7490416e763182268afa8f10077267bf927ce9732',
        '0xe33f5542f7f1aa9a9a4b03868a79c421494326aa711e886145d8592aa7ecabcb',
        '0x10598591937c4978776b4876446a146a530af4bc6bb896732fcfff8d8b0732cb',
      ],
      timeout: 180000,
    },
  },
  warnings: {
    '*': {
      'code-size': withOptimizations,
      'unused-param': !argv.coverage, // coverage causes unused-param warnings
      default: 'error',
    },
  },
  gasReporter: {
    showMethodSig: true,
    currency: 'USD',
    outputFile: argv.gasReport,
    coinmarketcap: argv.coinmarketcap,
  },
  mocha: {
    timeout: 600000,
    reporter: 'mocha-multi-reporters',
    reporterOption: {
      reporterEnabled: 'spec, allure-mocha',
      allureMochaReporterOptions: {
        resultsDir: '../../allure-results',
      },
    },
  },
  exposed: {
    exclude: [
      'vendor/**/*',
      // overflow clash
      'utils/Timers.sol',
    ],
  },
  docgen: require('./docs/config'),
};

if (argv.gas) {
  require('hardhat-gas-reporter');
  module.exports.gasReporter = {
    showMethodSig: true,
    currency: 'USD',
    outputFile: argv.gasReport,
    coinmarketcap: argv.coinmarketcap,
  };
}

if (argv.coverage) {
  require('solidity-coverage');
  module.exports.networks.hardhat.initialBaseFeePerGas = 0;
}
