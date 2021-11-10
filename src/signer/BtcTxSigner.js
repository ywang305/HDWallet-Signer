const { default: axios } = require("axios");
const bitcore = require("bitcore-lib");
const WIF = require("wif");
const { TxSigner } = require("./TxSigner");

class BtcTxSigner extends TxSigner {
  constructor(privKey, fromAddress) {
    super(privKey);
    this.fromAddress = fromAddress;
    this.defaultFee = 1000;
    this.wif = WIF.encode(0x80, Buffer.from(privKey, "hex"), true);
    // @ts-ignore
    this.bitcorePrivateKey = bitcore.PrivateKey.fromWIF(this.wif);

    this.insightApi = axios.create({
      baseURL: "https://api.bitcore.io/api/BTC/mainnet",
    });
    ("https://api.bitcore.io/api/BTC/testnet/address/mg5BH3gH9DEazQhstNWjtde4Au5e36u4J9");
  }

  /**
   *
   * @param {string} to
   * @param {string} value  'BTC'
   * @param {*} speed
   * @param {string} change  from or to or designated address
   * @returns {Promise<{txid, signedTx}>}
   */
  async signTx(to, value, speed, change = this.fromAddress) {
    console.info(speed);

    const utxoList = await this.getUtxos(this.fromAddress); // request utxos by this.fromAddress
    const tx = new bitcore.Transaction()
      .from(utxoList) // from 可以是 single utxo or utxo list
      .to(to, this.toSatoshis(value))
      .fee(this.defaultFee)
      .change(change)
      .sign(this.bitcorePrivateKey);

    const signedTx = tx.serialize();
    const txid = new bitcore.Transaction(signedTx).hash;
    return { txid, signedTx };
  }

  toSatoshis(fromBtc) {
    return bitcore.Unit.fromBTC(Number(fromBtc)).toSatoshis();
  }

  /**
   * BTC 的交易可以包含 多个to 地址
   * @param {[{to, value}]} toList
   * @param {*} speed
   * @param {*} change
   * @returns
   */
  async signTxs(toList, speed, change = this.fromAddress) {
    console.info(speed);

    const utxoList = await this.getUtxos(this.fromAddress); // request utxos by this.fromAddress
    const tx = new bitcore.Transaction();
    toList.forEach(({ to, value }) => {
      tx.to(to, this.toSatoshis(value));
    });
    tx.from(utxoList) // from 可以是 single utxo or utxo list
      .fee(this.defaultFee)
      .change(change)
      .sign(this.bitcorePrivateKey);
    const signedTx = tx.serialize();
    const txid = new bitcore.Transaction(signedTx).hash;
    return { txid, signedTx };
  }

  async toWIF() {
    return this.wif;
  }

  async getUtxos(address) {
    const mapUtxo = ({ mintTxid, mintIndex, address, script, value }) => ({
      txId: mintTxid,
      outputIndex: mintIndex,
      address,
      script,
      satoshis: value,
    });

    const { data } = await this.insightApi.get(`/address/${address}`);
    const utxos = data.filter((item) => !item.spentTxid.trim()).map(mapUtxo);
    return utxos;
  }
}

module.exports = { BtcTxSigner };
