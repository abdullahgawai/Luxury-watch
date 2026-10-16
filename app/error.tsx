'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="prose section"><h1>A brief interruption.</h1><p>We could not load this page. Retrying does not change your device selections.</p><button onClick={reset}>Try again</button><a href="/">Return home</a></main>;}
