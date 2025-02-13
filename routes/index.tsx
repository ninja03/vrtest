import { Head } from "$fresh/runtime.ts";
import VRScene from "../islands/VRScene.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>VR Experience</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            overflow: hidden;
            touch-action: none;
          }
          
          canvas {
            touch-action: none;
            outline: none;
          }
        `}</style>
      </Head>
      <VRScene />
    </>
  );
}
