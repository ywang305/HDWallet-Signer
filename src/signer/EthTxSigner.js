const Web3 = require("web3");
const { TxSigner } = require("./TxSigner");

const ETH_PROVIDER =
  process.env.ETH_PROVIDER || process.env.VUE_APP_ETH_PROVIDER;

class EthTxSigner extends TxSigner {
  constructor(privKey) {
    super(privKey);
    const { eth, utils } = new Web3(ETH_PROVIDER);
    this.eth = eth;
    this.utils = utils;
  }

  getGasLimit(speed) {
    let gasLimit = 60_000;
    if (/slow/i.test(speed)) gasLimit = 21_000;
    else if (/high/i.test(speed)) gasLimit = 140_000;
    return gasLimit;
  }

  /**
   *
   * @returns {Promise<string>} price unit wei
   */
  async getGasPrice() {
    const priceAsWei = await this.eth.getGasPrice();
    return priceAsWei;
  }

  /**
   *
   * @param {string} to
   * @param {string} value
   * @param {string} speed
   * @returns {Promise<{txid: string, signedTx: any}>}
   */
  async signTx(to, value, speed = "norm") {
    const gasLimit = this.getGasLimit(speed);

    const tx = {
      to,
      value: this.utils.toWei(value),
      gasPrice: await this.getGasPrice(),
      gas: gasLimit,
    };

    const encodetx = await this.eth.accounts.signTransaction(tx, this.privKey);

    return {
      txid: encodetx.transactionHash,
      signedTx: encodetx.rawTransaction,
    };
  }

  toWIF() {
    return this.privKey;
  }
}

module.exports = { EthTxSigner };
