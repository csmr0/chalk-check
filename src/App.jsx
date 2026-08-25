import React, { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Chalkboard token system                                            */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#16231C",
  bgAlt: "#1C2B22",
  panel: "#213228",
  panel2: "#28402F",
  rail: "#33503C",
  chalk: "#F3F0E6",
  chalkDim: "#AFC0B3",
  gold: "#F2C14E",
  sky: "#5CA9D6",
  coral: "#E8654E",
  violet: "#9B80D6",
  mint: "#5FBE8B",
};

const OPTIONS_STYLE = [
  { color: C.sky, shape: "triangle" },
  { color: C.gold, shape: "diamond" },
  { color: C.coral, shape: "circle" },
  { color: C.violet, shape: "square" },
];

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`;

/* ------------------------------------------------------------------ */
/*  Shape glyphs (color + shape double-encoding, like a chalk sketch)  */
/* ------------------------------------------------------------------ */
function Shape({ shape, color, size = 22 }) {
  const s = size;
  const common = { width: s, height: s, display: "block" };
  if (shape === "triangle")
    return (
      <svg style={common} viewBox="0 0 24 24">
        <polygon points="12,3 21,20 3,20" fill={color} />
      </svg>
    );
  if (shape === "diamond")
    return (
      <svg style={common} viewBox="0 0 24 24">
        <polygon points="12,2 22,12 12,22 2,12" fill={color} />
      </svg>
    );
  if (shape === "circle")
    return (
      <svg style={common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill={color} />
      </svg>
    );
  return (
    <svg style={common} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Storage: Firestore-backed (see src/firebase.js)                    */
/* ------------------------------------------------------------------ */
import { storeGet, storeSet, storeList } from "./firebase.js";

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function useInterval(callback, delay) {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => ref.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/* ------------------------------------------------------------------ */
/*  Shared visual primitives                                           */
/* ------------------------------------------------------------------ */
function Shell({ children, wide }) {
  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        background: `radial-gradient(circle at 15% 10%, ${C.bgAlt} 0%, ${C.bg} 55%)`,
        fontFamily: "'Inter', sans-serif",
        color: C.chalk,
        padding: "clamp(16px, 4vw, 40px)",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{FONT_IMPORT}</style>
      <div style={{ width: "100%", maxWidth: wide ? 960 : 480 }}>{children}</div>
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: C.gold,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Display({ children, size = 30 }) {
  return (
    <h1
      style={{
        fontFamily: "'Fredoka', sans-serif",
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.15,
        margin: 0,
        color: C.chalk,
      }}
    >
      {children}
    </h1>
  );
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.rail}`,
        borderRadius: 18,
        padding: "clamp(16px,4vw,28px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", disabled, style, type = "button" }) {
  const base = {
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    fontSize: 16,
    borderRadius: 12,
    padding: "13px 22px",
    border: "none",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "transform 0.12s ease, filter 0.12s ease",
  };
  const variants = {
    primary: { background: C.gold, color: "#20250F" },
    ghost: { background: "transparent", color: C.chalk, border: `1px solid ${C.rail}` },
    success: { background: C.mint, color: "#0F2418" },
    danger: { background: "transparent", color: C.coral, border: `1px solid ${C.coral}` },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: C.bgAlt,
        border: `1px solid ${C.rail}`,
        borderRadius: 10,
        padding: "12px 14px",
        color: C.chalk,
        fontFamily: "'Inter', sans-serif",
        fontSize: 15,
        outline: "none",
        ...props.style,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Landing                                                             */
/* ------------------------------------------------------------------ */
function Landing({ onHost, onJoin }) {
  return (
    <Shell>
      <div style={{ textAlign: "center", marginBottom: 34, marginTop: "8vh" }}>
        <Eyebrow>Live classroom response system</Eyebrow>
        <Display size={40}>Chalk&nbsp;Check</Display>
        <p style={{ color: C.chalkDim, marginTop: 10, fontSize: 15 }}>
          Run a quiz or a quick poll. One code, every device in the room.
        </p>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        <Panel style={{ cursor: "pointer" }}>
          <button
            onClick={onHost}
            style={{
              all: "unset",
              display: "block",
              width: "100%",
              cursor: "pointer",
            }}
          >
            <Eyebrow>For teachers</Eyebrow>
            <Display size={22}>Host a session</Display>
            <p style={{ color: C.chalkDim, fontSize: 14, marginTop: 6 }}>
              Build questions, get a join code, run it from the front of the room.
            </p>
          </button>
        </Panel>
        <Panel style={{ cursor: "pointer" }}>
          <button
            onClick={onJoin}
            style={{
              all: "unset",
              display: "block",
              width: "100%",
              cursor: "pointer",
            }}
          >
            <Eyebrow>For students</Eyebrow>
            <Display size={22}>Join with a code</Display>
            <p style={{ color: C.chalkDim, fontSize: 14, marginTop: 6 }}>
              Enter the code on the board and answer from your own phone.
            </p>
          </button>
        </Panel>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  Host: build session                                                 */
/* ------------------------------------------------------------------ */
function HostSetup({ onCreate, onBack }) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [draft, setDraft] = useState(blankDraft());

  function blankDraft() {
    return { type: "quiz", text: "", options: ["", "", "", ""], correctIndex: 0 };
  }

  function addQuestion() {
    const opts = draft.options.map((o) => o.trim()).filter(Boolean);
    if (!draft.text.trim() || opts.length < 2) return;
    setQuestions((qs) => [
      ...qs,
      {
        id: genId(),
        type: draft.type,
        text: draft.text.trim(),
        options: opts,
        correctIndex: draft.type === "quiz" ? Math.min(draft.correctIndex, opts.length - 1) : null,
      },
    ]);
    setDraft(blankDraft());
  }

  function removeQuestion(id) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  return (
    <Shell wide>
      <button onClick={onBack} style={{ all: "unset", color: C.chalkDim, cursor: "pointer", fontSize: 13, marginBottom: 14 }}>
        ← Back
      </button>
      <Eyebrow>New session</Eyebrow>
      <Display size={28}>Build your set</Display>

      <div style={{ marginTop: 18 }}>
        <TextInput placeholder="Session title (e.g. Chapter 4 Review)" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 24, gridTemplateColumns: "1fr", }} >
        {questions.map((q, i) => (
          <Panel key={q.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <Eyebrow>{q.type === "quiz" ? `Question ${i + 1} · Quiz` : `Question ${i + 1} · Poll`}</Eyebrow>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 17 }}>{q.text}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {q.options.map((o, oi) => (
                    <span
                      key={oi}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: q.type === "quiz" && oi === q.correctIndex ? C.mint : C.chalkDim,
                        border: `1px solid ${C.rail}`,
                        borderRadius: 8,
                        padding: "4px 9px",
                      }}
                    >
                      <Shape shape={OPTIONS_STYLE[oi].shape} color={OPTIONS_STYLE[oi].color} size={12} />
                      {o}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => removeQuestion(q.id)} style={{ all: "unset", cursor: "pointer", color: C.coral, fontSize: 13 }}>
                Remove
              </button>
            </div>
          </Panel>
        ))}
      </div>

      <Panel style={{ marginTop: 20 }}>
        <Eyebrow>Add a question</Eyebrow>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Button variant={draft.type === "quiz" ? "primary" : "ghost"} onClick={() => setDraft((d) => ({ ...d, type: "quiz" }))}>
            Quiz (has a correct answer)
          </Button>
          <Button variant={draft.type === "poll" ? "primary" : "ghost"} onClick={() => setDraft((d) => ({ ...d, type: "poll" }))}>
            Poll (opinion only)
          </Button>
        </div>
        <TextInput
          placeholder="Question text"
          value={draft.text}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          style={{ marginBottom: 12 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {draft.options.map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shape shape={OPTIONS_STYLE[i].shape} color={OPTIONS_STYLE[i].color} size={18} />
              <TextInput
                placeholder={`Option ${i + 1}${i < 2 ? "" : " (optional)"}`}
                value={opt}
                onChange={(e) => {
                  const next = [...draft.options];
                  next[i] = e.target.value;
                  setDraft((d) => ({ ...d, options: next }));
                }}
              />
              {draft.type === "quiz" && (
                <button
                  onClick={() => setDraft((d) => ({ ...d, correctIndex: i }))}
                  title="Mark correct"
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: `2px solid ${draft.correctIndex === i ? C.mint : C.rail}`,
                    background: draft.correctIndex === i ? C.mint : "transparent",
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <Button onClick={addQuestion}>Add question</Button>
        </div>
      </Panel>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="success"
          disabled={questions.length === 0}
          onClick={() => onCreate(title.trim() || "Untitled session", questions)}
        >
          Create session · {questions.length} question{questions.length === 1 ? "" : "s"}
        </Button>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  Host: live session control                                          */
/* ------------------------------------------------------------------ */
function HostLive({ code, onExit }) {
  const [session, setSession] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [players, setPlayers] = useState([]);
  const [tally, setTally] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const raw = await storeGet(`session:${code}`, true);
    if (!raw) return;
    const s = JSON.parse(raw);
    setSession(s);

    const playerKeys = await storeList(`player:${code}:`, true);
    setPlayerCount(playerKeys.length);

    if (s.state === "final") {
      const vals = await Promise.all(playerKeys.map((k) => storeGet(k, true)));
      const list = vals.filter(Boolean).map((v) => JSON.parse(v));
      list.sort((a, b) => b.score - a.score);
      setPlayers(list);
    }

    if ((s.state === "question" || s.state === "reveal") && s.currentIndex >= 0) {
      const q = s.questions[s.currentIndex];
      const ansKeys = await storeList(`answer:${code}:${s.currentIndex}:`, true);
      setAnsweredCount(ansKeys.length);
      const vals = await Promise.all(ansKeys.map((k) => storeGet(k, true)));
      const counts = new Array(q.options.length).fill(0);
      vals.filter(Boolean).forEach((v) => {
        const a = JSON.parse(v);
        if (a.optionIndex >= 0 && a.optionIndex < counts.length) counts[a.optionIndex]++;
      });
      setTally(counts);
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useInterval(refresh, 1500);

  async function updateSession(patch) {
    const next = { ...session, ...patch };
    setSession(next);
    await storeSet(`session:${code}`, JSON.stringify(next), true);
  }

  function startSession() {
    updateSession({ currentIndex: 0, state: "question" });
  }
  function revealResults() {
    updateSession({ state: "reveal" });
  }
  function nextQuestion() {
    if (!session) return;
    const nextIdx = session.currentIndex + 1;
    if (nextIdx < session.questions.length) {
      updateSession({ currentIndex: nextIdx, state: "question" });
    } else {
      updateSession({ state: "final" });
    }
  }

  if (loading || !session) {
    return (
      <Shell>
        <div style={{ textAlign: "center", marginTop: "30vh", color: C.chalkDim }}>Setting up session…</div>
      </Shell>
    );
  }

  const q = session.currentIndex >= 0 ? session.questions[session.currentIndex] : null;

  return (
    <Shell wide>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Eyebrow>{session.title}</Eyebrow>
          <Display size={22}>
            {session.state === "lobby" && "Waiting room"}
            {session.state === "question" && `Question ${session.currentIndex + 1} of ${session.questions.length}`}
            {session.state === "reveal" && `Results · Question ${session.currentIndex + 1}`}
            {session.state === "final" && "Final leaderboard"}
          </Display>
        </div>
        <Button variant="danger" onClick={onExit}>
          End
        </Button>
      </div>

      {session.state === "lobby" && (
        <Panel style={{ textAlign: "center", padding: "clamp(24px,6vw,48px)" }}>
          <Eyebrow>Join code</Eyebrow>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "clamp(48px, 12vw, 84px)",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: C.gold,
              textShadow: `0 0 40px ${C.gold}55`,
              margin: "10px 0",
            }}
          >
            {code}
          </div>
          <p style={{ color: C.chalkDim }}>Students open this artifact and tap "Join with a code."</p>
          <div style={{ marginTop: 18, fontSize: 15 }}>
            {playerCount} student{playerCount === 1 ? "" : "s"} joined
          </div>
          <div style={{ marginTop: 24 }}>
            <Button variant="success" disabled={playerCount === 0} onClick={startSession}>
              Start session
            </Button>
          </div>
        </Panel>
      )}

      {session.state === "question" && q && (
        <Panel>
          <Eyebrow>{q.type === "quiz" ? "Quiz question" : "Poll"}</Eyebrow>
          <Display size={26}>{q.text}</Display>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22 }}>
            {q.options.map((opt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: C.panel2,
                  border: `1px solid ${C.rail}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                <Shape shape={OPTIONS_STYLE[i].shape} color={OPTIONS_STYLE[i].color} />
                <span style={{ fontSize: 15 }}>{opt}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, color: C.chalkDim, fontSize: 14 }}>
            {answeredCount} of {playerCount} answered
          </div>
          <div style={{ marginTop: 16 }}>
            <Button onClick={revealResults}>Reveal results</Button>
          </div>
        </Panel>
      )}

      {session.state === "reveal" && q && (
        <Panel>
          <Eyebrow>{q.type === "quiz" ? "Quiz question" : "Poll"}</Eyebrow>
          <Display size={24}>{q.text}</Display>
          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            {q.options.map((opt, i) => {
              const total = tally.reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round(((tally[i] || 0) / total) * 100);
              const isCorrect = q.type === "quiz" && i === q.correctIndex;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 5 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Shape shape={OPTIONS_STYLE[i].shape} color={OPTIONS_STYLE[i].color} size={16} />
                      {opt} {isCorrect && <span style={{ color: C.mint }}>✓ correct</span>}
                    </span>
                    <span style={{ color: C.chalkDim }}>
                      {tally[i] || 0} · {pct}%
                    </span>
                  </div>
                  <div style={{ background: C.bgAlt, borderRadius: 8, height: 14, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: isCorrect ? C.mint : OPTIONS_STYLE[i].color,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 22 }}>
            <Button variant="success" onClick={nextQuestion}>
              {session.currentIndex + 1 < session.questions.length ? "Next question" : "Show leaderboard"}
            </Button>
          </div>
        </Panel>
      )}

      {session.state === "final" && (
        <Panel>
          <Eyebrow>Final standings</Eyebrow>
          {players.length === 0 && <p style={{ color: C.chalkDim }}>No scored answers yet.</p>}
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {players.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: i === 0 ? C.panel2 : "transparent",
                  border: `1px solid ${i === 0 ? C.gold : C.rail}`,
                  borderRadius: 10,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", color: C.chalkDim }}>#{i + 1}</span>
                  {p.name}
                </span>
                <span style={{ fontFamily: "'Fredoka', sans-serif", color: C.gold }}>{p.score}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  Student: join                                                       */
/* ------------------------------------------------------------------ */
function StudentJoin({ onJoined, onBack }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    const c = code.trim().toUpperCase();
    if (!c || !name.trim()) {
      setError("Enter both a code and your name.");
      return;
    }
    setBusy(true);
    const raw = await storeGet(`session:${c}`, true);
    if (!raw) {
      setError("No session found with that code.");
      setBusy(false);
      return;
    }
    const playerId = genId();
    await storeSet(`player:${c}:${playerId}`, JSON.stringify({ name: name.trim(), score: 0 }), true);
    setBusy(false);
    onJoined(c, playerId, name.trim());
  }

  return (
    <Shell>
      <button onClick={onBack} style={{ all: "unset", color: C.chalkDim, cursor: "pointer", fontSize: 13, marginBottom: 14 }}>
        ← Back
      </button>
      <Eyebrow>Join a session</Eyebrow>
      <Display size={26}>Enter the code</Display>
      <Panel style={{ marginTop: 20 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <TextInput
            placeholder="CODE"
            value={code}
            maxLength={5}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, textAlign: "center", letterSpacing: "0.15em" }}
          />
          <TextInput placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          {error && <div style={{ color: C.coral, fontSize: 13 }}>{error}</div>}
          <Button onClick={submit} disabled={busy}>
            {busy ? "Joining…" : "Join session"}
          </Button>
        </div>
      </Panel>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  Student: live                                                       */
/* ------------------------------------------------------------------ */
function StudentLive({ code, playerId, name, onExit }) {
  const [session, setSession] = useState(null);
  const [score, setScore] = useState(0);
  const [answeredIndex, setAnsweredIndex] = useState(null);
  const [lastCorrect, setLastCorrect] = useState(null);
  const [rank, setRank] = useState(null);

  const seenQuestionRef = useRef(-1);

  const refresh = useCallback(async () => {
    const raw = await storeGet(`session:${code}`, true);
    if (!raw) return;
    const s = JSON.parse(raw);
    setSession(s);

    if (s.currentIndex !== seenQuestionRef.current) {
      seenQuestionRef.current = s.currentIndex;
      setAnsweredIndex(null);
      setLastCorrect(null);
    }

    const pRaw = await storeGet(`player:${code}:${playerId}`, true);
    if (pRaw) setScore(JSON.parse(pRaw).score);

    if (s.state === "question" && s.currentIndex >= 0) {
      const aRaw = await storeGet(`answer:${code}:${s.currentIndex}:${playerId}`, true);
      if (aRaw) setAnsweredIndex(JSON.parse(aRaw).optionIndex);
    }

    if (s.state === "final") {
      const keys = await storeList(`player:${code}:`, true);
      const vals = await Promise.all(keys.map((k) => storeGet(k, true)));
      const list = vals.filter(Boolean).map((v) => JSON.parse(v));
      list.sort((a, b) => b.score - a.score);
      const idx = list.findIndex((p) => p.name === name);
      setRank({ position: idx + 1, total: list.length, list });
    }
  }, [code, playerId, name]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useInterval(refresh, 1500);

  async function submitAnswer(i) {
    if (!session || answeredIndex !== null) return;
    const q = session.questions[session.currentIndex];
    const correct = q.type === "quiz" ? i === q.correctIndex : null;
    setAnsweredIndex(i);
    setLastCorrect(correct);
    await storeSet(
      `answer:${code}:${session.currentIndex}:${playerId}`,
      JSON.stringify({ optionIndex: i, correct, ts: Date.now() }),
      true
    );
    if (correct) {
      const pRaw = await storeGet(`player:${code}:${playerId}`, true);
      const p = pRaw ? JSON.parse(pRaw) : { name, score: 0 };
      const nextScore = p.score + 1000;
      setScore(nextScore);
      await storeSet(`player:${code}:${playerId}`, JSON.stringify({ name, score: nextScore }), true);
    }
  }

  if (!session) {
    return (
      <Shell>
        <div style={{ textAlign: "center", marginTop: "30vh", color: C.chalkDim }}>Connecting…</div>
      </Shell>
    );
  }

  const q = session.currentIndex >= 0 ? session.questions[session.currentIndex] : null;

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Eyebrow>{name} · {code}</Eyebrow>
        <div style={{ fontFamily: "'Fredoka', sans-serif", color: C.gold }}>{score} pts</div>
      </div>

      {session.state === "lobby" && (
        <Panel style={{ textAlign: "center", padding: "40px 20px" }}>
          <Display size={22}>You're in!</Display>
          <p style={{ color: C.chalkDim, marginTop: 8 }}>Waiting for the teacher to start…</p>
        </Panel>
      )}

      {session.state === "question" && q && answeredIndex === null && (
        <Panel>
          <Eyebrow>{q.type === "quiz" ? "Quiz" : "Poll"}</Eyebrow>
          <Display size={22}>{q.text}</Display>
          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => submitAnswer(i)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: C.panel2,
                  border: `1px solid ${C.rail}`,
                  borderRadius: 12,
                  padding: "16px",
                  fontSize: 15,
                }}
              >
                <Shape shape={OPTIONS_STYLE[i].shape} color={OPTIONS_STYLE[i].color} />
                {opt}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {session.state === "question" && answeredIndex !== null && (
        <Panel style={{ textAlign: "center", padding: "40px 20px" }}>
          <Shape shape={OPTIONS_STYLE[answeredIndex].shape} color={OPTIONS_STYLE[answeredIndex].color} size={40} />
          <Display size={20}>Answer locked in</Display>
          <p style={{ color: C.chalkDim, marginTop: 8 }}>Waiting for results…</p>
        </Panel>
      )}

      {session.state === "reveal" && q && (
        <Panel style={{ textAlign: "center", padding: "36px 20px" }}>
          {q.type === "quiz" ? (
            lastCorrect === true ? (
              <>
                <Display size={26}>Correct! +1000</Display>
                <p style={{ color: C.mint, marginTop: 8 }}>Nicely done.</p>
              </>
            ) : lastCorrect === false ? (
              <>
                <Display size={26}>Not quite</Display>
                <p style={{ color: C.chalkDim, marginTop: 8 }}>
                  Correct answer: <strong style={{ color: C.mint }}>{q.options[q.correctIndex]}</strong>
                </p>
              </>
            ) : (
              <p style={{ color: C.chalkDim }}>You didn't answer this one.</p>
            )
          ) : (
            <>
              <Display size={22}>Thanks for weighing in</Display>
              <p style={{ color: C.chalkDim, marginTop: 8 }}>The results are up on the board.</p>
            </>
          )}
        </Panel>
      )}

      {session.state === "final" && (
        <Panel style={{ textAlign: "center", padding: "36px 20px" }}>
          <Eyebrow>Session complete</Eyebrow>
          <Display size={30}>{score} points</Display>
          {rank && (
            <p style={{ color: C.chalkDim, marginTop: 10 }}>
              You placed #{rank.position} of {rank.total}
            </p>
          )}
          <div style={{ marginTop: 20 }}>
            <Button variant="ghost" onClick={onExit}>
              Leave session
            </Button>
          </div>
        </Panel>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  Root                                                                 */
/* ------------------------------------------------------------------ */
export default function ClassroomQuizApp() {
  const [screen, setScreen] = useState("landing");
  const [code, setCode] = useState(null);
  const [player, setPlayer] = useState(null);

  async function createSession(title, questions) {
    const newCode = genCode();
    const session = { title, questions, currentIndex: -1, state: "lobby", createdAt: Date.now() };
    await storeSet(`session:${newCode}`, JSON.stringify(session), true);
    setCode(newCode);
    setScreen("hostLive");
  }

  function joined(c, playerId, name) {
    setCode(c);
    setPlayer({ playerId, name });
    setScreen("studentLive");
  }

  function reset() {
    setCode(null);
    setPlayer(null);
    setScreen("landing");
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {screen === "landing" && <Landing onHost={() => setScreen("hostSetup")} onJoin={() => setScreen("joinForm")} />}
      {screen === "hostSetup" && <HostSetup onCreate={createSession} onBack={reset} />}
      {screen === "hostLive" && code && <HostLive code={code} onExit={reset} />}
      {screen === "joinForm" && <StudentJoin onJoined={joined} onBack={reset} />}
      {screen === "studentLive" && code && player && (
        <StudentLive code={code} playerId={player.playerId} name={player.name} onExit={reset} />
      )}
    </div>
  );
}
