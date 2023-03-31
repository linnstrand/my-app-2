import Head from 'next/head';
import { Inter } from 'next/font/google';
import styles from '@/styles/Home.module.css';
import { Tree } from '@/components/Tree';
import { Tree3 } from '@/components/Tree3';
import { Tree4 } from '@/components/Tree4';
import { Tree2 } from '@/components/Tree2';
const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <Tree3 />
        <Tree2 />
        <Tree />
        <Tree4 />
      </main>
    </>
  );
}
