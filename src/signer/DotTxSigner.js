const { TxSigner } = require("./TxSigner");
const { cryptoWaitReady } = require("@polkadot/util-crypto");
const {
  construct,
  getRegistry,
  methods,
  createMetadata,
} = require("@substrate/txwrapper-polkadot");
const { Keyring } = require("@polkadot/keyring");
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { EXTRINSIC_VERSION } = require("@polkadot/types/extrinsic/v4/Extrinsic");
const { BigNumber } = require("bignumber.js");

class DotTxSigner extends TxSigner {
  constructor(privKey, keepSignerAlive = true) {
    super(privKey);
    this._wsProvider = new WsProvider("wss://rpc.polkadot.io");
    this.keepSignerAlive = keepSignerAlive;
  }

  async _getKeyPair() {
    await cryptoWaitReady();
    let privKey = this.privKey;
    if (!privKey.startsWith("0x")) privKey = "0x" + privKey;
    const keyring = new Keyring({ type: "sr25519", ss58Format: 0 });

    const keypair = keyring.createFromUri(privKey, {
      whenCreated: Date.now(),
    });
    return keypair;
  }

  async getAPI() {
    if (this.api) return this.api;

    try {
      this.api = await ApiPromise.create({ provider: this._wsProvider });
      return this.api;
    } catch (err) {
      return null;
    }
  }

  async _getNonce(ADDR) {
    const api = await this.getAPI();
    const { nonce } = await api.query.system.account(ADDR);
    return nonce.toNumber();
  }

  /**
   *
   * @returns {Promise<object>}
   */
  async _getBlockNumber() {
    const api = await this.getAPI();
    const { block } = await api.rpc.chain.getBlock();
    return block.header.number.toNumber();
  }
  /**
   *
   * @returns {Promise<string>}
   */
  async _getBlockhash() {
    const api = await this.getAPI();
    const blockHash = await api.rpc.chain.getBlockHash();
    return blockHash.toHex();
  }
  async _getGenesisHash() {
    const api = await this.getAPI();
    const blockHash = await api.rpc.chain.getBlockHash(0);
    return blockHash.toHex();
  }
  async _getMetadata() {
    const api = await this.getAPI();
    const metadata = await api.rpc.state.getMetadata();
    return metadata.toHex();
  }
  async _getRuntimeVersion() {
    const api = await this.getAPI();
    const { specVersion, transactionVersion, specName } =
      await api.rpc.state.getRuntimeVersion();
    return {
      specVersion: specVersion.toNumber(),
      transactionVersion: transactionVersion.toNumber(),
      specName: specName.toString(),
    };
  }

  /**
   *
   * @param {string} to
   * @param {string} value unit in DOT
   * @param {string} speed slow|norm|fast
   * @returns
   */
  async signTx(to, value, speed) {
    console.info(to, value, speed);

    const blockNumber = await this._getBlockNumber();
    const blockHash = await this._getBlockhash();
    const genesisHash = await this._getGenesisHash();
    const metadataRpc = await this._getMetadata();
    const { specVersion, transactionVersion, specName } =
      await this._getRuntimeVersion();

    // Create Polkadot's type registry.
    const registry = getRegistry({
      chainName: "Polkadot",
      specName,
      specVersion,
      metadataRpc,
    });

    const keypair = await this._getKeyPair();
    const fromAddress = keypair.address;
    const nonce = await this._getNonce(fromAddress);
    // const unsigned = methods.balances.transfer()
    const unsigned = (
      this.keepSignerAlive
        ? methods.balances.transferKeepAlive
        : methods.balances.transfer
    )(
      {
        value: new BigNumber(value).multipliedBy(1e10).toString(),
        dest: to, // TO ADDRESS
      },
      {
        address: fromAddress,
        blockHash,
        blockNumber: registry.createType("BlockNumber", blockNumber).toNumber(),
        eraPeriod: 64,
        genesisHash,
        metadataRpc,
        nonce, //0, // Assuming this is Alice's first tx on the chain
        specVersion,
        tip: 0,
        transactionVersion,
      },
      {
        metadataRpc,
        registry,
      }
    );
    const signingPayload = construct.signingPayload(unsigned, { registry });

    const signature = signWith(keypair, signingPayload, {
      metadataRpc,
      registry,
    });

    // Serialize a signed transaction.
    const tx = construct.signedTx(unsigned, signature, {
      metadataRpc,
      registry,
    });
    console.log(`\nTransaction to Submit: ${tx}`);

    // Derive the tx hash of a signed transaction offline.
    const expectedTxHash = construct.txHash(tx);
    console.log(`\nExpected Tx Hash: ${expectedTxHash}`);
    return { txid: expectedTxHash, signedTx: tx };
  }

  async toWIF() {
    let pass = "abc";
    const keypair = await this._getKeyPair();
    const json = keypair.toJson(pass);
    const keystore = {
      version: 3,
      ...json,
      id: "Yao",
      meta: {
        whenCreated: json.meta.whenCreated,
        chain: "polkadot",
        name: "Polka-HDAccount",
        network: "polkadot",
        source: "suri",
      },
    };
    return JSON.stringify(keystore);
  }
}

function signWith(pair, signingPayload, options) {
  const { registry, metadataRpc } = options;
  // Important! The registry needs to be updated with latest metadata, so make
  // sure to run `registry.setMetadata(metadata)` before signing.
  registry.setMetadata(createMetadata(registry, metadataRpc));

  const { signature } = registry
    .createType("ExtrinsicPayload", signingPayload, {
      version: EXTRINSIC_VERSION,
    })
    .sign(pair);

  return signature;
}

module.exports = { DotTxSigner };
