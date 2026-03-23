// Audio recorder hook — captures microphone audio as base64 for Google STT
// Uses MediaRecorder API (WebM/Opus) — works on Chrome, Edge, Safari, mobile

import { useState, useCallback, useRef, useEffect } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioBase64: string | null;
  duration: number; // seconds
  error: string | null;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Convert blob to base64 (strip data URL prefix)
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove "data:audio/webm;base64," prefix
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioBase64(null);
      setDuration(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Choose best available codec
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'; // Safari fallback

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const base64 = await blobToBase64(blob);
        setAudioBase64(base64);
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      recorder.onerror = () => {
        setError('Lỗi ghi âm. Hãy thử lại.');
        setIsRecording(false);
      };

      recorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Auto-stop after 30 seconds (Google STT limit: 60s sync)
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 30000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Chưa cấp quyền microphone. Hãy cho phép trong cài đặt trình duyệt.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('Không tìm thấy microphone. Hãy kiểm tra thiết bị.');
      } else {
        setError('Không thể khởi động ghi âm.');
      }
    }
  }, [blobToBase64]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setAudioBase64(null);
    setDuration(0);
    setError(null);
  }, []);

  return {
    isRecording,
    audioBlob,
    audioBase64,
    duration,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
