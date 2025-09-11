// src/components/VoiceRecorder.tsx
import { useRef, useState } from "react";
import { IconButton } from "@chakra-ui/react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { generateSTT } from "./lib/gpt/speechToText";

interface VoiceRecorderProps {
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function VoiceRecorder({ setInputValue, setError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

  if (audioBlob.size < 5000) {
    console.warn("Audio quá ngắn, bỏ qua STT");
    return;
  }

  const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });

  try {
    const text = await generateSTT(file);
    setInputValue((prev) => prev + (prev ? " " : "") + text);
  } catch (err) {
    console.error("STT Error:", err);
    setError("Không thể chuyển giọng nói thành văn bản");
  }
};


      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Không thể truy cập micro");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <IconButton
      aria-label="Record voice"
      size="sm"
      borderRadius="full"
      onClick={isRecording ? stopRecording : startRecording}
      colorScheme={isRecording ? "red" : "gray"}
      variant="solid"
    >
      {isRecording ? <FaStop /> : <FaMicrophone />}
    </IconButton>
  );
}
