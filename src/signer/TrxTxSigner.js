const { TxSigner } = require("./TxSigner");
const TronWeb = require("tronweb");
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider("https://api.trongrid.io");
const solidityNode = new HttpProvider("https://api.trongrid.io");
const eventServer = new HttpProvider("https://api.trongrid.io");

const API_KEY = process.env.TRON_API_KEY || process.env.VUE_APP_TRON_API_KEY;

class TrxTxSigner extends TxSigner {
  /**
   *
   * @param {string} privKey
   * @param {string} fromAddress base58
   */
  constructor(privKey, fromAddress) {
    super(privKey);
    this.fromAddress = fromAddress;
    this.tron = new TronWeb(fullNode, solidityNode, eventServer);
    this.tron.setHeader({
      "TRON-PRO-API-KEY": API_KEY,
    });
  }

  async signTx(to, value, speed) {
    console.info(speed);
    value = this.tron.toSun(value);
    const tradeObj = await this.tron.transactionBuilder.sendTrx(
      to,
      value,
      this.fromAddress
    );
    const signedTx = await this.tron.trx.sign(tradeObj, this.privKey);
    return { txid: signedTx.txID, signedTx };
  }

  async toWIF() {
    return this.privKey;
  }
}

module.exports = { TrxTxSigner };
