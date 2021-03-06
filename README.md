# hdwallet-signer

To sign transactions of multi coins using the standard private key (hex string) generated by HDKey, specially designed for HDWallet.

## supported transaction signatures and WIF export

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
- config blockchain providers .env file in your project root path

  - ETH_PROVIDER
  - FIL_RPOVIDER
  - TRON_API_KEY

  ```sh
  ETH_PROVIDER=...your-node or Infura or getBlock...
  FIL_PROVIDER=...same as above
  TRON_API_KEY=...api key for tron official (https://api.trongrid.io)
  ```

## examples of WIF generation

```js
const { BtcTxSigner } = require("hdwallet-signer");
// ... fromPrivKey, fromAddress
let signer = new BtcTxSigner(fromPrivKey, fromAddress);
const walletImportFormat = await signer.toWIF();
```

## examples of signing

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
// ! make sure you have ETH_PROVIDER configured in .env
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
    signedTx: '0xf86b8085328751b03d82ea60949d4ed752b5643a04???25f4e329866b626c8075fdfd2b08c0a838405176fc3'
}
*/
```

### sign ERC20

API: signTx(toAddress, value, speed)

- @param {string} to : toAddress
- @param {string} value : transferred amount, unit in 'ETH' (1e18 wei)
- @param {optional<string>} speed : enum string of 'slow'|'norm'|'fast', default is 'norm'
- @returns {Promise<{txid, signedTx}>}

```js
// ! make sure you have ETH_PROVIDER configured in .env
require("dotenv").config();

const { Erc20TxSigner } = require("hdwallet-signer");

const fromPrivKey =
  "0x697f372c2195229f243c6bfd5b87224f9687152aad719cbb6e116f9f9cd797d7";
const contractAddress = "0x94659a764bb5802984935b9046598c39f40d9d23";
const fromAddress = "0x92C9473d57dA9544D1895A1eb9550C4864b29Ef9";
const toAddress = "0x9d4ed752B5643a04043F06E8748Ef64a99DD2C4c";

const signer = new Erc20TxSigner(fromPrivKey, contractAddress, fromAddress);

async function testErc20TxSigner() {
  const { txid, signedTx } = await signer.signTx(toAddress, "0.01");
}
```

### sign TRX

API: signTx(toAddress, value, speed)

- @param {string} to : toAddress
- @param {string} value : transferred amount, unit in 'TRX'
- @param {optional<string>} speed : enum string of 'slow'|'norm'|'fast', default is 'norm'
- @returns {Promise<{txid, signedTx}>}

```js
// ! make sure you have TRON_API_KEY configured in .env
require("dotenv").config();

const { TrxTxSigner } = require("hdwallet-signer");

const fromPrivKey =
  "0x697f372c2195229f243c6bfd5b87224f9687152aad719cbb6e116f9f9cd797d7";
const fromAddress = "TPUu851pymrh3NViZSBiZpGwwQFyj4W4G8";
const toAddress = "TR1359Ak89QBnw8qBSMVc1cdUMoxuyxhwC";

const signer = new Erc20TxSigner(fromPrivKey, fromAddress);

async function testErc20TxSigner() {
  const { txid, signedTx } = await signer.signTx(toAddress, "0.01");
}
```

### sign TRC20

API: signTx(toAddress, value, speed)

- @param {string} to : toAddress
- @param {string} value : transferred amount, unit in 'TRX'
- @param {optional<string>} speed : enum string of 'slow'|'norm'|'fast', default is 'norm'
- @returns {Promise<{txid, signedTx}>}

```js
// ! make sure you have TRON_API_KEY configured in .env
require("dotenv").config();

const { Trc20TxSigner } = require("hdwallet-signer");

const fromPrivKey =
  "0x697f372c2195229f243c6bfd5b87224f9687152aad719cbb6e116f9f9cd797d7";
const contractAddress = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";
const fromAddress = "TPUu851pymrh3NViZSBiZpGwwQFyj4W4G8";
const toAddress = "TR1359Ak89QBnw8qBSMVc1cdUMoxuyxhwC";

const signer = new Trc20TxSigner(fromPrivKey, fromAddress, contractAddress);

async function testErc20TxSigner() {
  const { txid, signedTx } = await signer.signTx(toAddress, "0.01");
}
```

### sign FILECOIN

API: signTx(toAddress, value, speed)

- @param {string} to : toAddress
- @param {string} value : transferred amount, unit in 'FIL'
- @param {optional<string>} speed : enum string of 'slow'|'norm'|'fast', default is 'norm'
- @returns {Promise<{txid, signedTx}>}

```js
// ! make sure you have FIL_PROVIDER configured in .env
require("dotenv").config();

const { FilecoinTxSigner } = require("hdwallet-signer");

const fromPrivKey =
  "0x697f372c2195229f243c6bfd5b87224f9687152aad719cbb6e116f9f9cd797d7";
const contractAddress = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";
const fromAddress = "f15rzbm5k7lruezelads6vcucv3s6x5fz3mw2tzzi";
const toAddress = "f15jmyddwfxeas6ugy66y2wvnhss7byy6n25m2trq";

const signer = new FilecoinTxSigner(fromPrivKey);

async function testErc20TxSigner() {
  const { txid, signedTx } = await signer.signTx(toAddress, "0.01"); // note: txid alaways is null
}
```

### sign DOT

API: signTx(toAddress, value, speed)

- @param {string} to : toAddress
- @param {string} value : transferred amount, unit in 'DOT'
- @param {optional<string>} speed : enum string of 'slow'|'norm'|'fast', default is 'norm'
- @returns {Promise<{txid, signedTx}>}

```js
const { DotTxSigner } = require("hdwallet-signer");

const fromPrivKey =
  "0x697f372c2195229f243c6bfd5b87224f9687152aad719cbb6e116f9f9cd797d7";
const toAddress = "12bkmmjNebSZwoFbmBEAWE35gCVLjPYmtGRgmGECD2qnXQT9";

const signer = new DotTxSigner(fromPrivKey);
/**
 * // if you'd like to send all tokens out of the signer's account,
 * // set a 2nd construcotr param as keepSignerAlive = false, like:
 * const signer = new DotTxSigner(fromPrivKey, false);
 **/

async function testErc20TxSigner() {
  const { txid, signedTx } = await signer.signTx(toAddress, "0.01");
}
```
