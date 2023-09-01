import "mocha";

import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import * as sbv2 from "@switchboard-xyz/solana.js";
import { VrfClient } from "../target/types/vrf_client";
import { assert } from "chai";
import { BN } from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { NodeOracle } from "@switchboard-xyz/oracle";

describe("vrf-client", () => {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const program: anchor.Program<VrfClient> = anchor.workspace.VrfClient;
  const payer = (provider.wallet as sbv2.AnchorWallet).payer;

  const vrfSecret = anchor.web3.Keypair.generate();
  console.log(`VRF Account: ${vrfSecret.publicKey}`);

  const [vrfClientKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("CLIENTSEED"), vrfSecret.publicKey.toBytes()],
    program.programId
  );
  console.log(`VRF Client: ${vrfClientKey}`);

  // const vrfIxCoder = new anchor.BorshInstructionCoder(program.idl);
  // const vrfClientCallback: sbv2.Callback = {
  //   programId: program.programId,
  //   accounts: [
  //     // ensure all accounts in consumeRandomness are populated
  //     { pubkey: vrfClientKey, isSigner: false, isWritable: true },
  //     { pubkey: vrfSecret.publicKey, isSigner: false, isWritable: false },
  //   ],
  //   ixData: vrfIxCoder.encode("consumeRandomness", ""), // pass any params for instruction here
  // };

  let switchboard: sbv2.SwitchboardTestContext;
  let oracle: NodeOracle;
  let vrfAccount: sbv2.VrfAccount;

  before(async () => {
    switchboard = await sbv2.SwitchboardTestContext.loadFromProvider(provider, {
      // You can provide a keypair to so the PDA schemes dont change between test runs
      name: "Test Queue",
      keypair: sbv2.SwitchboardTestContextV2.loadKeypair(
       "./keypairs/keypair.json"
      ),
      queueSize: 10,
      reward: 0,
      minStake: 0,
      oracleTimeout: 900,
      unpermissionedFeeds: true,
      unpermissionedVrf: true,
      enableBufferRelayers: true,
      oracle: {
        name: "Test Oracle",
        enable: true,
        stakingWalletKeypair: sbv2.SwitchboardTestContextV2.loadKeypair(
          "./keypairs/oracles.json"
        ),
      },
    });

    oracle = await NodeOracle.fromReleaseChannel({
      chain: "solana",
      releaseChannel: "testnet",
      network: "localnet", // disables production capabilities like monitoring and alerts
      rpcUrl: switchboard.program.connection.rpcEndpoint,
      oracleKey: switchboard.oracle.publicKey.toBase58(),
      secretPath: switchboard.walletPath,
      silent: false, // set to true to suppress oracle logs in the console
      envVariables: {
        VERBOSE: "1",
        DEBUG: "1",
        DISABLE_NONCE_QUEUE: "1",
        DISABLE_METRICS: "1",
      },
    });

    await oracle.startAndAwait();
  });

  after(async () => {
    oracle?.stop();
  });

  it("init_client", async () => {
    const tx = await program.methods.initClient({}).rpc();
    console.log("init_client transaction signature", tx);
  });
});