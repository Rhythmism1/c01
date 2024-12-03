import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface HTMLAudioElement {
    setSinkId(sinkId: string): Promise<void>;
  }
}

const AudioOutputSelector = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [error, setError] = useState<string>('');
  const audioElement = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element on client side only
    audioElement.current = new Audio();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!navigator.mediaDevices?.enumerateDevices) {
      setError('Your browser does not support audio output selection');
      return;
    }

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
        setError('Error accessing audio devices: ' + (err as Error).message);
      }
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(getDevices)
      .catch(err => setError('Permission to access audio devices was denied'));

    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  const handleDeviceChange = async (deviceId: string) => {
    try {
      if (audioElement.current && 'setSinkId' in audioElement.current) {
        await audioElement.current.setSinkId(deviceId);
        setSelectedDevice(deviceId);
      } else {
        setError('Your browser does not support audio output selection');
      }
    } catch (err) {
      setError('Error switching audio output: ' + (err as Error).message);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="audioOutput" className="block text-sm font-medium">
          Select Audio Output
        </label>
        <select
          id="audioOutput"
          value={selectedDevice}
          onChange={(e) => handleDeviceChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          disabled={!devices.length}
        >
          {devices.length === 0 && (
            <option value="">No audio outputs found</option>
          )}
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Speaker ${device.deviceId.slice(0, 4)}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AudioOutputSelector;