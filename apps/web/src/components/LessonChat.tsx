import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ai as aiApi } from "@/lib/api";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export function LessonChat({
  lessonId,
  moduleId,
  contextLabel,
}: {
  lessonId?: string;
  moduleId?: string;
  contextLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pop-up her açılışta yeni konuşma — system prompt backend'de uygulanır
  useEffect(() => {
    if (open) {
      setMessages([
        {
          role: "assistant",
          content: contextLabel
            ? `Merhaba! "${contextLabel}" konusunda sana yardımcı olabilirim. Anlamadığın bir yer var mı?`
            : "Merhaba! Bu derste sana yardımcı olabilirim. Sorularını sor.",
        },
      ]);
    }
  }, [open, lessonId, moduleId, contextLabel]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const newMsgs: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setSending(true);
    try {
      const res = await aiApi.chat({
        lessonId,
        moduleId,
        messages: newMsgs.filter((m) => m.role !== "assistant" || messages.indexOf(m) !== 0)
          .map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: any) {
      toast.error(err.message);
      setMessages((prev) => [...prev, { role: "assistant", content: "Bir hata oldu. Tekrar dene." }]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105"
        aria-label="AI sohbet"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(420px,calc(100vw-3rem))] h-[min(560px,calc(100vh-8rem))] bg-white dark:bg-zinc-900 border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-violet-600 to-violet-500 text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">AI Asistan</div>
              {contextLabel && <div className="text-xs text-white/80 truncate">{contextLabel}</div>}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-background border rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-background border rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Düşünüyor…
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t flex gap-2 bg-background">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Sorunu yaz..."
              disabled={sending}
            />
            <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="bg-violet-600 hover:bg-violet-700 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
