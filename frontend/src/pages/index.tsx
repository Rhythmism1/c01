import { motion } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button } from "@/components/button/Button";

export default function LandingPage() {
  const router = useRouter();
  const title = "LiveKit Voice Agent with Cartesia";
  const description = "This is a demo of a LiveKit Voice Pipeline Agent using Cartesia and GPT-4o-mini.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="relative flex min-h-screen flex-col bg-white repeating-square-background">
        {/* Header Section */}
        <div className="flex gap-4 py-4 px-4 text-cyan-500 justify-between items-center shrink-0 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <img src="/cartesia-logo.svg" alt="Cartesia logo" className="h-8" />
            <span className="font-semibold text-black">{title}</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center flex-grow px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black">
              Welcome to Cartesia Voice Agent
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Experience the next generation of voice interaction powered by LiveKit and GPT-4
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button 
                state="primary"
                size="large"
                onClick={() => router.push('/agent')}
                className="min-w-[200px]"
              >
                Launch Agent
              </Button>
              
              <Button 
                state="secondary"
                size="large"
                onClick={() => router.push('/setup')}
                className="min-w-[200px]"
              >
                Setup The Agent
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 px-8 py-16 bg-gray-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-6 bg-white rounded-lg shadow-solid-offset"
          >
            <h3 className="text-xl font-bold mb-3">Real-time Voice Processing</h3>
            <p className="text-gray-600">Advanced voice recognition and processing capabilities</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-6 bg-white rounded-lg shadow-solid-offset"
          >
            <h3 className="text-xl font-bold mb-3">AI-Powered Responses</h3>
            <p className="text-gray-600">Intelligent conversations powered by GPT-4</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center p-6 bg-white rounded-lg shadow-solid-offset"
          >
            <h3 className="text-xl font-bold mb-3">Low Latency</h3>
            <p className="text-gray-600">High-performance voice communication with LiveKit</p>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-gray-600 border-t-2 border-black">
          <p>© 2024 Cartesia. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}