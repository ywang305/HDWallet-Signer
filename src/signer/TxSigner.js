class TxSigner {
  /**
   *
   * @param {string} privKey
   */
  constructor(privKey) {
    this.privKey = privKey;
  }

  /**
   * sign TX
   * @param {string} to
   * @param {string} value
   * @param {'slow'|'norm'|'fast'} speed
   * @returns {Promise<{txid: string, signedTx: string}>}
   */
  async signTx(to, value, speed = "norm") {
    throw new Error("Not Implemented Method: signTx");
  }

  /**
   * Generate Token Address by Xpub
   * @param {*} xpub
   */
  async toAddress(xpub) {
    throw new Error("Not Implemented Method: toAddress");
  }

  /**
   * Generate Wallet Import Format / keystore
   * @returns {*}
   */
  toWIF() {
    throw new Error("Not Implemented Method: toWIF");
  }
}

module.exports = { TxSigner };
