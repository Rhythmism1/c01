import asyncio
import json
import os
import requests

from typing import List, Any, AsyncIterable

from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, JobProcess
from livekit.agents.llm import (
    ChatContext,
    ChatMessage,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.agents.log import logger
from livekit.plugins import deepgram, silero, cartesia, openai

from dotenv import load_dotenv

load_dotenv()

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

    headers = {
        "X-API-Key": os.getenv("CARTESIA_API_KEY", ""),
        "Cartesia-Version": "2024-08-01",
        "Content-Type": "application/json",
    }
    response = requests.get("https://api.cartesia.ai/voices", headers=headers)
    if response.status_code == 200:
        proc.userdata["cartesia_voices"] = response.json()
    else:
        logger.warning(f"Failed to fetch Cartesia voices: {response.status_code}")

async def entrypoint(ctx: JobContext):
    prefix_prompt = "You are an employee. Your name is {assistant_name}. You should ONLY talk when referred to directly with your name. otherwise, you are to say the word 'silent' and nothing else."
    suffix_prompt = " Keep your responses natural and conversational. Speak as if you're having a casual conversation. Never mention that you're an AI or that you're following rules or prompts."

    default_name = "Assistant"
    default_prompt = "You are a voice assistant created by LiveKit. Your interface with users will be voice. Pretend we're having a conversation, no special formatting or headings, just natural speech."
    wrapped_default_prompt = prefix_prompt.format(assistant_name=default_name) + default_prompt + suffix_prompt
    
    initial_ctx = ChatContext(
        messages=[
            ChatMessage(
                role="system",
                content=wrapped_default_prompt
            )
        ]
    )
    cartesia_voices: List[dict[str, Any]] = ctx.proc.userdata["cartesia_voices"]

    tts = cartesia.TTS(
        voice="248be419-c632-4f23-adf1-5324ed7dbf1d",
    )

    async def before_tts(assistant: VoicePipelineAgent, text: str | AsyncIterable[str]) -> str | AsyncIterable[str]:
        logger.debug(f"before_tts called with text type: {type(text)}")
        
        if isinstance(text, str):
            logger.debug(f"Processing string text: '{text}'")
            if 'silent' in text.lower():
                return ""
            return text
        else:
            # Handle async generator
            async def process_stream():
                try:
                    async for chunk in text:
                        logger.debug(f"Processing chunk: '{chunk}'")
                        if isinstance(chunk, str) and 'silent' in chunk.lower():
                            logger.debug("Silent detected in chunk, yielding empty string")
                            yield ""
                        else:
                            yield chunk
                except Exception as e:
                    logger.error(f"Error processing stream: {e}")
                    raise
            
            return process_stream()

    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=tts,
        chat_ctx=initial_ctx,
        before_tts_cb=before_tts
    )

    is_user_speaking = False
    is_agent_speaking = False

    @ctx.room.on("participant_attributes_changed")
    def on_participant_attributes_changed(
        changed_attributes: dict[str, str], participant: rtc.Participant
    ):
        nonlocal agent
        
        if participant.kind != rtc.ParticipantKind.PARTICIPANT_KIND_STANDARD:
            return

        current_name = participant.attributes.get("assistant_name", default_name)
        current_prompt = participant.attributes.get("custom_prompt", default_prompt)

        if "assistant_name" in changed_attributes or "custom_prompt" in changed_attributes:
            logger.info(f"Updating assistant configuration for participant {participant.identity}")
            
            wrapped_prompt = prefix_prompt.format(assistant_name=current_name) + current_prompt + suffix_prompt
            
            agent.chat_ctx.messages[0] = ChatMessage(
                role="system",
                content=wrapped_prompt
            )
            
            if not (is_agent_speaking or is_user_speaking):
                if "assistant_name" in changed_attributes:
                    asyncio.create_task(
                        agent.say(f"I'll now respond as {current_name}. How can I help you?", allow_interruptions=True)
                    )
                else:
                    asyncio.create_task(
                        agent.say("My prompt has been updated. How can I assist you?", allow_interruptions=True)
                    )

        if "voice" in changed_attributes:
            voice_id = participant.attributes.get("voice")
            if not voice_id:
                return
                
            voice_data = next(
                (voice for voice in cartesia_voices if voice["id"] == voice_id), None
            )
            if not voice_data:
                logger.warning(f"Voice {voice_id} not found")
                return
                
            if "embedding" in voice_data:
                model = "sonic-english"
                language = "en"
                if "language" in voice_data and voice_data["language"] != "en":
                    language = voice_data["language"]
                    model = "sonic-multilingual"
                tts._opts.voice = voice_data["embedding"]
                tts._opts.model = model
                tts._opts.language = language
                
                if not (is_agent_speaking or is_user_speaking):
                    asyncio.create_task(
                        agent.say("How do I sound now?", allow_interruptions=True)
                    )

    @agent.on("agent_started_speaking")
    def agent_started_speaking():
        nonlocal is_agent_speaking
        is_agent_speaking = True

    @agent.on("agent_stopped_speaking")
    def agent_stopped_speaking():
        nonlocal is_agent_speaking
        is_agent_speaking = False

    @agent.on("user_started_speaking")
    def user_started_speaking():
        nonlocal is_user_speaking
        is_user_speaking = True

    @agent.on("user_stopped_speaking")
    def user_stopped_speaking():
        nonlocal is_user_speaking
        is_user_speaking = False

    await ctx.connect()

    voices = []
    for voice in cartesia_voices:
        voices.append({
            "id": voice["id"],
            "name": voice["name"],
        })
    voices.sort(key=lambda x: x["name"])
    await ctx.room.local_participant.set_attributes({"voices": json.dumps(voices)})

    agent.start(ctx.room)
    await agent.say("Hi there, I am ready to join the zoom call and will remain silent until I am referred to.", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))