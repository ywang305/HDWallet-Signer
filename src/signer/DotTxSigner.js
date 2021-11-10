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

class DotTxSigner extends TxSigner {
  constructor(privKey, fromAddress) {
    super(privKey);
    this.fromAddress = fromAddress;
    this._wsProvider = new WsProvider("wss://rpc.polkadot.io");
  }

  async _getKeyPair() {
    await cryptoWaitReady();
    const privKey = this.privKey;
    if (!privKey.startsWith("0x")) privKey = "0x" + privKey;
    const keyring = new Keyring({ type: "sr25519", ss58Format: 0 });

    const keypair = keyring.createFromUri(privKey, {
      whenCreated: Date.now(),
    });
    return keypair;
  }

  async getAPI() {
    try {
      this.api =
        this.api ?? (await ApiPromise.create({ provider: this._wsProvider }));
    } catch (err) {
      return null;
    }
  }

  /**
   *
   * @returns {Promise<object>}
   */
  async _getBlock() {
    const api = await this.getAPI();
    const { block } = await api?.rpc.chain.getBlock();
    return block;
  }
  /**
   *
   * @returns {Promise<string>}
   */
  async _getBlockhash() {
    const api = await this.getAPI();
    const blockHash = await api?.rpc.chain.getBlockHash();
    return blockHash;
  }
  async _getGenesisHash() {
    const api = await this.getAPI();
    const blockHash = await api?.rpc.chain.getBlockHash(0);
    return blockHash;
  }
  async _getMetadata() {
    const api = await this.getAPI();
    const metadata = await api?.rpc.state.getMetadata();
    return metadata;
  }
  async _getRuntimeVersion() {
    const api = await this.getAPI();
    const { specVersion, transactionVersion, specName } =
      await api?.rpc.state.getRuntimeVersion();
    return { specVersion, transactionVersion, specName };
  }

  async signTx(to, value, speed) {
    console.info(speed);

    const block = await this._getBlock();
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

    const unsigned = methods.balances.transferKeepAlive(
      {
        value: value,
        dest: to, // TO ADDRESS
      },
      {
        address: this.fromAddress,
        blockHash,
        blockNumber: registry
          .createType("BlockNumber", block.header.number)
          .toNumber(),
        eraPeriod: 64,
        genesisHash,
        metadataRpc,
        nonce: 0, // Assuming this is Alice's first tx on the chain
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
    console.log(`\nDOT Payload to Sign: ${signingPayload}`);
    const keypair = await this._getKeyPair();
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
