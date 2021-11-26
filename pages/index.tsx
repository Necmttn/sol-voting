import type { NextPage } from "next";
import Head from "next/head";
import { CreateProposalModal } from "../components/create_proposal";
import { ProposalList } from "../components/proposal_list";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={"w-full max-w-5xl"}>
        <CreateProposalModal />
        <ProposalList />
      </main>
    </>
  );
};

export default Home;
