import type { ReactNode } from "react";

// A tiny syntax highlighter for short JS/TSX excerpts. Enough to read well, no dependency.
const TOKEN =
  /(\/\/.*$|\{\/\*.*?\*\/\})|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|await|async|for|of|if|else|return|export|default|function|new|import|from)\b|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.]*|\/?>)|(\b[A-Za-z_$][\w$]*(?=\())/g;

export function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "n" : m[5] ? "t" : "f";
    out.push(<span key={k++} className={`hl-${cls}`}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
