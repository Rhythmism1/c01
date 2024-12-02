// pages/setup.tsx

import { motion } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Button } from "@/components/button/Button";

export default function Setup() {
  const router = useRouter();
  const title = "Setup Guide - Voice Agent with Cartesia";

  const setupSteps = [
    {
      title: "Cartesia API Setup",
      content: [
        "Visit Cartesia's website and create an account",
        "Navigate to account settings to generate your API key",
        "Record a 5-20 second clear audio clip of your voice (minimal background noise)",
        "Follow Cartesia's voice cloning process and name your voice",
        "Copy your API key to use in the application"
      ]
    },
    {
      title: "Virtual Audio Cable Setup",
      content: [
        "Download VB-CABLE from vb-audio.com/Cable/",
        "Install VB-CABLE Virtual Audio Device",
        "Reboot your system if prompted",
        "Configure system audio settings to use VB-CABLE",
        "Set CABLE Input as default speaker",
        "Set CABLE Output as default microphone"
      ]
    },
    {
      title: "Zoom Configuration",
      content: [
        "Open Zoom Settings → Audio",
        "Set Speaker to CABLE Input (VB-Audio Virtual Cable)",
        "Set Microphone to CABLE Output (VB-Audio Virtual Cable)",
        "Test audio configuration in Zoom"
      ]
    },
    {
      title: "Application Configuration",
      content: [
        "Set audio input to CABLE Output",
        "Ensure computer's audio output is set to CABLE Input",
        "Configure your Cartesia API key in the application",
        "Test the voice connection"
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Setup instructions for your Voice Agent with Cartesia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="relative flex min-h-screen flex-col bg-white repeating-square-background">
        <Header 
          logo={<img src="/new-logo.png" alt="prance logo" className="h-8" />}
          title={title}
          height={64}
          onConnectClicked={() => {}}
        />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-bold mb-4">Getting Started</h1>
            <p className="text-gray-600 text-lg">
              Follow these steps to set up your Voice Agent with Cartesia
            </p>
          </motion.div>

          {/* Setup Steps */}
          <div className="grid gap-8">
            {setupSteps.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white p-6 rounded-lg shadow-solid-offset border-2 border-black"
              >
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <ul className="space-y-3">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm">
                        {i + 1}
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Important Notes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-6 bg-yellow-50 rounded-lg border-2 border-yellow-500"
          >
            <h3 className="text-xl font-bold mb-4">Important Notes</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• For high-similarity clones, use a 5-second voice clip</li>
              <li>• For high-stability clones, use 10-20 second recordings</li>
              <li>• Ensure recordings have minimal background noise</li>
              <li>• Test your audio setup before starting a session</li>
            </ul>
          </motion.div>

          {/* Navigation Buttons */}
          <div className="mt-12 flex justify-center gap-4">
            <Button
              state="secondary"
              size="large"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
            <Button
              state="primary"
              size="large"
              onClick={() => router.push('/agent')}
            >
              Launch Agent
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}