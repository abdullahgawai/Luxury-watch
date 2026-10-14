'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="prose section"><h1>A brief interruption.</h1><p>We could not load this page. Your saved watches remain on this device.</p><button onClick={reset}>Try again</button><a href="/">Return home</a></main>;}
