# hdwallet-signer

To sign transactions of multi coins using HDKey, specially designed for HDWallet

## support transaction signatures

- BTC
- ETH
- ERC20
- TRX
- TRC20
- FILECOIN
- DOT

## usage

- install package [hdwallet-signer](https://www.npmjs.com/package/hdwallet-signer)
  ```sh
  npm i hdwallet-signer
  ```
- config blockchain providers .env file in project root path

  ```sh
  ETH_PROVIDER=your-node or Infura or getBlock...
  TRON_API_KEY= api key for tron official (https://api.trongrid.io)
  FIL_PROVIDER=

  ```

## examples

to sign a tx of some coin, you need get a private key first, which is ideally derived from [HDKey](https://npmjs.com/package/hdkey)
, or any kind of HDWallet libarary that conforms to [BIP32](https://www.npmjs.com/package/bip32).

### sign BTC

API: signTx(toAddress, value, speed, changeAddress)

- @param {string} to : toAddress
- @param {string} value : transferred amount, unit in 'BTC'
- @param {optional<string>} speed : enum string of 'slow'|'norm'|'fast', default is 'norm'
- @param {optional<string>>} change : tx change address to utxo, default is this.fromAddress
- @returns {Promise<{txid, signedTx}>}

```js
const { BtcTxSigner } = require("hdwallet-signer");
const HDKey = require("hdkey");
var hdkey = HDKey.fromExtendedKey(
  "xprvA1XP8AGuV6mzBpFwAMAdduaeSSU9ftdcqRP26Vnu2EMu358hwZ6sWzep3sX2sz2W1CLCqmuZZXpPddLMXri4ax5FYre2Q8D6nHkTmDXNqe3"
);

// my account of BTC
const fromPrivKey = hdkey.privateKey.toString("hex");
const fromAddress = "1FXzNC24zPeDSmahsf5XbsVWoHVWE5HJ3B";

// sign tx: transfer of 0.001 BTC from 'fromAddress' to 'toAddress'
let btcSigner = new BtcTxSigner(fromPrivKey, fromAddress);
const { txid, signedTx } = await signer.signTx(toAddress, "0.001");
// then you may broadcast the signedTx onto btc chain nodes...
```

### sign Eth

API: signTx(toAddress, value, speed)

- @param {string} to : toAddress
- @param {string} value : transferred amount, unit in 'ETH'
- @param {optional<string>} speed : enum string of 'slow'|'norm'|'fast', default is 'norm'
- @returns {Promise<{txid, signedTx}>}

```js
// ! make sure you have ETH_PROVIDER in .env
require("dotenv").config();
const { EthTxSigner } = require("hdwallet-signer");

const fromPrivKey =
  "0x87b7307ff582b315b46dc3e9162d65959aa88e24175b2cfe0427bb9b16a8173c";
const toAddress = "0x9d4ed752B5643a04043F06E8748Ef64a99DD2C4c";

let signer = new EthTxSigner(fromPrivKey);

async function testEthTxSigner() {
  const { txid, signedTx } = await signer.signTx(toAddress, "0.01");
  console.log({ txid, signedTx });
}

testEthTxSigner();

/* console log output:
{
    txid: '0xc1c8c4495efffeeb49a3918ad52d88214573a6d634fed8c442339fd57c210c5e', 
    signedTx: '0xf86b8085328751b03d82ea60949d4ed752b5643a04…25f4e329866b626c8075fdfd2b08c0a838405176fc3'
}
*/
```
