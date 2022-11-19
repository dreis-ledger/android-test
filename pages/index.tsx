import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import LedgerLiveApi, { Account } from "@ledgerhq/live-app-sdk";

import styles from "../styles/Home.module.css";
import { WindowMessageProxyTransport } from "../shared/proxy";

export default function Home() {
  const api = useRef<LedgerLiveApi | null>(null);
  const iframeRef = useRef(null);
  const connected = useRef(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  async function handleClick() {
    if (connected.current && api.current) {
      const data = await api.current.listAccounts();
      setAccounts(data);
    }
  }

  useEffect(() => {
    api.current = new LedgerLiveApi(new WindowMessageProxyTransport(iframeRef));

    api.current.connect();
    connected.current = true;
    console.log("API connected");

    return () => {
      if (api.current) {
        api.current.disconnect();
        connected.current = false;
        console.log("API disconnected");
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>List Accounts App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Accounts</h1>

        <div className={styles.card}>
          <button onClick={handleClick}>List Accounts</button>
          <pre>{JSON.stringify(accounts, null, 2)}</pre>
        </div>
      </main>
    </div>
  );
}
