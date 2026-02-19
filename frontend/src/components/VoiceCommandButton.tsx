import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Waves } from "lucide-react";
import { toast } from "sonner"; // Using sonner for premium toast look

interface VoiceCommandButtonProps {
  onCommand: (command: string) => void;
}

const VoiceCommandButton = ({ onCommand }: VoiceCommandButtonProps) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      onCommand(transcript);
      setListening(false);
      toast.success(`Command Recognized: "${transcript}"`, {
        style: { background: "hsl(var(--primary))", color: "white" },
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [onCommand]);

  const toggle = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Voice Control Unavailability", {
        description:
          "Your browser does not support high-fidelity voice commands.",
      });
      return;
    }

    if (listening) {
      recognitionRef.current.abort();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
        toast.info("Voice Assistant Active", {
          description: "Try: 'Start Trip', 'Zoom In', 'Recenter'",
          duration: 3000,
        });
      } catch (e) {
        recognitionRef.current.abort();
        setListening(false);
      }
    }
  }, [listening]);

  return (
    <button
      onClick={toggle}
      className={`relative w-12 h-12 glass-panel rounded-2xl flex items-center justify-center transition-all duration-500 overflow-hidden ${
        listening
          ? "bg-primary text-primary-foreground scale-110 shadow-[0_0_20px_rgba(35,45,25,0.4)]"
          : "hover:bg-primary/5"
      }`}
    >
      {listening && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <Waves className="w-10 h-10 animate-[ping_2s_linear_infinite]" />
        </span>
      )}

      {listening ? (
        <Mic className="w-6 h-6 animate-pulse" />
      ) : (
        <MicOff className="w-6 h-6 text-primary" />
      )}
    </button>
  );
};

export default VoiceCommandButton;
