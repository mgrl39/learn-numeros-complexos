/* =====================================================================
   app.js — motor de comprovació, interfície i gràfiques
   ===================================================================== */

/* =====================================================================
   1. ARITMÈTICA COMPLEXA  (els complexos es representen com [re, im])
   ===================================================================== */
const cadd = (x, y) => [x[0] + y[0], x[1] + y[1]];
const csub = (x, y) => [x[0] - y[0], x[1] - y[1]];
const cmul = (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]];
const cabs = (x) => Math.hypot(x[0], x[1]);
const cconj = (x) => [x[0], -x[1]];
const carg = (x) => Math.atan2(x[1], x[0]);
const cdiv = (x, y) => {
  const d = y[0] * y[0] + y[1] * y[1];
  return [(x[0] * y[0] + x[1] * y[1]) / d, (x[1] * y[0] - x[0] * y[1]) / d];
};
const cexp = (x) => { const e = Math.exp(x[0]); return [e * Math.cos(x[1]), e * Math.sin(x[1])]; };
const clog = (x) => [Math.log(cabs(x)), carg(x)];
const ccos = (x) => [Math.cos(x[0]) * Math.cosh(x[1]), -Math.sin(x[0]) * Math.sinh(x[1])];
const csin = (x) => [Math.sin(x[0]) * Math.cosh(x[1]), Math.cos(x[0]) * Math.sinh(x[1])];
const csqrt = (x) => {
  if (Math.abs(x[1]) < 1e-14 && x[0] >= 0) return [Math.sqrt(x[0]), 0];
  const r = Math.sqrt(cabs(x)), t = carg(x) / 2;
  return [r * Math.cos(t), r * Math.sin(t)];
};
/* Quan LOGPOW és cert, una potència retorna el logaritme del seu valor: així
   es poden validar mòduls com (3√2)^829, que desborden el double. */
let LOGPOW = false;
function cpow(x, y) {
  if (LOGPOW && Math.abs(y[1]) < 1e-12 && Number.isInteger(y[0]) && Math.abs(y[0]) <= 1e7)
    return [y[0] * Math.log(cabs(x) || 1e-300), 0];
  if (Math.abs(y[1]) < 1e-12 && Number.isInteger(y[0]) && Math.abs(y[0]) <= 512) {
    let r = [1, 0], b = x, n = Math.abs(y[0]);
    for (let i = 0; i < n; i++) r = cmul(r, b);
    return y[0] < 0 ? cdiv([1, 0], r) : r;
  }
  if (cabs(x) === 0) return [0, 0];
  return cexp(cmul(y, clog(x)));
}

/* =====================================================================
   2. PARSER D'EXPRESSIONS
   Accepta: 3+4i, sqrt(3)/2*i, (1-i)^-1, 2*cis(pi/3), 2e^{i pi/3}, 1.5e-3, ...
   Compila l'expressió i torna una funció (env) -> [re, im]
   ===================================================================== */
function normalize(str) {
  let s = String(str)
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/[\u00b7\u22c5\u00d7]/g, '*')
    .replace(/\*\*/g, '^')
    /* √3, √(2+1), √ 3  ->  sqrt(3), sqrt((2+1)), sqrt(3) */
    .replace(/\u221a\s*(\([^()]*\)|[0-9]*\.?[0-9]+)/g, 'sqrt($1)')
    .replace(/[\u03c0\u03a0]/g, 'PI')
    .replace(/\s+/g, '');
  s = s.replace(/pi(?![A-Za-z])/gi, 'PI');       // 'ipi' -> 'iPI', '2pi' -> '2PI', 'pi/3' -> 'PI/3'
  s = s.replace(/sqrt(?=[0-9.])((?:[0-9]*\.?[0-9]+))/g, 'sqrt($1)');   // sqrt2 -> sqrt(2)
  s = s.replace(/(\d),(?=\d)/g, '$1.');          // coma decimal
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  return expandExp(s);
}

/* e^X, e{X}, e(X)  ->  exp(X)   (només quan 'e' va sol i seguit d'exponent) */
function expandExp(s) {
  let out = '', i = 0;
  while (i < s.length) {
    if (s[i] === 'e' && i + 1 < s.length && '^{('.indexOf(s[i + 1]) >= 0) {
      let j = i + 2, inner;
      if (s[j] === '{' || s[j] === '(') {
        const open = s[j], close = open === '{' ? '}' : ')';
        let d = 0, k = j;
        for (; k < s.length; k++) {
          if (s[k] === open) d++;
          else if (s[k] === close) { d--; if (!d) break; }
        }
        inner = s.slice(j + 1, k); j = k + 1;
      } else {
        let k = i + 2;
        while (k < s.length) {
          if (/[0-9A-Za-z_.]/.test(s[k])) { k++; continue; }
          if (s[k] === '(') {
            let d = 0, m = k;
            for (; m < s.length; m++) { if (s[m] === '(') d++; else if (s[m] === ')') { d--; if (!d) break; } }
            k = m + 1; continue;
          }
          break;
        }
        inner = s.slice(i + 2, k); j = k;
      }
      out += 'exp(' + inner + ')'; i = j; continue;
    }
    out += s[i]; i++;
  }
  return out;
}

function tokenize(s) {
  const T = []; let i = 0;

  /* una "paraula" pot ser varies índexs: 'ipi' -> i + PI, 'ePI' -> e + PI */
  function word(w) {
    if (w === 'i' || w === 'j') { T.push({ t: 'num', v: 0, im: true }); return; }
    if (w === 'pi') { T.push({ t: 'num', v: Math.PI }); return; }
    if (w === 'e') { T.push({ t: 'num', v: Math.E }); return; }
    if (FUNCS[w] || w.length === 1) { T.push({ t: 'func', v: w }); return; }
    let k = 0;
    while (k < w.length) {
      let hit = false;
      for (const p of ['pi', 'j', 'i', 'e'])
        if (w.startsWith(p, k)) { word(p); k += p.length; hit = true; break; }
      if (!hit) throw new Error('no entenc «' + w + '»');
    }
  }

  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      if ((s[j] === 'e' || s[j] === 'E') && (s[j + 1] === '+' || s[j + 1] === '-')) {
        j++; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      }
      T.push({ t: 'num', v: parseFloat(s.slice(i, j)) }); i = j; continue;
    }
    if (/[A-Za-z]/.test(c)) {
      let j = i; while (j < s.length && /[A-Za-z0-9]/.test(s[j])) j++;
      word(s.slice(i, j).toLowerCase()); i = j; continue;
    }
    if ('+-*/^(),'.indexOf(c) >= 0) { T.push({ t: c }); i++; continue; }
    throw new Error('no entenc el caràcter «' + c + '»');
  }
  return T;
}

const FUNCS = {
  sqrt: (a) => csqrt(a),
  sq: (a) => cmul(a, a), sqr: (a) => cmul(a, a), square: (a) => cmul(a, a),
  exp: (a) => cexp(a),
  ln: (a) => clog(a), log: (a) => clog(a),
  sin: (a) => csin(a), cos: (a) => ccos(a),
  tan: (a) => cdiv(csin(a), ccos(a)),
  cis: (a) => [Math.cos(a[0]), Math.sin(a[0])],
  abs: (a) => [cabs(a), 0],
  arg: (a) => [carg(a), 0],
  re: (a) => [a[0], 0], im: (a) => [a[1], 0], conj: (a) => cconj(a),
};

function compile(str) {
  const T = tokenize(normalize(str));
  let p = 0;
  const peek = () => T[p];
  const take = () => T[p++];
  const startsFactor = () => { const t = peek(); return t && (t.t === 'num' || t.t === 'func' || t.t === '('); };

  /* L'arbre es construeix amb funcions de tancament: cada subexpressió
     retorna (env) -> [re, im], de manera que reutilitzem el mateix AST
     per avaluar molts punts (gràfiques, identitats). */
  function buildExpr() {
    let l = buildTerm();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = take().t, r = buildTerm();
      const a = l; l = (e) => op === '+' ? cadd(a(e), r(e)) : csub(a(e), r(e));
    }
    return l;
  }
  function buildTerm() {
    let l = buildUnary();
    for (;;) {
      if (peek() && (peek().t === '*' || peek().t === '/')) {
        const op = take().t, r = buildUnary(), a = l;
        l = (e) => op === '*' ? cmul(a(e), r(e)) : cdiv(a(e), r(e));
      } else if (startsFactor()) {           // multiplicació implícita: 2i, 3 exp(x), (1+i)(1-i)
        const r = buildUnary(), a = l;
        l = (e) => cmul(a(e), r(e));
      } else break;
    }
    return l;
  }
  function buildUnary() {
    if (peek() && peek().t === '-') { take(); const a = buildUnary(); return (e) => cmul([-1, 0], a(e)); }
    if (peek() && peek().t === '+') { take(); return buildUnary(); }
    return buildPower();
  }
  function buildPower() {
    const b = buildPrimary();
    if (peek() && peek().t === '^') {
      take(); const ex = buildUnary(), a = b;
      return (e) => cpow(a(e), ex(e));
    }
    return b;
  }
  function buildPrimary() {
    if (!peek()) throw new Error('l\'expressió acaba abans del compte');
    const t = take();
    if (t.t === 'num') {
      if (t.im) return () => [0, 1];
      if (peek() && peek().t === 'num' && peek().im) { take(); const v = t.v; return () => [0, v]; }
      const v = t.v; return () => [v, 0];
    }
    if (t.t === '(') { const e = buildExpr(); if (!peek() || peek().t !== ')') throw new Error('falta el parentesi )'); take(); return e; }
    if (t.t === 'func') {
      const name = t.v;
      if (FUNCS[name]) {
        if (peek() && peek().t === '(') {
          take(); const a = buildExpr();
          if (!peek() || peek().t !== ')') throw new Error('falta el parentesi ) de ' + name);
          take();
          const f = FUNCS[name]; return (e) => f(a(e));
        }
        if (name === 'x' || name === 'pi') { /* variable sense parens */ }
        const a = buildPower();
        const f = FUNCS[name]; return (e) => f(a(e));
      }
      return (env) => {
        if (env && env[name] !== undefined) return Array.isArray(env[name]) ? env[name] : [env[name], 0];
        throw new Error('no conec la variable «' + name + '»');
      };
    }
    throw new Error('expressió inesperada');
  }

  const tree = buildExpr();
  if (p < T.length) throw new Error('no puc interpretar el final de l\'expressió');
  return (env) => tree(env || {});
}

function safeEval(str, env) {
  try { return { ok: true, v: compile(str)(env || {}) }; }
  catch (e) { return { ok: false, err: e.message }; }
}

/* =====================================================================
   3. COMPROBADORS
   ===================================================================== */
const TOL = 1e-6;
const near = (a, b, tol) => Math.abs(a - b) <= (tol || TOL) * Math.max(1, Math.abs(a), Math.abs(b));
const cnear = (x, y, tol) => near(x[0], y[0], tol) && near(x[1], y[1], tol);

const asC = (c) => Array.isArray(c) ? c : [c, 0];
function evalPoly(coeffs, z) {
  let v = [0, 0];
  for (let i = coeffs.length - 1; i >= 0; i--) v = cadd(cmul(v, z), asC(coeffs[i]));
  return v;
}
const polyScale = (coeffs) => coeffs.reduce((s, c) => s + cabs(asC(c)), 0) || 1;

const PTS = [[1, 0], [-1.7, 0], [0.3, 0], [2.9, 0], [-4.1, 0], [0.77, 0], [-2.2, 0], [5.3, 0],
             [1.3, 2.1], [-0.4, -3.2], [2.5, -1.1], [-3.3, 1.4]];

function chkNum(str, v) {
  if (!str.trim()) return { ok: false, empty: true };
  const u = safeEval(str, {});
  if (!u.ok) return { ok: false, err: u.err };
  if (Math.abs(u.v[1]) > 1e-9 * Math.max(1, Math.abs(u.v[0]))) return { ok: false, err: 'aquest resultat hauria de ser real' };
  return { ok: near(u.v[0], v) };
}

function chkCmp(str, v) {
  if (!str.trim()) return { ok: false, empty: true };
  const u = safeEval(str, {});
  if (!u.ok) return { ok: false, err: u.err };
  return { ok: cnear(u.v, v) };
}

/* arrel quadrada: es valida w^2 = z (tolerància ampla, l'alumne pot
   escriure un decimal i en*)(w, i) al quadrat s'amplifica l'error) */
function chkRoot(str, z) {
  if (!str.trim()) return { ok: false, empty: true };
  const u = safeEval(str, {});
  if (!u.ok) return { ok: false, err: u.err };
  const w2 = cmul(u.v, u.v);
  return { ok: cnear(w2, z, 1e-4) };
}

function chkPolar(rs, as, r, th, rLog) {
  /* si no hi ha argument escrit però el mòdul és una expressió complexa/polar,
     en derivesm el mòdul i l'argument. Ex: «2*cis(pi/3)» */
  let Rs = rs, As = as;
  if (!as.trim() && /cis|e[\^({]|i/i.test(rs)) {
    const u = safeEval(rs, {});
    if (u.ok) { Rs = String(cabs(u.v)); As = String(carg(u.v)); }
  }
  if (!Rs.trim() || !As.trim()) return { ok: false, empty: true };
  const R = safeEval(Rs, {}), A = safeEval(As, {});
  if (!R.ok) return { ok: false, err: R.err };
  if (!A.ok) return { ok: false, err: A.err };
  if (Math.abs(R.v[1]) > 1e-9) return { ok: false, err: 'el mòdul ha de ser un nombre real' };
  if (Math.abs(A.v[1]) > 1e-9) return { ok: false, err: 'l\'argument ha de ser un nombre real' };
  let d = A.v[0] - th;
  d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));       // l'argument és mod 2π
  let modOk;
  if (rLog != null) {              // mòdul enorme: comparem els logaritmes
    LOGPOW = true; const L = safeEval(Rs, {}); LOGPOW = false;
    modOk = L.ok && isFinite(L.v[0]) && Math.abs(L.v[0] - rLog) < 1e-6 * Math.max(1, Math.abs(rLog));
  } else modOk = near(R.v[0], r);
  return { ok: modOk && Math.abs(d) < 1e-6, dAng: d };
}

function chkRoots(str, coeffs, deg) {
  const parts = splitList(str);
  if (!parts.length) return { ok: false, empty: true };
  const sc = polyScale(coeffs);
  if (parts.length !== deg) return { ok: false, err: 'hi has escrit ' + parts.length + ' arrels i el polinomi és de grau ' + deg };
  for (const pt of parts) {
    const u = safeEval(pt, {});
    if (!u.ok) return { ok: false, err: 'no entenc «' + pt + '»' };
    if (cabs(evalPoly(coeffs, u.v)) > 1e-6 * sc) return { ok: false, err: pt + ' no és arrel del polinomi' };
  }
  return { ok: true };
}

function chkFac(str, coeffs, realOnly, maxDeg) {
  /* sense comes = un sol producte; amb comes = llista de factors */
  const listed = /[,;\n]/.test(str);
  const parts = listed ? splitList(str) : [str.trim()];
  if (!parts.length || !parts[0]) return { ok: false, empty: true };
  const f = [];
  for (const pt of parts) {
    let c;
    try { c = compile(pt); } catch (e) { return { ok: false, err: 'no puc llegir «' + pt + '»: ' + e.message }; }
    if (realOnly) {
      /* un polinomi té coeficients reals exactament quan f(conj x) = conj(f(x)).
         Si l'alumne no ha separat els factors, en provem de separar nosaltres
         pels punts de juxtaposició de nivell superior. */
      const sub = listed ? [pt] : pt.split(/(?<=\))(?=\()/).map(s => s.trim()).filter(Boolean);
      for (const piece of sub) {
        let g;
        try { g = compile(piece); } catch (e) { continue; }
        for (const x of [[1.3, 2.1], [-0.4, -3.2], [2.5, -1.1], [0.7, 4.3]]) {
          const a = g({ x }), b = g({ x: cconj(x) });
          if (!cnear(a, cconj(b), 1e-9))
            return { ok: false, err: 'el factor «' + piece + '» no té coeficients reals', realErr: true };
        }
      }
    }
    if (maxDeg && listed) {          // el grau es comprova només si els factors van separats
      const a = cabs(c({ x: [10, 0] })), b = cabs(c({ x: [20, 0] }));
      if (b > 1e-9 && a > 1e-9) {
        const lg = Math.log2(b / a);
        for (const d of [Math.round(lg) - 1, Math.round(lg), Math.round(lg) + 1])
          if (Math.abs(lg - d) < 0.08 && d > maxDeg)
            return { ok: false, err: 'el factor «' + pt + '» és de grau ' + d + ' i aquí demanes com a màxim grau ' + maxDeg };
      }
    }
    f.push(c);
  }
  for (const x of PTS) {
    let prod = [1, 0];
    for (const c of f) prod = cmul(prod, c({ x }));
    if (!cnear(prod, evalPoly(coeffs, x), 1e-6))
      return { ok: false, err: 'el producte dels factors no dona el polinomi (prova amb x = ' + fmtNum(x[0]) + ')' };
  }
  return { ok: true };
}

const IDX = [-2.9, -1.8, -0.7, -0.13, 0.31, 1.2, 2.4, 3.3, 5.1];
function chkId(str, target) {
  if (!str.trim()) return { ok: false, empty: true };
  let a, b;
  try { a = compile(str); } catch (e) { return { ok: false, err: e.message }; }
  try { b = compile(target); } catch (e) { return { ok: false, err: 'no puc comprovar res' }; }
  for (const x of IDX) {
    let u, v;
    try { u = a({ x }); v = b({ x }); } catch (e) { return { ok: false, err: e.message }; }
    if (!cnear(u, v, 1e-7)) {
      return { ok: false, err: 'no és la mateixa funció (a \\(x=' + fmtNum(x) + '\\) la teva expressió val ' +
                              fmtNum(u[0]) + ' i hauria de valer ' + fmtNum(v[0]) + ')' };
    }
  }
  return { ok: true };
}

/* normalitza un text per comparar-lo: sense espais, sense * ni parentesis */
const nb = (s) => String(s).toLowerCase().replace(/[\s*·(){}\[\]]/g, '').replace(/−/g, '-');
function chkBlank(str, any) {
  const s = nb(str);
  if (!s) return { ok: false, empty: true };
  const list = any.map(nb);
  if (list.some(a => s === a || (a.length >= 4 && s.includes(a)))) return { ok: true };
  const u = safeEval(str, {});                       // comparem també com a nombre
  if (u.ok && Math.abs(u.v[1]) < 1e-12) for (const a of any) {
    const t = safeEval(a, {});
    if (t.ok && near(u.v[0], t.v[0])) return { ok: true };
  }
  return { ok: false };
}

function splitList(str) {
  return String(str).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
}

/* =====================================================================
   4. FORMATACIÓ DE RESPOSTES (radicals)
   ===================================================================== */
const AS = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 7, -7, 1 / 2, -1 / 2, 3 / 2, -3 / 2, 5 / 2, -5 / 2];
const BS = [1, -1, 2, -2, 3, -3, 4, -4, 6, -6, 8, -8, 1 / 2, -1 / 2, 3 / 2, -3 / 2, 5 / 2, -5 / 2,
            9 / 2, -9 / 2, 11 / 2, -11 / 2, 13 / 2, -13 / 2, 3 / 4, -3 / 4, 5 / 4, -5 / 4];
const CS = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23, 26, 29, 30, 31, 33, 34, 37, 38, 39,
            41, 42, 43, 46, 47, 51, 57, 58, 62, 66, 67, 69, 71, 73, 74, 77, 78, 82, 83, 85, 86, 87];
const AMAP = new Map();
for (const a of AS) AMAP.set(Math.round(a * 4), a);

const _surdCache = new Map();
function surd(v) {
  if (!isFinite(v)) return String(v);
  if (_surdCache.has(v)) return _surdCache.get(v);
  const out = fmtSurd(v);
  _surdCache.set(v, out);
  return out;
}
function fracTex(q) {
  if (Math.abs(q - Math.round(q)) < 1e-12) return String(Math.round(q));
  let n = q, d = 1;
  for (const cand of [2, 3, 4]) { if (Math.abs(q * cand - Math.round(q * cand)) < 1e-12) { n = q * cand; d = cand; break; } }
  const N = Math.round(n);
  return (N < 0 ? '-' : '') + '\\tfrac{' + Math.abs(N) + '}{' + d + '}';
}
function fmtSurd(v) {
  const r = Math.round(v);
  if (Math.abs(v) < 1e-10) return '0';
  if (Math.abs(v - r) < 1e-10) return String(r);
  for (const c of CS) {
    const sc = Math.sqrt(c);
    for (const b of BS) {
      const a = v - b * sc;
      const key = Math.round(a * 4);
      if (AMAP.has(key) && Math.abs(AMAP.get(key) - a) < 1e-9) {
        const A = AMAP.get(key), B = Math.abs(b);
        const lead = A === 0 ? '' : (A > 0 ? '+' : '-') + fracTex(A) + (B === 1 ? '' : fracTex(B));
        return lead + (B === 1 ? '' : fracTex(B)) + '\\sqrt{' + c + '}';
      }
    }
  }
  return fmtNum(v);
}
function fmtNum(v) {
  if (!isFinite(v)) return String(v);
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-4 || a >= 1e7)) return v.toExponential(5);
  return String(Number(v.toFixed(7)));
}
function ctex(z) {
  if (Math.abs(z[1]) < 1e-10) return surd(z[0]);
  const head = Math.abs(z[0]) < 1e-10 ? '' : (z[0] < 0 ? '-' : '+') + surd(Math.abs(z[0]));
  const bi = Math.abs(Math.abs(z[1]) - 1) < 1e-10 ? 'i' : surd(Math.abs(z[1])) + 'i';
  return head + (z[1] < 0 ? '-' : '+') + bi;
}
function angTex(th) {
  const u = th / Math.PI;
  for (const [n, d] of [[0, 1], [1, 2], [1, 3], [1, 4], [1, 6], [3, 4], [1, 1], [2, 3], [5, 4], [3, 2], [3, 1], [4, 1], [5, 2], [7, 4], [11, 6]])
    if (Math.abs(u - n / d) < 1e-9) return '\\tfrac{' + n + '\\pi}{' + d + '}';
  return '\\mathrm{cis}\\,' + fmtNum(th);
}
const polTex = (r, th) => surd(r) + '\\,\\mathrm{cis}\\,' + angTex(th);
function expectedTex(w) {
  if (w.sol) return w.sol;
  switch (w.k) {
    case 'num': return surd(w.v);
    case 'cmp': case 'sqrt': return ctex(w.v);
    case 'pol': return polTex(w.r, w.th);
    default: return '';
  }
}

/* =====================================================================
   5. GRÀFIQUES
   ===================================================================== */
/* Si el navegador no dona contexto 2d, retornem un context buit: la pàgina
   ha de continuar sent útil encara que no es dibuixin els graphs. */
const NOCTX = new Proxy({}, { get: () => () => ({}) });
function ctx2d(cv) {
  try { const g = cv.getContext && cv.getContext('2d'); if (g) return g; } catch (e) {}
  return NOCTX;
}

function fitCanvas(cv, w, h) {
  cv.__w = w; cv.__h = h;
  const dpr = (window.devicePixelRatio || 1);
  try {
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
  } catch (e) {}
  const g = ctx2d(cv);
  try { g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); } catch (e) {}
  return g;
}

function drawPlane(cv, cfg) {
  const W = cv.__w || 340, H = cv.__h || 250;
  const g = ctx2d(cv);
  const scale = cfg.scale || 44;
  const X = (re) => W / 2 + re * scale;
  const Y = (im) => H / 2 - im * scale;
  const step = scale >= 46 ? 1 : scale >= 22 ? 2 : 5;
  const rMax = Math.max(W / 2, H / 2) / scale + 2;

  g.lineWidth = 1;
  g.strokeStyle = '#eef2f7'; g.beginPath();
  for (let k = -Math.ceil(rMax / step) * step; k <= rMax; k += step) {
    if (Math.abs(k % step) > 1e-9 || Math.abs(k) > 1e-9) { g.moveTo(X(k), 0); g.lineTo(X(k), H); }
    g.moveTo(0, Y(k)); g.lineTo(W, Y(k));
  }
  g.stroke();
  g.strokeStyle = '#94a3b8'; g.lineWidth = 1.6; g.beginPath();
  g.moveTo(X(0), 0); g.lineTo(X(0), H); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke();

  g.fillStyle = '#94a3b8'; g.font = '10px system-ui';
  for (let k = step; k <= rMax; k += step) { g.fillText(String(k), X(k) + 2, Y(0) - 4); g.fillText(String(k), X(0) + 3, Y(k) + 10); }
  g.fillStyle = '#64748b'; g.font = '11px system-ui';
  g.fillText('Re', W - 18, Y(0) - 6); g.fillText('Im', X(0) + 6, 12);

  if (cfg.unit !== false) {
    g.strokeStyle = '#cbd5e1'; g.setLineDash([3, 3]); g.lineWidth = 1;
    g.beginPath(); g.arc(X(0), Y(0), scale, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
  }
  if (cfg.region) drawRegion(g, cfg.region, X, Y, scale, W, H);
  for (const c of (cfg.circles || [])) {
    g.strokeStyle = c.color || '#6366f1'; g.lineWidth = 1.4; g.setLineDash([4, 3]);
    g.beginPath(); g.arc(X(c.re), Y(c.im), c.r * scale, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    if (c.label) { g.fillStyle = c.color || '#6366f1'; g.font = '10px system-ui'; g.fillText(c.label, X(c.re) + 3, Y(c.im) - 4); }
  }
  for (const r of (cfg.rays || [])) {
    const x = X(r.re), y = Y(r.im);
    g.strokeStyle = r.color || '#0ea5e9'; g.lineWidth = 1.6; g.setLineDash(r.solid ? [] : [4, 3]);
    g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(x, y); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(x, y, 3, 0, 2 * Math.PI); g.fillStyle = r.color || '#0ea5e9'; g.fill();
    if (r.label) { g.fillStyle = r.color || '#0ea5e9'; g.font = '10px system-ui'; g.fillText(r.label, x + 5, y - 5); }
  }
  let poly = (cfg.polyline || []).map(p => [X(p[0]), Y(p[1])]);
  if (poly.length > 1) {
    g.strokeStyle = cfg.polyColor || '#f59e0b'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(poly[0][0], poly[0][1]);
    for (const q of poly.slice(1)) g.lineTo(q[0], q[1]);
    g.stroke();
  }
  for (const p of (cfg.points || [])) {
    const x = X(p.z[0]), y = Y(p.z[1]);
    g.fillStyle = p.color || '#4f46e5';
    g.beginPath(); g.arc(x, y, p.r || 4, 0, 2 * Math.PI); g.fill();
    if (p.label) { g.fillStyle = p.color || '#4f46e5'; g.font = 'bold 10px system-ui'; g.fillText(p.label, x + 6, y - 6); }
  }
}

function drawRegion(g, R, X, Y, scale, W, H) {
  const CL = 22;
  g.save();
  g.beginPath(); g.rect(0, 0, W, H); g.clip();
  const FILL = 'rgba(79,70,229,.16)', EDGE = '#4f46e5';
  g.fillStyle = FILL; g.strokeStyle = EDGE; g.lineWidth = 2;
  if (R.type === 'disk') {
    g.beginPath(); g.arc(X(R.re), Y(R.im), R.r * scale, 0, 2 * Math.PI); g.fill(); g.setLineDash([5, 4]); g.stroke();
  } else if (R.type === 'diamond') {
    const c = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(p => [X(R.re + p[0] * R.d), Y(R.im + p[1] * R.d)]);
    g.beginPath(); g.moveTo(c[0][0], c[0][1]);
    for (let i = 1; i < 4; i++) g.lineTo(c[i][0], c[i][1]);
    g.closePath(); g.fill(); g.setLineDash([5, 4]); g.stroke();
  } else if (R.type === 'ray') {
    const L = 400, dx = Math.cos(R.ang) * L, dy = Math.sin(R.ang) * L;
    g.beginPath();
    g.moveTo(X(0) - dy * 0.0 - dx, Y(0) + dy);
    g.lineWidth = 7; g.strokeStyle = FILL; g.lineCap = 'round';
    g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(0) + dx, Y(0) - dy); g.stroke();
    g.lineWidth = 2; g.strokeStyle = EDGE; g.setLineDash([5, 4]);
    g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(0) + dx, Y(0) - dy); g.stroke();
  } else if (R.type === 'parab') {
    const yMax = H / 2 / scale + 1;
    const px = (t) => R.vx + t * t / (4 * R.p);
    g.beginPath();
    for (let t = -yMax; t <= yMax; t += 0.05) { const x = X(px(t)), y = Y(R.vy + t); if (t === -yMax) g.moveTo(x, y); else g.lineTo(x, y); }
    g.lineTo(W + CL, Y(R.vy + yMax)); g.lineTo(W + CL, Y(R.vy - yMax));
    g.closePath(); g.fill();
    g.beginPath();
    for (let t = -yMax; t <= yMax; t += 0.05) { const x = X(px(t)), y = Y(R.vy + t); if (t === -yMax) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
  }
  g.setLineDash([]); g.restore();
}

function drawFnPlot(cv, target, userFn) {
  const W = cv.__w || 360, H = cv.__h || 230;
  const g = ctx2d(cv);
  const L = 32, Rr = W - 10, T = 10, B = H - 24;
  const x0 = -Math.PI, x1 = Math.PI, y0 = -2, y1 = 2;
  const X = (x) => L + (x - x0) / (x1 - x0) * (Rr - L);
  const Y = (y) => B - (y - y0) / (y1 - y0) * (B - T);
  g.strokeStyle = '#eef2f7'; g.lineWidth = 1; g.beginPath();
  for (let k = Math.ceil(x0 / Math.PI) * Math.PI; k <= x1; k += Math.PI / 4) { g.moveTo(X(k), T); g.lineTo(X(k), B); }
  for (let k = -2; k <= 2; k++) { g.moveTo(L, Y(k)); g.lineTo(Rr, Y(k)); }
  g.stroke();
  g.strokeStyle = '#94a3b8'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(X(0), T); g.lineTo(X(0), B); g.moveTo(L, Y(0)); g.lineTo(Rr, Y(0)); g.stroke();
  g.fillStyle = '#64748b'; g.font = '10px system-ui';
  [-Math.PI, -Math.PI / 2, Math.PI / 2, Math.PI].forEach(k => g.fillText(fmtNum(k), X(k) - 10, B + 14));
  [-1, 1].forEach(k => g.fillText(String(k), L - 12, Y(k) + 3));

  const tgt = safeEval(target, { x: 0 });
  const plot = (fn, color, dash, wid) => {
    if (!fn.ok) return;
    g.strokeStyle = color; g.lineWidth = wid; g.setLineDash(dash || []);
    g.beginPath();
    let started = false;
    for (let i = 0; i <= 600; i++) {
      const x = x0 + i / 600 * (x1 - x0);
      let v; try { v = fn.v({ x }); } catch (e) { started = false; continue; }
      if (!isFinite(v[0]) || Math.abs(v[0]) > 8) { started = false; continue; }
      const px = X(x), py = Y(Math.max(y0, Math.min(y1, v[0])));
      if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py);
    }
    g.stroke(); g.setLineDash([]);
  };
  plot(tgt, '#4f46e5', [], 2.2);
  if (userFn && userFn.trim()) plot(safeEval(userFn, { x: 0 }), '#f59e0b', [5, 4], 2);
  g.font = '11px system-ui'; g.fillStyle = '#4f46e5'; g.fillText('real', L + 6, T + 12);
  if (userFn && userFn.trim()) { g.fillStyle = '#f59e0b'; g.fillText('la teva expressió', L + 36, T + 12); }
}

/* =====================================================================
   6. INTERFÍCIE
   ===================================================================== */
const view = document.getElementById('view');
const navlist = document.getElementById('navlist');
const scoreEl = document.getElementById('score');

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function katexInto(node, tex, display) {
  try { katex.render(tex, node, { throwOnError: false, displayMode: !!display, trust: false }); }
  catch (e) { node.textContent = tex; }
}
/* text barrejat: \(...\) i \[...\] es renderitzen amb KaTeX, la resta és HTML */
function katexMixed(node, text) {
  node.innerHTML = '';
  const pushHtml = (s) => { const sp = el('span'); sp.innerHTML = s; node.appendChild(sp); };
  const re = /\\\(([^]*?)\\\)|\\\[([^]*?)\\\]/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) pushHtml(text.slice(last, m.index));
    const span = el('span');
    katexInto(span, m[1] !== undefined ? m[1] : m[2], m[1] === undefined);
    node.appendChild(span);
    last = m.index + m[0].length;
  }
  if (last < text.length) pushHtml(text.slice(last));
  return node;
}

/* --- estat --- */
const KEY = 'nombres-complexos-v1';
let ST = { ex: 0, res: {} };
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) ST = s; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} };

function countWidgets(ex) {
  let n = 0;
  for (const it of [...ex.items, ...((ex.sec2 && ex.sec2.items) || [])]) n += (it.w || []).length;
  return n;
}
function resOf(exIdx) {
  if (!ST.res[exIdx]) ST.res[exIdx] = {};
  return ST.res[exIdx];
}

/* --- barra lateral --- */
function renderNav() {
  navlist.innerHTML = '';
  EXERCISES.forEach((ex, i) => {
    const total = countWidgets(ex);
    const done = Object.values(ST.res[i] || {}).filter(v => v === true).length;
    const d = el('div', 'nitem' + (i === ST.ex ? ' on' : ''));
    d.innerHTML =
      '<div class="num">' + (i + 1) + (ex.star ? '★' : '') + '</div>' +
      '<div style="flex:1"><div>' + ex.title + '</div>' +
      '<div class="bar"><i style="width:' + (total ? (100 * done / total) : 0) + '%"></i></div></div>';
    d.onclick = () => { ST.ex = i; save(); render(); };
    navlist.appendChild(d);
  });
  let ok = 0, tot = 0;
  EXERCISES.forEach((ex, i) => {
    tot += countWidgets(ex);
    ok += Object.values(ST.res[i] || {}).filter(v => v === true).length;
  });
  scoreEl.textContent = ok + ' / ' + tot + ' respostes correctes';
}

/* --- construcció d'una casella --- */
function buildWidget(w, item, idx, exIdx) {
  const box = el('div', 'mb-3');
  const lab = el('div', 'lbl');
  /* els noms són text normal; només van per KaTeX si porten notació */
  if (w.name) {
    if (/[\\^_{}]/.test(w.name)) katexInto(lab, w.name);
    else lab.textContent = w.name;
    box.appendChild(lab);
  }
  const fb = el('div', 'fb');
  const inputs = [];

  const mk = (ph) => { const i = el('input'); i.type = 'text'; i.placeholder = ph; i.autocomplete = 'off'; i.spellcheck = false; return i; };

  if (w.k === 'num') {
    const a = mk('2sqrt(2)');
    box.appendChild(a); inputs.push(a);
  } else if (w.k === 'cmp' || w.k === 'sqrt') {
    const a = mk('3+4i'); box.appendChild(a); inputs.push(a);
    box.appendChild(el('div', '', '<span style="font-size:11px;color:#94a3b8">una sola casella: ' +
      '<code>3+4i</code>, <code>-2i</code>, <code>-1/4 - 1/4 i</code>, <code>i*sqrt(pi)</code>, <code>2*cis(pi/3)</code>…</span>'));
  } else if (w.k === 'pol') {
    const row = el('div', ''); row.style.cssText = 'display:flex;gap:8px';
    const a = mk('mòdul'); const b = mk('argument (rads)');
    row.appendChild(a); row.appendChild(b); box.appendChild(row);
    inputs.push(a); inputs.push(b);
    box.appendChild(el('div', '', '<span style="font-size:11px;color:#94a3b8">també val escriure-ho tot a la primera casella, ' +
      'p. ex. <code>2*cis(pi/3)</code> o <code>2e^{i pi/3}</code></span>'));
  } else if (w.k === 'roots' || w.k === 'fac' || w.k === 'id') {
    const a = mk(w.k === 'roots' ? '1+i, -1-i, 2, -2' : w.k === 'fac' ? '(x-1)(x+1), x^2+1' : 'sin(2*x)*cos(x)+cos(2*x)*sin(x)');
    box.appendChild(a); inputs.push(a);
    if (w.k === 'roots') box.appendChild(el('div', '', '<span style="font-size:11px;color:#94a3b8">separa les arrels amb comes</span>'));
    if (w.k === 'fac') box.appendChild(el('div', '', '<span style="font-size:11px;color:#94a3b8">separa els factors amb comes, sense el signe global</span>'));
  } else if (w.k === 'choice') {
    w.options.forEach((o, oi) => {
      const l = el('label', 'opt');
      const r = el('input'); r.type = 'radio'; r.name = 'opc' + exIdx + '_' + idx; r.value = oi;
      r.style.width = 'auto'; r.style.minWidth = '0';
      const t = el('span'); katexInto(t, o);
      l.appendChild(r); l.appendChild(t);
      r.onchange = () => {
        box.querySelectorAll('.opt').forEach((n, ni) => n.classList.toggle('sel', ni === oi));
      };
      box.appendChild(l); inputs.push(r);
    });
  } else if (w.k === 'blank') {
    const a = mk('?'); a.style.maxWidth = '160px';
    box.appendChild(a); inputs.push(a);
  }
  box.appendChild(fb);

  /* --- comprovació --- */
  function readAll() { return inputs.map(i => i.type === 'radio' ? (i.checked ? i.value : null) : i.value); }

  /* el que l'alumne ha escrit es conserva en memoria: si tornes a l'exercici
     el trobaràs tal com l'has deixat */
  const saved = resOf(exIdx)['v' + idx];
  if (Array.isArray(saved)) inputs.forEach((i, k) => {
    if (saved[k] == null) return;
    if (i.type === 'radio') i.checked = (i.value === String(saved[k]));
    else i.value = saved[k];
  });
  inputs.forEach(i => {
    if (i.type === 'radio') i.addEventListener('change', () => check());
    else {
      i.addEventListener('input', () => { resOf(exIdx)['v' + idx] = readAll(); });
      i.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    }
  });

  function check() {
    const vals = readAll();
    let r;
    if (w.k === 'num') r = vals[0] === '' ? { ok: false, empty: true } : chkNum(vals[0], w.v);
    else if (w.k === 'cmp') r = chkCmp(vals[0], w.v);
    else if (w.k === 'sqrt') r = chkRoot(vals[0], w.v);
    else if (w.k === 'pol') r = chkPolar(vals[0], vals[1], w.r, w.th, w.rLog);
    else if (w.k === 'roots') r = chkRoots(vals[0], w.coeffs, w.deg);
    else if (w.k === 'fac') r = chkFac(vals[0], w.coeffs, w.real, w.maxDeg);
    else if (w.k === 'id') r = chkId(vals[0], w.target);
    else if (w.k === 'choice') {
      const chosen = vals.find(v => v !== null && v !== undefined);
      r = chosen === undefined ? { ok: false, empty: true } : { ok: +chosen === w.ans };
    }
    else if (w.k === 'blank') r = chkBlank(vals[0], w.any);

    /* una casella buida no es «incorrecta»: només pintem quan l'alumne ha respost */
    const alguna = inputs.some(i => i.type === 'radio' ? i.checked : (i.value || '').trim() !== '');
    inputs.forEach(i => {
      if (i.type === 'radio') return;
      i.classList.remove('ok', 'no');
      if (alguna && !r.empty) i.classList.add(r.ok ? 'ok' : 'no');
    });
    if (w.k === 'choice') box.querySelectorAll('.opt').forEach((n, ni) => {
      n.classList.remove('ok', 'no');
      if (r.empty) return;                       // no Revejam la resposta si encara no s'ha contestat
      if (r.ok) { if (ni === w.ans) n.classList.add('ok'); }
      else if (inputs[ni].checked) n.classList.add('no');
      else if (ni === w.ans) n.classList.add('ok');
    });
    fb.className = 'fb ' + (r.ok ? 'ok' : 'no');
    fb.innerHTML = '';
    if (r.ok) fb.textContent = '✓ Correcte';
    else if (!r.empty) {
      fb.appendChild(document.createTextNode('✘ '));
      if (r.err) {
        fb.appendChild(katexMixed(el('span'), r.err));
        if (r.dAng != null && Math.abs(r.dAng) < Math.PI)
          fb.appendChild(katexMixed(el('span'), ' — l\'argument correcte és \\(' + angTex(w.th) + '\\)'));
      } else {
        fb.appendChild(katexMixed(el('span'), 'Correcte: \\(' + expectedTex(w) + '\\)'));
      }
    }
    const rk = resOf(exIdx); rk[idx] = r.ok; rk['v' + idx] = vals; save(); renderNav();
    return r.ok;
  }

  return { box, check, inputs, fb, reset() { inputs.forEach(i => { if (i.type !== 'radio') { i.value = ''; i.classList.remove('ok', 'no'); } else i.checked = false; }); fb.innerHTML = ''; } };
}

/* --- render d'un exercici --- */
function render() {
  renderNav();
  const ex = EXERCISES[ST.ex];
  view.innerHTML = '';

  const head = el('div', 'card');
  const t = el('div', '');
  t.style.cssText = 'font-size:19px;font-weight:700;margin-bottom:8px';
  t.innerHTML = (ex.star ? '<span class="tag">★ classe de problemes</span> ' : '') + (ST.ex + 1) + '. ' + ex.title;
  head.appendChild(t);
  const st = el('div', 'st'); katexMixed(st, ex.st); head.appendChild(st);
  view.appendChild(head);

  const blocks = [{ items: ex.items, sec: null }];
  if (ex.sec2) blocks.push({ items: ex.sec2.items, sec: ex.sec2 });

  blocks.forEach(B => {
    if (B.sec) {
      const s = el('div', 'card');
      const h = el('div', ''); h.style.cssText = 'font-weight:700;margin-bottom:6px';
      katexMixed(h, B.sec.st); s.appendChild(h);
      view.appendChild(s);
    }
    if (ex.note && !B.sec) {
      const n = el('div', 'card');
      n.style.cssText = 'font-size:13.5px;line-height:1.6;color:#334155';
      katexMixed(n, ex.note);
      view.appendChild(n);
    }

    B.items.forEach((it, ii) => view.appendChild(buildItem(it, ii, B.sec)));
  });

  const hintCard = el('div', 'card');
  hintCard.innerHTML = '<div class="lbl">Pista general</div><div id="hg"></div>';
  katexMixed(hintCard.querySelector('#hg'), ex.hint || '');
  view.appendChild(hintCard);

  /* requadre de la segona secció amb l'espiral de De Moivre */
  if (ex.spiral) {
    const cv = el('canvas'); fitCanvas(cv, 340, 250); cv.__w = 340; cv.__h = 250;
    const pts = [], poly = [];
    for (let n = 0; n <= 6; n++) { const r = Math.pow(Math.SQRT2, n), th = n * Math.PI / 4; const z = [r * Math.cos(th), r * Math.sin(th)]; pts.push({ z, label: 'n=' + n, color: n === 3 || n === 6 ? '#dc2626' : '#4f46e5' }); poly.push(z); }
    drawPlane(cv, { scale: 16, polyline: poly, points: pts, polyColor: '#f59e0b' });
    const c = el('div', 'card');
    c.innerHTML = '<div class="lbl">De Moivre: les potències de (1+i) giren i creixen</div>';
    c.appendChild(cv);
    const cap = el('div'); cap.style.cssText = 'font-size:12px;color:#64748b;margin-top:6px';
    cap.innerHTML = 'En vermell: <code>(1+i)³</code> i <code>(1+i)⁶</code>, els dos primers números de l\'exercici 1. Cada pas gira 45° i multiplica el mòdul per √2.';
    c.appendChild(cap);
    view.appendChild(c);
  }
}

function buildItem(it, ii, sec) {
  const card = el('div', 'card');
  const exIdx = ST.ex;

  if (it.tex) { const d = el('div', 'tex'); d.style.marginBottom = '10px'; katexInto(d, it.tex); card.appendChild(d); }

  if (it.note) {
    const n = el('div', '');
    n.style.cssText = 'font-size:12.5px;color:#b45309;margin-bottom:8px';
    const ic = el('span'); ic.textContent = '💡 ';
    n.appendChild(ic); n.appendChild(katexMixed(el('span'), it.note));
    card.appendChild(n);
  }
  if (it.step) {
    const n = el('div', '');
    n.style.cssText = 'font-size:12px;color:#64748b;margin-bottom:8px;font-style:italic';
    n.appendChild(katexMixed(el('span'), '↳ ' + it.step));
    card.appendChild(n);
  }

  /* --- gràfiques --- */
  if (it.plot === 'info' && it.z) {
    const cv = el('canvas'); fitCanvas(cv, 300, 210); cv.__w = 300; cv.__h = 210;
    drawPlane(cv, {
      scale: 40,
      circles: [{ re: 0, im: 0, r: cabs(it.z), label: '|z|', color: '#6366f1' }],
      rays: [
        { re: it.z[0], im: it.z[1], label: 'z', color: '#4f46e5', solid: true },
        { re: it.z[0], im: -it.z[1], label: 'z̄', color: '#ec4899' },
        { re: inv_(it.z)[0], im: inv_(it.z)[1], label: '1/z', color: '#10b981' },
      ],
      points: [{ z: it.z, label: 'z', color: '#4f46e5' }],
    });
    const wr = el('div', ''); wr.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start';
    wr.appendChild(cv);
    const lg = el('div', ''); lg.style.cssText = 'font-size:12px;color:#475569;line-height:1.9';
    lg.innerHTML = '<b style="color:#4f46e5">z</b>: el número<br><b style="color:#ec4899">z̄</b>: el conjugat (reflexió respecte l\'eix real)<br>' +
      '<b style="color:#10b981">1/z</b>: l\'invers (la línia verda gira i canvia de mòdul)<br><b style="color:#6366f1">|z|</b>: la circumferència de radi \\|z\\|';
    wr.appendChild(lg);
    card.appendChild(wr);
  }

  if (it.set) {
    const S = SETS[it.set];
    const cv = el('canvas'); fitCanvas(cv, 330, 250); cv.__w = 330; cv.__h = 250;
    let show = false;
    const redraw = () => drawPlane(cv, { scale: 42, unit: false, region: show ? S.region : null });
    redraw();
    const fb = el('div', 'fb hint');
    cv.onclick = (e) => {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left - 165) / 42, y = -(e.clientY - r.top - 125) / 42;
      fb.className = 'fb ' + (S.test(x, y) ? 'ok' : 'no');
      fb.innerHTML = '';
      fb.appendChild(katexMixed(el('span'),
        'El punt \\((' + fmtNum(x) + (Math.abs(y) < 1e-9 ? '' : ',' + fmtNum(y)) + ')\\): '));
      const b = el('b');
      b.textContent = S.test(x, y) ? 'sí pertany' : 'no pertany';
      fb.appendChild(b);
      fb.appendChild(document.createTextNode(' a ' + it.set));
    };
    const wr = el('div', ''); wr.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start;margin-bottom:10px';
    wr.appendChild(cv);
    const side = el('div', ''); side.style.cssText = 'font-size:12.5px;color:#475569;line-height:1.7;max-width:230px';
    side.innerHTML = 'Fes clic a qualsevol punt del pla per veure si pertany al subconjunt.<br><br>';
    const b = el('button', 'sm'); b.textContent = 'Mostra la figura';
    b.onclick = () => { show = !show; b.textContent = show ? 'Amaga la figura' : 'Mostra la figura'; redraw(); };
    side.appendChild(b);
    wr.appendChild(side);
    card.appendChild(wr); card.appendChild(fb);
  }

  if (it.roots) {
    const cv = el('canvas'); fitCanvas(cv, 300, 220); cv.__w = 300; cv.__h = 220;
    drawPlane(cv, { scale: 40, points: it.roots.map((z, i) => ({ z, label: 'α' + (i + 1), color: '#4f46e5' })) });
    card.appendChild(cv);
  }
  if (it.polarRoots) {
    const cv = el('canvas'); fitCanvas(cv, 300, 220); cv.__w = 300; cv.__h = 220;
    drawPlane(cv, {
      scale: 58,
      rays: it.polarRoots.th.map((t, i) => ({ re: it.polarRoots.r * Math.cos(t), im: it.polarRoots.r * Math.sin(t), label: 'ω' + (i + 1), color: '#4f46e5', solid: true })),
      points: it.polarRoots.th.map((t) => ({ z: [it.polarRoots.r * Math.cos(t), it.polarRoots.r * Math.sin(t)], color: '#4f46e5' })),
    });
    card.appendChild(cv);
  }

  /* --- caselles --- */
  const ws = [];
  (it.w || []).forEach((w, wi) => {
    const node = buildWidget(w, it, ii + '_' + wi + (sec ? 's' : ''), exIdx);
    card.appendChild(node.box);
    ws.push(node);
  });

  if (it.fn) {
    const cv = el('canvas'); fitCanvas(cv, 360, 230); cv.__w = 360; cv.__h = 230;
    const upd = () => drawFnPlot(cv, it.fn, ws[0] && ws[0].inputs[0].value);
    drawFnPlot(cv, it.fn, '');
    cv.style.marginTop = '6px';
    card.appendChild(cv);
    if (ws[0]) ws[0].inputs[0].addEventListener('input', upd);
  }

  /* --- botons --- */
  const bar = el('div', ''); bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px';
  const bc = el('button', 'pri'); bc.textContent = 'Comprovar';
  bc.onclick = () => { const oks = ws.filter(w => w.check()); if (oks.length && oks.length === ws.length) bar.querySelector('.prog').textContent = '✓ Tot correcte!'; };
  const prog = el('span', 'fb'); prog.className = 'fb';
  bar.appendChild(bc); bar.appendChild(prog);
  const hbtn = el('button', 'sm'); hbtn.textContent = 'Pista';
  hbtn.onclick = () => {
    if (!hbtn._d) {
      const d = el('div', 'sol');
      const tag = el('span'); tag.style.cssText = 'font-size:11px;color:#92400e'; tag.textContent = 'PISTA  ';
      d.appendChild(tag);
      d.appendChild(katexMixed(el('span'), it.hint || 'Revisa la pista general de baix de tot.'));
      hbtn.parentNode.insertBefore(d, hbtn.nextSibling);
      hbtn._d = d;
    }
    hbtn._d.style.display = hbtn._d.style.display === 'none' ? '' : 'none';
  };
  const sbtn = el('button', 'sm'); sbtn.textContent = 'Solució';
  let solBox = null;
  sbtn.onclick = () => {
    if (!solBox) {
      solBox = el('div', 'sol');
      (it.w || []).forEach(w => {
        const line = el('div', '');
        if (w.name && !/[\\^_{}]/.test(w.name)) {
          const b = el('b'); b.textContent = w.name + ': ';
          line.appendChild(b);
        }
        katexInto(line, expectedTex(w));
        solBox.appendChild(line);
      });
      if (it.step) solBox.appendChild(katexMixed(el('div', ''), it.step));
      bar.parentNode.insertBefore(solBox, bar.nextSibling);
    }
    solBox.style.display = solBox.style.display === 'none' ? '' : 'none';
  };
  bar.appendChild(hbtn); bar.appendChild(sbtn);
  card.appendChild(bar);
  return card;
}

/* --- accions globals --- */
document.getElementById('checkAll').onclick = () => {
  document.querySelectorAll('button.pri').forEach(b => { if (b.textContent === 'Comprovar') b.click(); });
  renderNav();
};
document.getElementById('revealAll').onclick = () => {
  document.querySelectorAll('button.sm').forEach(b => { if (b.textContent === 'Solució') b.click(); });
};
document.getElementById('reset').onclick = () => {
  ST.res = {}; save(); render();
};

/* --- arrencada --- */
render();
window.addEventListener('resize', () => { /* els canvas tenen mida fixa: no cal redibuixar */ });