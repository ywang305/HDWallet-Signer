const ERC20_ABI = require("./ERC20_API");
const { EthTxSigner } = require("./EthTxSigner");

class Erc20TxSigner extends EthTxSigner {
  constructor(privKey, contractAddress, fromAddress) {
    super(privKey);
    this.contractAddress = contractAddress;
    this.fromAddress = fromAddress;
    // @ts-ignore
    this.contract = new this.eth.Contract(ERC20_ABI, contractAddress);
  }

  async getNonce(address) {
    return await this.eth.getTransactionCount(address, "pending");
  }

  /**
   *
   * @param {string} to : 真正的接受者地址
   * @param {string} value : 单位 ether
   * @param {string} speed : enum [ slow, norm, fast]
   * @returns
   */
  async signTx(to, value, speed = "norm") {
    const txValue = this.utils.toWei(value);
    const nonce = await this.getNonce(this.fromAddress);
    const tx = {
      nonce,
      to: this.contractAddress,
      value: "0x0",
      gasPrice: await this.getGasPrice(),
      gas: this.getGasLimit(speed),
      data: this.contract.methods.transfer(to, txValue).encodeABI(),
    };

    const encodetx = await this.eth.accounts.signTransaction(tx, this.privKey);
    return {
      txid: encodetx.transactionHash,
      signedTx: encodetx.rawTransaction,
    };
  }
}

module.exports = { Erc20TxSigner };
