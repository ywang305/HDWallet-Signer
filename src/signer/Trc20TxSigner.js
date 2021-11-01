const { TrxTxSigner } = require("./TrxTxSigner");

class Trc20TxSigner extends TrxTxSigner {
  /**
   *
   * @param {string} privKey
   * @param {string} fromAddress base58
   * @param {string} contractAddr base58
   */
  constructor(privKey, fromAddress, contractAddr) {
    super(privKey, fromAddress);
    this.contractAddress = this.addressToHex(contractAddr);
  }

  /**
   *
   * @param {string} base58
   * @returns hexAddress
   */
  addressToHex(base58) {
    return this.tron.address.toHex(base58);
  }

  /**
   *
   * @param {*} to
   * @param {*} value  // 主币单位 eth, trx..
   * @param {*} speed
   * @returns {Promise<{txid, signedTx}>}
   */
  async signTx(to, value, speed) {
    console.info(speed);
    const tron = this.tron;
    value = tron.toSun(value);

    const parameter = [
      { type: "address", value: to },
      { type: "uint256", value: value },
    ];
    const transaction = await tron.transactionBuilder.triggerSmartContract(
      this.contractAddress,
      "transfer(address,uint256)",
      {},
      parameter,
      this.addressToHex(this.fromAddress)
    );

    let signedTx = await tron.trx.sign(transaction.transaction, this.privKey);
    return { txid: signedTx.txID, signedTx };
  }
}

module.exports = { Trc20TxSigner };
