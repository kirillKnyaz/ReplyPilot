// OnboardingChat.tsx
import { useEffect, useState, useRef, useMemo } from "react";
import API from "../../api";

export default function OnboardingChat(){
  const [sessionId, setSessionId] = useState();
  const [messages, setMessages] = useState([]);
  const [currentQ, setCurrentQ] = useState({
    id: null, prompt: "Loading...", type: "text"
  });
  const [input, setInput] = useState("");
  
  const startedRef = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (startedRef.current) {
      console.log("Onboarding is already in progress");
      return;
    }   // StrictMode guard
    startedRef.current = true;
    (async () => {
      setBusy(true);
      try {
        const { data } = await API.post("/onboarding/start", {});
        setSessionId(data.sessionId);
        if (data.question) {
          setCurrentQ(data.question);
          setMessages([{ from: "bot", text: data.question.prompt }]);
        }
      } finally {
        setBusy(false);
        startedRef.current = false;
      }
    })();
  }, []);

  async function send() {
    if (!currentQ || !sessionId) {
      console.log("No current question or session ID");
      return;
    }
    if (!input.trim()) {
      console.log("Input is empty");    
      return;
    }

    const answer = parseAnswer(input, currentQ);
    setMessages(m => [...m, { from: "me", text: input }]);
    setInput("");

    setBusy(true);
    if (startedRef.current) {
      console.log("Onboarding step already in progress");
      return;
    }
    startedRef.current = true;
    try {
      const { data } = await API.post("/onboarding/answer", {
        sessionId, questionId: currentQ.id, answer
      });
      console.log("Received answer response:", data);
      setCurrentQ(data.question);
      setMessages(m => [...m, { from: "bot", text: data.question?.prompt || "..." }]);

      if (data.done || data.onBoardingComplete) {
        await API.post("/onboarding/complete", { sessionId });
        // Stream a short celebratory closing
        setCurrentQ(null);
        return;
      }
    } catch (error) {
      // Handle error
      console.error("Error occurred while sending message:", error);
    } finally {
      setBusy(false);
      startedRef.current = false;
    }
  }

  return (
    <div className="container p-3">
      <div className="border rounded p-3 mb-2 w-100" style={{height: 360, overflowY: "auto"}}>
        {messages.map((m,i) => (
          <div
            key={i}
            className={`d-flex mb-2 ${m.from==="me" ? "justify-content-end" : "justify-content-start"}`}
          >
            <div className={`message-bubble ${m.from}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {currentQ && (
        <div className="input-group">
          <input 
            className="form-control"
            value={input}
            onChange={e=>setInput(e.target.value)}
            placeholder="Type your answer..."
            onKeyDown={e => {
              if (e.key==="Enter") { 
                e.preventDefault(); 
                send(); 
              }
            }} />
          <button className="btn btn-primary" onClick={send}>Send</button>
          <button className="btn btn-outline-secondary" disabled={busy} onClick={async () => {
            if (!sessionId) return;
            setBusy(true);
            try {
              // Get previous step from server and use it directly (no /start)
              const { data } = await API.post("/onboarding/back", { sessionId });
              // data can be either the previous row (with .question field) or a seeded first step
              const q = data.question
                ? { id: data.step ?? data.id ?? data.step, prompt: data.question, type: data.type ?? "text" }
                : { id: data.step, prompt: data.question, type: "text" };
              setCurrentQ(q);
              setMessages([{ from: "bot", text: q.prompt }]);
            } finally {
              setBusy(false);
            }
          }}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}

function parseAnswer(input, q) {
  if (q.type==="number") return Number(input);
  if (q.type==="multiselect") return input.split(",").map(s=>s.trim()).filter(Boolean);
  return input;
}
