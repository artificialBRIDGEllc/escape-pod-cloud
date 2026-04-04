'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Copy, Check, Zap, Square, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

// ─── Particle Background ──────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Particle config
    const COUNT = 55;
    const CONNECT_DIST = 130;
    const MOUSE_DIST = 160;
    const MOUSE_REPEL = 0.018; // gentle push away from cursor
    const SPEED = 0.28;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number; opacity: number;
    }

    let particles: Particle[] = [];
    let W = 0, H = 0;
    let raf: number;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    const init = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: 0.8 + Math.random() * 1.4,
        opacity: 0.25 + Math.random() * 0.35,
      }));
    };
    init();

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current?.x ?? null;
      const my = mouseRef.current?.y ?? null;

      // Update + draw particles
      for (const p of particles) {
        // Mouse repel — gentle drift away
        if (mx !== null && my !== null) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_DIST && dist > 0) {
            const force = (1 - dist / MOUSE_DIST) * MOUSE_REPEL;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > SPEED * 3) {
          p.vx = (p.vx / speed) * SPEED * 3;
          p.vy = (p.vy / speed) * SPEED * 3;
        }

        // Drift back toward base speed
        p.vx *= 0.998;
        p.vy *= 0.998;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229,192,123,${p.opacity})`;
        ctx.fill();
      }

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const a = (1 - d / CONNECT_DIST) * 0.09;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(229,192,123,${a})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw lines from mouse to nearby particles
      if (mx !== null && my !== null) {
        for (const p of particles) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_DIST) {
            const a = (1 - d / MOUSE_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mx, my);
            ctx.strokeStyle = `rgba(229,192,123,${a})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        // Mouse dot
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(229,192,123,0.2)';
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => { mouseRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Minimal markdown renderer (no external deps) ────────────────────────────
function renderMarkdown(text: string): string {
  const parts = text.split(/(```[\w]*\n?[\s\S]*?```)/g);
  const processed = parts.map((part, i) => {
    if (i % 2 === 1) {
      const match = part.match(/```[\w]*\n?([\s\S]*?)```/);
      const code = match ? match[1] : part;
      return '<pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>';
    }
    return part
      .replace(/`([^`\n]+)`/g, (_m: string, c: string) => '<code>' + c + '</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^[•\-] (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/^(?!<[a-z/]|$)(.+)$/gm, '<p>$1</p>')
      .replace(/\n{3,}/g, '\n\n');
  });
  return processed.join('');
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, streaming }: { msg: Message; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copy = async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const bubbleStyle: React.CSSProperties = {
    background: isUser ? 'rgba(229,192,123,0.1)' : 'rgba(10,13,20,0.85)',
    border: isUser
      ? '1px solid rgba(229,192,123,0.22)'
      : '1px solid rgba(255,255,255,0.06)',
    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    padding: '12px 16px',
    color: '#F7F7F5',
    fontSize: '14px',
    lineHeight: '1.7',
    maxWidth: '80%',
    wordBreak: 'break-word' as const,
  };

  return (
    <div className={`flex gap-3 slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        background: isUser ? '#E5C07B' : 'rgba(10,13,20,0.9)',
        border: isUser ? 'none' : '1px solid rgba(229,192,123,0.2)',
        color: isUser ? '#030407' : '#E5C07B',
      }}>
        {isUser ? 'U' : 'AI'}
      </div>

      <div className="group flex flex-col" style={{ maxWidth: '80%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={bubbleStyle}>
          {msg.error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', marginBottom: 8, fontSize: 12 }}>
              <AlertTriangle size={12} />
              <span>Error — check API key in environment variables</span>
            </div>
          )}
          {msg.role === 'assistant' ? (
            <div className="msg-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          )}
          {streaming && (
            <span className="blink" style={{
              display: 'inline-block', width: 7, height: 14,
              background: '#E5C07B', borderRadius: 1, marginLeft: 2, verticalAlign: 'middle',
            }} />
          )}
        </div>
        {!streaming && msg.content && (
          <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1"
            style={{ fontSize: 11, color: 'rgba(247,247,245,0.35)', cursor: 'pointer' }}>
            {copied ? <Check size={10} /> : <Copy size={10} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'AI Escape Pod';
  const modelLabel = process.env.NEXT_PUBLIC_MODEL_DISPLAY || 'grok-3';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const aid = `a-${Date.now() + 1}`;
    setMessages(prev => [...prev, { id: aid, role: 'assistant', content: '' }]);
    setStreamingId(aid);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = dec.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.text) {
                acc += d.text;
                setMessages(prev =>
                  prev.map(m => (m.id === aid ? { ...m, content: acc } : m))
                );
              }
            } catch {}
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev =>
        prev.map(m =>
          m.id === aid ? { ...m, content: `Failed to connect: ${msg}`, error: true } : m
        )
      );
    } finally {
      setLoading(false);
      setStreamingId(null);
    }
  }, [input, loading, messages]);

  const stop = () => {
    abortRef.current?.abort();
    setLoading(false);
    setStreamingId(null);
  };

  const clear = () => {
    stop();
    setMessages([]);
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  };

  return (
    <div className="grid-bg flex flex-col" style={{ height: '100dvh', background: '#030407', position: 'relative' }}>

      {/* ── PARTICLE BACKGROUND ── */}
      <ParticleField />

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 10,
        flexShrink: 0, padding: '14px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,13,20,0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(229,192,123,0.08)',
            border: '1px solid rgba(229,192,123,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} style={{ color: '#E5C07B' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F7F7F5', letterSpacing: '-0.01em' }}>
                <span style={{ fontWeight: 400 }}>artificial</span>
                <span style={{ color: '#E5C07B' }}>BRIDGE</span>
              </span>
              <span style={{
                fontSize: 11, padding: '1px 8px', borderRadius: 999,
                background: 'rgba(229,192,123,0.07)',
                border: '1px solid rgba(229,192,123,0.14)',
                color: 'rgba(229,192,123,0.65)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {modelLabel}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(247,247,245,0.35)', marginTop: 1 }}>
              Private · No tracking · Always on
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button onClick={clear} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'rgba(247,247,245,0.4)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
          }}>
            <Trash2 size={11} />
            Clear
          </button>
        )}
      </header>

      {/* Messages */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              paddingTop: 80, textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(229,192,123,0.06)',
                border: '1px solid rgba(229,192,123,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Zap size={24} style={{ color: '#E5C07B' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: '#E5C07B', marginBottom: 10 }}>
                {appName}
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(247,247,245,0.45)', maxWidth: 360, lineHeight: 1.7 }}>
                Your private AI. No rate limits, no xAI branding, no tracking.
                <br />Start a conversation.
              </p>
            </div>
          )}

          {messages.map(msg => (
            <Bubble key={msg.id} msg={msg} streaming={streamingId === msg.id} />
          ))}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <footer style={{
        position: 'relative', zIndex: 10,
        flexShrink: 0, padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,13,20,0.88)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10,
            background: 'rgba(10,13,20,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '10px 12px 10px 16px',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onInput}
              onKeyDown={onKeyDown}
              placeholder="Message your AI..."
              rows={1}
              disabled={loading}
              style={{
                flex: 1, resize: 'none', background: 'transparent',
                border: 'none', outline: 'none', color: '#F7F7F5',
                fontSize: 14, lineHeight: '1.6',
                fontFamily: 'Inter, sans-serif', maxHeight: 140,
              }}
              autoFocus
            />
            <button
              onClick={loading ? stop : send}
              disabled={!loading && !input.trim()}
              style={{
                flexShrink: 0, width: 34, height: 34, borderRadius: 10,
                background: loading || input.trim() ? '#E5C07B' : 'rgba(229,192,123,0.12)',
                border: 'none',
                cursor: !loading && !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {loading
                ? <Square size={13} style={{ color: '#030407' }} />
                : <Send size={13} style={{ color: loading || input.trim() ? '#030407' : '#E5C07B' }} />
              }
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(247,247,245,0.2)', marginTop: 8 }}>
            Enter to send · Shift+Enter for new line · Click ■ to stop
          </p>
        </div>
      </footer>
    </div>
  );
}
