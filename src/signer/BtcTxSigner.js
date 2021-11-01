import bitcore from "bitcore-lib";
import WIF from "wif";
import { TxSigner } from "./TxSigner";

export class BtcTxSigner extends TxSigner {
  constructor(privKey, fromAddress) {
    super(privKey);
    this.fromAddress = fromAddress;
    this.defaultFee = 1000;
    this.wif = WIF.encode(0x80, Buffer.from(privKey, "hex"), true);
    // @ts-ignore
    this.bitcorePrivateKey = bitcore.PrivateKey.fromWIF(this.wif);
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

    const utxoList = []; // request utxos by this.fromAddress
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

    const utxoList = []; // request utxos by this.fromAddress
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

  toWIF() {
    return this.wif;
  }
}
