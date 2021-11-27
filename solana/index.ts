import { message } from "antd";
import { Program, Provider, web3, BN } from "@project-serum/anchor";
import {
  clusterApiUrl,
  Commitment,
  Connection,
  ConnectionConfig,
  PublicKey,
} from "@solana/web3.js";
import { AnchorVoting } from "../anchor-voting/target/types/anchor_voting";
import idl from "../anchor-voting/target/idl/anchor_voting.json";
import kp from "../keypair.json";
import useSWR, { mutate } from "swr";

export const PROGRAM_ID = new PublicKey(idl.metadata.address);

const { SystemProgram } = web3;

const baseAccount = web3.Keypair.fromSecretKey(
  new Uint8Array(Object.values(kp._keypair.secretKey))
);

const opts: { commitment: Commitment } = {
  commitment: "processed",
};

const getProvider = () => {
  // Set our network to devnet.
  const network = clusterApiUrl("devnet");
  const connection = new Connection(network, opts.commitment);
  const provider = new Provider(connection, (window as any)?.solana, opts);
  return provider;
};

export const createProposal = async (proposal: {
  title: string;
  description: string;
}) => {
  const provider = getProvider();
  const program = getProgram();
  await program.rpc.addProposal(proposal.title, proposal.description, {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });
  mutate("/baseAccount");
};

export const voteForProposal = async (id: BN, vote: boolean) => {
  const hide = message.loading("Voting in progress..", 0);
  try {
    const provider = getProvider();
    const program = getProgram();
    await program.rpc.voteForProposal(new BN(id), vote, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });
    mutate("/baseAccount");
    message.success("Voted");
  } catch (err) {
    message.error((err as Error)?.message);
  } finally {
    setTimeout(hide, 100);
  }
};

const getProgram = (): Program<AnchorVoting> => {
  const provider = getProvider();
  const program: Program<AnchorVoting> = new Program(
    idl as any,
    PROGRAM_ID,
    provider
  );
  return program;
};

const programFetcher = async (...args: any[]) => {
  const provider = getProvider();
  const program: Program<AnchorVoting> = new Program(
    idl as any,
    PROGRAM_ID,
    provider
  );
  return program.account.baseAccount.fetch(baseAccount.publicKey);
};

export const useBaseAccount = () => {
  const { data, error } = useSWR(`/baseAccount`, programFetcher);
  return {
    baseAccount: data,
    isLoading: !error && !data,
    isError: error,
  };
};

export const createBaseAccountForProposals = async () => {
  try {
    const provider = getProvider();
    const program: Program<AnchorVoting> = new Program(
      idl as any,
      PROGRAM_ID,
      provider
    );
    await program.rpc.initializeVoting({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount],
    });
    message.success(
      `Created a new BaseAccount w/ address: ${baseAccount.publicKey.toString()}`
    );
  } catch (e) {
    console.error("Error creating BaseAccount account:", e);
  }
};
