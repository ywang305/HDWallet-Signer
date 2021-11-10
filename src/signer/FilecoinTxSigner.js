const { TxSigner } = require("./TxSigner");
const axios = require("axios");
const { FilecoinSigner } = require("@blitslabs/filecoin-js-signer");
const { BigNumber } = require("bignumber.js");

const FIL_PROVIDER =
  process.env.FIL_PROVIDER || process.env.VUE_APP_FIL_PROVIDER;

class FilecoinTxSigner extends TxSigner {
  constructor(privKey) {
    super(privKey);
    const myAxios = axios.create({ baseURL: FIL_PROVIDER });
    this.request = async (payload) => {
      try {
        const { data } = await myAxios.post("", payload);
        return data;
      } catch (err) {
        console.error(err);
      }
    };
    this.signingTools = new FilecoinSigner();
  }

  getGasLimit(speed) {
    const gasLimit =
      speed === "fast" ? 1_300_000 : speed === "slow" ? 800_000 : 1_100_000;
    return gasLimit;
  }

  /**
   *
   * @param {string} to
   * @param {string|number} value unit FIL
   * @param {*} speed
   * @returns {Promise<{txid , signedTx }>}
   */
  async signTx(to, value, speed) {
    const amount = new BigNumber(value).multipliedBy(1e18).toString();
    const gasLimit = this.getGasLimit(speed);

    const keys = this.signingTools.wallet.keyRecover(this.privKey, "mainnet");
    const from = keys.address;
    const nonceRes = await this.request({
      id: 0,
      jsonrpc: "2.0",
      method: "Filecoin.MpoolGetNonce",
      params: [from],
    });
    const message = {
      From: from,
      To: to.trim(),
      Nonce: nonceRes?.result,
      Value: amount,
      GasLimit: gasLimit,
      GasFeeCap: "0",
      GasPremium: "500000",
      Method: 0,
      Params: "",
    };
    // Get Unsigned Message with Gas Estimation
    const msgGasRes = await this.request({
      id: 0,
      jsonrpc: "2.0",
      method: "Filecoin.GasEstimateMessageGas",
      params: [message, { MaxFee: "0" }, []],
    });
    if ("error" in msgGasRes) {
      console.error(msgGasRes.error);
      throw new Error(msgGasRes.error);
    }
    // Sign Message
    const signedTx = JSON.parse(
      this.signingTools.tx.transactionSignLotus(msgGasRes?.result, this.privKey)
    );

    return { txid: null, signedTx };
  }

  async toWIF() {
    const base64Key = Buffer.from(this.privKey, "hex").toString("base64");
    const lotusPrivKey = Buffer.from(
      JSON.stringify({
        Type: "secp256k1",
        PrivateKey: base64Key,
      })
    ).toString("hex");
    return lotusPrivKey;
  }
}

module.exports = { FilecoinTxSigner };
