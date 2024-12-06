"use client";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { Header } from "@/components/Header";
import { Tile } from "@/components/Tile";
import { AgentMultibandAudioVisualizer } from "@/components/visualization/AgentMultibandAudioVisualizer";
import { useMultibandTrackVolume } from "@/hooks/useTrackVolume";
import { useWindowResize } from "@/hooks/useWindowResize";
import { useRef } from 'react';
import { Speaker } from 'lucide-react';

import {
  useConnectionState,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConnectionState, LocalParticipant, Track } from "livekit-client";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./button/Button";
import { MicrophoneButton } from "./MicrophoneButton";
import { MenuSVG } from "./ui/icons";

export interface AssistantProps {
  title?: string;
  logo?: ReactNode;
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

export interface Voice {
  id: string;
  user_id: string | null;
  is_public: boolean;
  name: string;
  description: string;
  created_at: Date;
  embedding: number[];
}

const headerHeight = 56;
const mobileWindowWidth = 768;
const desktopBarWidth = 72;
const desktopMaxBarHeight = 280;
const desktopMinBarHeight = 60;
const mobileMaxBarHeight = 140;
const mobileMinBarHeight = 48;
const mobileBarWidth = 48;
const barCount = 5;
const defaultVolumes = Array.from({ length: barCount }, () => [0.0]);
const AudioOutputSelector = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputDevices = allDevices.filter(
          (device): device is MediaDeviceInfo => device.kind === 'audiooutput'
        );
        setDevices(audioOutputDevices);
        
        if (audioOutputDevices.length > 0) {
          setSelectedDevice(audioOutputDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error accessing audio devices:", err);
      }
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(getDevices)
      .catch(console.error);

    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  const handleDeviceChange = async (deviceId: string) => {
    try {
      // Convert NodeList to Array and change output for all audio elements
      const audioElements = Array.from(document.querySelectorAll<HTMLAudioElement>('audio'));
      
      await Promise.all(audioElements.map(async (audioElement) => {
        if ('setSinkId' in audioElement) {
          await audioElement.setSinkId(deviceId);
        }
      }));
      
      setSelectedDevice(deviceId);
      setIsOpen(false);
    } catch (err) {
      console.error("Error switching audio output:", err);
    }
  };

  return (
    <div className="relative">
      <Button
        state="secondary"
        size="medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Speaker className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-2">
            <div className="text-sm font-medium mb-2 px-2">Select Audio Output</div>
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => handleDeviceChange(device.deviceId)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                  device.deviceId === selectedDevice
                    ? "bg-cartesia-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {device.label || `Speaker ${device.deviceId.slice(0, 4)}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default function Assistant({ title, logo, onConnect }: AssistantProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [customPrompt, setCustomPrompt] = useState(
    "You are an employee at a company. respond as such. Here is what you need to know for the zoom call:__"
  );
  const [assistantName, setAssistantName] = useState("Assistant");
  const { localParticipant } = useLocalParticipant();
  const [currentVoiceId, setCurrentVoiceId] = useState<string>("");
  const [showVoices, setShowVoices] = useState(true);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const windowSize = useWindowResize();
  const {
    agent: agentParticipant,
    state: agentState,
    audioTrack: agentAudioTrack,
    agentAttributes,
  } = useVoiceAssistant();
  const [isMobile, setIsMobile] = useState(false);
  const isAgentConnected = agentParticipant !== undefined;

  const roomState = useConnectionState();
  const tracks = useTracks();

  useEffect(() => {
    setShowVoices(windowSize.width >= mobileWindowWidth);
    setIsMobile(windowSize.width < mobileWindowWidth);
  }, [windowSize]);

  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setMicrophoneEnabled(true);
    }
  }, [localParticipant, roomState]);

  useEffect(() => {
    if (agentAttributes?.voices) {
      setVoices(JSON.parse(agentAttributes.voices));
    }
  }, [agentAttributes?.voices]);

  const subscribedVolumes = useMultibandTrackVolume(
    agentAudioTrack?.publication.track,
    barCount
  );

  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LocalParticipant
  );
  const localMicTrack = localTracks.find(
    ({ source }) => source === Track.Source.Microphone
  );

  const localMultibandVolume = useMultibandTrackVolume(
    localMicTrack?.publication.track,
    9
  );

  // Simplified change handlers that only update local state
  const handleNameChange = useCallback((newName: string) => {
    setAssistantName(newName);
  }, []);

  const handlePromptChange = useCallback((newPrompt: string) => {
    setCustomPrompt(newPrompt);
  }, []);

  // Combined apply changes function
  const applyPromptChanges = useCallback(() => {
    try {
      if (localParticipant && roomState === ConnectionState.Connected) {
        // Update both attributes at once
        localParticipant.setAttributes({
          ...localParticipant.attributes,
          assistant_name: assistantName,
          custom_prompt: customPrompt
        }).then(() => {
          // Close the editor after successful update
          setShowPromptEditor(false);
        }).catch((error) => {
          console.error('Failed to update attributes:', error);
        });
      }
    } catch (error) {
      console.error('Failed to apply changes:', error);
    }
  }, [localParticipant, roomState, assistantName, customPrompt]);

  const onSelectVoice = useCallback(
    async (voiceId: string) => {
      try {
        setCurrentVoiceId(voiceId);
        if (localParticipant && roomState === ConnectionState.Connected) {
          await localParticipant.setAttributes({
            ...localParticipant.attributes,
            voice: voiceId,
          });
        }
      } catch (error) {
        console.error('Failed to update voice:', error);
        setCurrentVoiceId(prev => prev);
      }
    },
    [localParticipant, roomState]
  );
  const promptEditorPanel = useMemo(() => (
    <motion.div 
      className="absolute bottom-0 left-0 right-0 bg-white p-4 shadow-lg rounded-t-lg"
      initial={{ y: "100%" }}
      animate={{ y: showPromptEditor ? 0 : "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-mono font-semibold text-sm">Assistant Configuration</h3>
          <Button
            state="secondary"
            size="small"
            onClick={() => setShowPromptEditor(false)}
          >
            Close
          </Button>
        </div>
        
        {/* Name Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="assistant-name" className="text-sm font-medium">
            Assistant Name
          </label>
          <input
            id="assistant-name"
            className="w-full p-3 border rounded-md font-mono text-sm"
            value={assistantName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter assistant name"
          />
        </div>

        {/* Voice ID Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="voice-id" className="text-sm font-medium">
            Custom Voice ID
          </label>
          <input
            id="voice-id"
            className="w-full p-3 border rounded-md font-mono text-sm"
            value={currentVoiceId}
            onChange={(e) => setCurrentVoiceId(e.target.value)}
            placeholder="Paste voice ID here"
          />
        </div>

        {/* Prompt Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="custom-prompt" className="text-sm font-medium">
            Custom Assistant Prompt
          </label>
          <textarea
            id="custom-prompt"
            className="w-full p-3 border rounded-md font-mono text-sm resize-none"
            value={customPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            rows={4}
          />
        </div>

        <Button
          state="primary"
          size="medium"
          onClick={async () => {
            // Update the voice ID first
            if (currentVoiceId) {
              await onSelectVoice(currentVoiceId);
            }
            // Then apply the prompt changes
            applyPromptChanges();
          }}
        >
          Apply Changes
        </Button>
      </div>
    </motion.div>
  ), [customPrompt, handlePromptChange, applyPromptChanges, showPromptEditor, assistantName, handleNameChange, currentVoiceId, onSelectVoice]);
  const audioTileContent = useMemo(() => {
    const conversationToolbar = (
      <div className="fixed z-50 md:absolute left-1/2 bottom-4 md:bottom-auto md:top-1/2 -translate-y-1/2 -translate-x-1/2">
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 25 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Button
            state="destructive"
            className=""
            size="medium"
            onClick={() => onConnect(false)}
          >
            Disconnect
          </Button>
          <MicrophoneButton localMultibandVolume={localMultibandVolume} />
          <AudioOutputSelector />
          <Button
            state="secondary"
            size="medium"
            onClick={() => setShowPromptEditor(true)}
          >
            Edit Prompt
          </Button>
          <Button
            state="secondary"
            size="medium"
            style={{ backgroundColor: showVoices ? "rgba(0, 0, 0, 0.1)" : "" }}
            onClick={() => setShowVoices(!showVoices)}
          >
            <MenuSVG />
          </Button>
        </motion.div>
      </div>
    );

    
    const isLoading =
      roomState === ConnectionState.Connecting ||
      (!agentAudioTrack && roomState === ConnectionState.Connected);
    const startConversationButton = (
      <div className="fixed bottom-2 md:bottom-auto md:absolute left-1/2 md:top-1/2 -translate-y-1/2 -translate-x-1/2 w-11/12 md:w-auto text-center">
        <motion.div
          className="flex gap-3"
          initial={{
            opacity: 0,
            y: 50,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 50,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <Button
            state="primary"
            size="large"
            className="relative w-full text-sm md:text-base"
            onClick={() => {
              onConnect(roomState === ConnectionState.Disconnected);
            }}
          >
            <div
              className={`w-full ${isLoading ? "opacity-0" : "opacity-100"}`}
            >
              Start a conversation
            </div>
            <div
              className={`absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 ${
                isLoading ? "opacity-100" : "opacity-0"
              }`}
            >
              <LoadingSVG diameter={24} strokeWidth={4} />
            </div>
          </Button>
        </motion.div>
      </div>
    );
    const visualizerContent = (
      <div className="flex flex-col items-center justify-space-between h-full w-full pb-12">
        <div className="h-full flex">
          <AgentMultibandAudioVisualizer
            state={agentState}
            barWidth={isMobile ? mobileBarWidth : desktopBarWidth}
            minBarHeight={isMobile ? mobileMinBarHeight : desktopMinBarHeight}
            maxBarHeight={isMobile ? mobileMaxBarHeight : desktopMaxBarHeight}
            accentColor={!agentAudioTrack ? "gray" : "cartesia"}
            accentShade={!agentAudioTrack ? 200 : 500}
            frequencies={!agentAudioTrack ? defaultVolumes : subscribedVolumes}
            borderRadius={4}
            gap={16}
          />
        </div>
        <div className="min-h-20 w-full relative">
          <AnimatePresence>
            {!agentAudioTrack ? startConversationButton : null}
          </AnimatePresence>
          <AnimatePresence>
            {agentAudioTrack ? conversationToolbar : null}
          </AnimatePresence>
        </div>
      </div>
    );

    return visualizerContent;
  }, [
    localMultibandVolume,
    showVoices,
    roomState,
    agentAudioTrack,
    isMobile,
    subscribedVolumes,
    onConnect,
    agentState,
  ]);

  const voiceSelectionPanel = useMemo(() => {
    return (
      <div className="flex flex-col h-full w-full items-start">
        {isAgentConnected && voices && voices.length > 0 && (
          <div className="w-full text-black py-4 relative">
            <div className="sticky bg-white py-2 top-0 flex flex-row justify-between items-center px-4 text-xs uppercase tracking-wider">
              <h3 className="font-mono font-semibold text-sm">Voices</h3>
            </div>
            <div className="px-4 py-2 text-xs text-black leading-normal">
              <div className={"flex flex-col text-left h-full"}>
                {voices.map((voice) => (
                  <button
                    onClick={() => {
                      onSelectVoice(voice.id);
                    }}
                    className={`w-full text-left px-3 py-2 font-mono text-lg md:text-sm ${
                      voice.id === currentVoiceId
                        ? "bg-cartesia-500 text-white"
                        : "hover:bg-gray-100"
                    }`}
                    key={voice.id}
                  >
                    {voice.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [isAgentConnected, voices, currentVoiceId, onSelectVoice]);

  return (
    <>
      <Header
        title={title}
        logo={logo}
        height={headerHeight}
        onConnectClicked={() =>
          onConnect(roomState === ConnectionState.Disconnected)
        }
      />
      <div
        className={`flex grow w-full selection:bg-cyan-900 relative`}
        style={{ height: `calc(100% - ${headerHeight}px)` }}
      >
        <div className="flex-col grow basis-1/2 gap-4 h-full md:flex">
          <Tile
            title="ASSISTANT"
            className="w-full h-full grow"
            childrenClassName="justify-center"
          >
            {audioTileContent}
          </Tile>
        </div>
        <Tile
          padding={false}
          className={`h-full w-full basis-1/4 items-start overflow-y-auto hidden max-w-[480px] border-l-2 border-black ${
            showVoices ? "md:flex" : "md:hidden"
          }`}
          childrenClassName="h-full grow items-start"
        >
          {voiceSelectionPanel}
        </Tile>
        <div
          className={`bg-white/80 backdrop-blur-lg absolute w-full items-start transition-all duration-100 md:hidden ${
            showVoices ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ height: `calc(100% - ${headerHeight}px)` }}
        >
          <div className="overflow-y-scroll h-full w-full">
            <div className="pb-32">{voiceSelectionPanel}</div>
          </div>
          <div className="pointer-events-none absolute z-10 bottom-0 w-full h-64 bg-gradient-to-t from-white to-transparent"></div>
        </div>
        {promptEditorPanel}
      </div>
    </>
  );

}