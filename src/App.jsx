import { useState, useCallback, useEffect } from "react";

const FB_CONFIG = {
  apiKey: "AIzaSyC1XsjEakrMPBYru8j8zM2Y1rUbHrRPh8A",
  authDomain: "market-altawfer.firebaseapp.com",
  projectId: "market-altawfer",
  storageBucket: "market-altawfer.firebasestorage.app",
  messagingSenderId: "956981319308",
  appId: "1:956981319308:web:e0d16a4c1427834a830da9",
};

let _app = null, _db = null, _auth = null;

async function getFB() {
  if (_db) return { db: _db, auth: _auth };
  const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, addDoc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  _app = getApps().length ? getApps()[0] : initializeApp(FB_CONFIG);
  _db = getFirestore(_app);
  _auth = getAuth(_app);
  _db._fns = { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, addDoc, deleteDoc };
  _auth._fns = { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };
  return { db: _db, auth: _auth };
}

async function fsGetProfile(username) {
  try {
    const { db } = await getFB();
    const { doc, getDoc } = db._fns;
    const snap = await getDoc(doc(db, "players", username));
    return snap.exists() ? snap.data() : null;
  } catch (e) { console.error(e); return null; }
}

async function fsSaveProfile(username, data) {
  try {
    const { db } = await getFB();
    const { doc, setDoc } = db._fns;
    await setDoc(doc(db, "players", username), data, { merge: true });
  } catch (e) { console.error(e); }
}

async function fsGetLeaderboard() {
  try {
    const { db } = await getFB();
    const { collection, getDocs } = db._fns;
    const snap = await getDocs(collection(db, "players"));
    if (snap.empty) return [];
    const all = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        username: data.username || d.id,
        unlockedLevels: Number(data.unlockedLevels) || 1,
        bestScore: Number(data.bestScore) || 0,
        coins: Number(data.coins) || 0,
      };
    });
    return all.sort((a, b) => b.unlockedLevels - a.unlockedLevels || b.bestScore - a.bestScore).slice(0, 10);
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function fbRegister(username, password) {
  const email = `${username}@market-altawfer.game`;
  const { auth } = await getFB();
  const { createUserWithEmailAndPassword } = auth._fns;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function fbLogin(username, password) {
  const email = `${username}@market-altawfer.game`;
  const { auth } = await getFB();
  const { signInWithEmailAndPassword } = auth._fns;
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function fbLogout() {
  const { auth } = await getFB();
  const { signOut } = auth._fns;
  await signOut(auth);
}

// Audio functions
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;
function getCtx() { if (!ctx) ctx = new AudioCtx(); return ctx; }
function playSwap() { const c = getCtx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = "sine"; o.frequency.setValueAtTime(520, c.currentTime); o.frequency.exponentialRampToValueAtTime(780, c.currentTime + 0.1); g.gain.setValueAtTime(0.3, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15); o.start(); o.stop(c.currentTime + 0.15); }
function playMatch() { const c = getCtx(); [0, 0.07, 0.14].forEach((t, i) => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = "triangle"; o.frequency.setValueAtTime([440, 550, 660][i], c.currentTime + t); g.gain.setValueAtTime(0.25, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.15); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.15); }); }
function playWin() { const c = getCtx(), notes = [523, 659, 784, 1047]; notes.forEach((freq, i) => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = "sine"; o.frequency.setValueAtTime(freq, c.currentTime + i * 0.12); g.gain.setValueAtTime(0.3, c.currentTime + i * 0.12); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.3); o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.3); }); }
function playFail() { const c = getCtx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = "sawtooth"; o.frequency.setValueAtTime(300, c.currentTime); o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.4); g.gain.setValueAtTime(0.2, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4); o.start(); o.stop(c.currentTime + 0.4); }
function playCombo() { const c = getCtx(), notes = [784, 988, 1175, 1568]; notes.forEach((freq, i) => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = "square"; o.frequency.setValueAtTime(freq, c.currentTime + i * 0.08); g.gain.setValueAtTime(0.15, c.currentTime + i * 0.08); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.12); o.start(c.currentTime + i * 0.08); o.stop(c.currentTime + i * 0.08 + 0.12); }); }
function playCoin() { const c = getCtx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = "sine"; o.frequency.setValueAtTime(880, c.currentTime); o.frequency.exponentialRampToValueAtTime(1320, c.currentTime + 0.08); g.gain.setValueAtTime(0.3, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2); o.start(); o.stop(c.currentTime + 0.2); }
function playBomb() { const c = getCtx(); const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate); const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.08)); const src = c.createBufferSource(); src.buffer = buf; const g = c.createGain(); src.connect(g); g.connect(c.destination); g.gain.setValueAtTime(0.7, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5); src.start(); src.stop(c.currentTime + 0.5); }

// Game constants
const COLS = 8, ROWS = 8;
const ALL_TYPES = ["🍚", "🌾", "🫙", "🧴", "🍦", "🍌"];
const BOMB = "💣", VBOMB = "🧨", BOMBS = [BOMB, VBOMB];
const COLORS = { "🍚": "#E8F5E9", "🌾": "#D4A017", "🫙": "#FFD700", "🧴": "#00BCD4", "🍦": "#FCE4EC", "🍌": "#FFF176" };

const LEVELS = [
  { level: 1, targetScore: 500, moves: 35, label: "بداية التوفير 🛒" },
  { level: 2, targetScore: 800, moves: 35, label: "أول الصفقات 🛍️" },
  { level: 3, targetScore: 1000, moves: 35, label: "جمع النقاط 📈" },
  { level: 4, targetScore: 1500, moves: 35, label: "متسوق ذكي 🧠" },
  { level: 5, targetScore: 2000, moves: 35, label: "خصم كبير 🏷️" },
  { level: 6, targetScore: 2500, moves: 35, label: "عرض الموسم 🎪" },
  { level: 7, targetScore: 2800, moves: 35, label: "صيد الصفقات 🎣" },
  { level: 8, targetScore: 3000, moves: 35, label: "خبير التسوق 👑" },
  { level: 9, targetScore: 3300, moves: 35, label: "بطل التوفير 🏆" },
  { level: 10, targetScore: 3500, moves: 35, label: "سيد السوق 🎖️" },
  { level: 11, targetScore: 3900, moves: 30, label: "عاصفة العروض ⚡" },
  { level: 12, targetScore: 4200, moves: 30, label: "تحدي الخصومات 🔥" },
  { level: 13, targetScore: 4400, moves: 30, label: "صاروخ التسوق 🚀" },
  { level: 14, targetScore: 5000, moves: 30, label: "ملك العروض 👑" },
  { level: 15, targetScore: 5500, moves: 30, label: "أسطورة السوق 🌟" },
  { level: 16, targetScore: 5900, moves: 30, label: "محترف الصفقات 💼" },
  { level: 17, targetScore: 6200, moves: 30, label: "قناص العروض 🎯" },
  { level: 18, targetScore: 6600, moves: 30, label: "ساحر الأسواق 🪄" },
  { level: 19, targetScore: 6900, moves: 30, label: "مدير التسوق 📊" },
  { level: 20, targetScore: 7000, moves: 30, label: "خبير التوفير 💎" },
  { level: 21, targetScore: 7500, moves: 30, label: "بوابة المول 🏬" },
  { level: 22, targetScore: 7700, moves: 30, label: "عروض المول 🎪" },
  { level: 23, targetScore: 8100, moves: 30, label: "متاجر الأزياء 👗" },
  { level: 24, targetScore: 8800, moves: 30, label: "مطاعم المول 🍽️" },
  { level: 25, targetScore: 9200, moves: 30, label: "سينما المول 🎬" },
  { level: 26, targetScore: 10000, moves: 35, label: "ألعاب المول 🎮" },
  { level: 27, targetScore: 10500, moves: 35, label: "مجوهرات المول 💍" },
  { level: 28, targetScore: 10800, moves: 35, label: "VIP المول 🌟" },
  { level: 29, targetScore: 11100, moves: 35, label: "بطل المول 🏆" },
  { level: 30, targetScore: 11500, moves: 35, label: "ملك المول 👑" },
  { level: 31, targetScore: 11600, moves: 35, label: "مستودع صغير 📦" },
  { level: 32, targetScore: 11900, moves: 35, label: "مستودع متوسط 🏭" },
  { level: 33, targetScore: 12200, moves: 35, label: "مستودع كبير 🏗️" },
  { level: 34, targetScore: 12400, moves: 35, label: "مدير المستودع 📋" },
  { level: 35, targetScore: 12600, moves: 35, label: "خبير التخزين 🔧" },
  { level: 36, targetScore: 12800, moves: 35, label: "أمين المخزن ⚙️" },
  { level: 37, targetScore: 13300, moves: 35, label: "قائد الشحن 🚛" },
  { level: 38, targetScore: 13500, moves: 35, label: "محترف اللوجستيك 🗺️" },
  { level: 39, targetScore: 13900, moves: 35, label: "عملاق التوزيع 💪" },
  { level: 40, targetScore: 14400, moves: 35, label: "سيد المستودع 🏅" },
  { level: 41, targetScore: 14500, moves: 36, label: "سوق الذهب الصغير 💛" },
  { level: 42, targetScore: 14800, moves: 36, label: "تاجر الذهب 🥇" },
  { level: 43, targetScore: 14900, moves: 36, label: "صائد الكنوز 💎" },
  { level: 44, targetScore: 15500, moves: 36, label: "ملك الذهب 👸" },
  { level: 45, targetScore: 15900, moves: 36, label: "أمير الثروة 🤴" },
  { level: 46, targetScore: 16000, moves: 36, label: "حارس الخزينة 🔐" },
  { level: 47, targetScore: 16600, moves: 37, label: "سيد الثروة 💰" },
  { level: 48, targetScore: 17000, moves: 38, label: "إمبراطور الذهب ⚜️" },
  { level: 49, targetScore: 17700, moves: 38, label: "أسطورة الثروة 🌠" },
  { level: 50, targetScore: 18200, moves: 38, label: "قمة الذهب 🏔️" },
  { level: 51, targetScore: 18800, moves: 38, label: "بوابة الإمبراطورية 🏯" },
  { level: 52, targetScore: 19500, moves: 38, label: "قاعة العرش 🎖️" },
  { level: 53, targetScore: 19900, moves: 38, label: "حارس التاج 🛡️" },
  { level: 54, targetScore: 20000, moves: 39, label: "وزير التوفير 📜" },
  { level: 55, targetScore: 21000, moves: 39, label: "قائد الجيش 🎯" },
  { level: 56, targetScore: 21500, moves: 39, label: "أمير الإمبراطورية 👑" },
  { level: 57, targetScore: 22200, moves: 39, label: "حاكم المدينة 🌆" },
  { level: 58, targetScore: 23300, moves: 39, label: "سلطان التوفير 🕌" },
  { level: 59, targetScore: 24400, moves: 40, label: "الإمبراطور الأكبر 🌍" },
  { level: 60, targetScore: 30000, moves: 40, label: "سيد Altawfer الأعظم 🏆" },
];

const WORLDS = [
  { id: 0, name: "🛒 سوق البداية", icon: "🛒", color: "linear-gradient(135deg,#FF6B9D,#A855F7)", startLevel: 0, endLevel: 14 },
  { id: 1, name: "🏬 مول التوفير", icon: "🏬", color: "linear-gradient(135deg,#3B82F6,#06B6D4)", startLevel: 15, endLevel: 29 },
  { id: 2, name: "📦 مستودع الخير", icon: "📦", color: "linear-gradient(135deg,#10B981,#047857)", startLevel: 30, endLevel: 44 },
  { id: 3, name: "💰 سوق الذهب", icon: "💰", color: "linear-gradient(135deg,#F59E0B,#D97706)", startLevel: 45, endLevel: 59 }
];

const MOVES_PURCHASE_COST = 13, MOVES_PURCHASE_AMOUNT = 5, COINS_PER_LEVEL = 5, DAILY_REWARD = 5;
const ADMIN_USER = "admin";

// NEWS TYPES
const NEWS_TYPES = {
  sale: { bg: "linear-gradient(135deg,#FF4444,#CC0000)", icon: "🏷️", label: "عرض خاص", color: "#FF4444" },
  new: { bg: "linear-gradient(135deg,#10B981,#047857)", icon: "🆕", label: "جديد", color: "#10B981" },
  event: { bg: "linear-gradient(135deg,#A855F7,#7C3AED)", icon: "🎪", label: "فعالية", color: "#A855F7" },
  offer: { bg: "linear-gradient(135deg,#FF9800,#F59E0B)", icon: "🎁", label: "عرض", color: "#FF9800" },
  limited: { bg: "linear-gradient(135deg,#FF6B9D,#EC4899)", icon: "⏰", label: "عرض محدود", color: "#FF6B9D" },
  boost: { bg: "linear-gradient(135deg,#FFD700,#FFB300)", icon: "⚡", label: "مضاعفة", color: "#FFD700" },
  delivery: { bg: "linear-gradient(135deg,#00BCD4,#0284C7)", icon: "🚚", label: "توصيل", color: "#00BCD4" },
  announcement: { bg: "linear-gradient(135deg,#3B82F6,#1D4ED8)", icon: "📢", label: "إعلان", color: "#3B82F6" }
};

const AVAILABLE_ICONS = ["📰", "🎉", "🍌", "🍚", "🫙", "🧴", "📦", "⭐", "💎", "🎁", "🏷️", "🚚", "📢", "⚡", "⏰", "🆕"];

function canClaimDaily(lastDailyDate) {
  if (!lastDailyDate) return true;
  return new Date(lastDailyDate).toDateString() !== new Date().toDateString();
}

function timeUntilNextDaily() {
  const now = new Date(), tom = new Date(now);
  tom.setDate(tom.getDate() + 1); tom.setHours(0, 0, 0, 0);
  const d = tom - now;
  return `${Math.floor(d / 3600000)}س ${Math.floor((d % 3600000) / 60000)}د`;
}

function findMatchesAndBombs(b) {
  const matchSet = new Set(); const bombPositions = [];
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      if (!b[r][c] || BOMBS.includes(b[r][c])) { c++; continue; }
      let len = 1;
      while (c + len < COLS && b[r][c + len] === b[r][c]) len++;
      if (len >= 4) {
        const mid = c + Math.floor(len / 2);
        bombPositions.push({ r, c: mid, type: BOMB });
        for (let i = 0; i < len; i++) if (c + i !== mid) matchSet.add(`${r},${c + i}`);
      } else if (len === 3) { for (let i = 0; i < 3; i++) matchSet.add(`${r},${c + i}`); }
      c += len;
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      if (!b[r][c] || BOMBS.includes(b[r][c])) { r++; continue; }
      let len = 1;
      while (r + len < ROWS && b[r + len][c] === b[r][c]) len++;
      if (len >= 4) {
        const mid = r + Math.floor(len / 2);
        bombPositions.push({ r: mid, c, type: VBOMB });
        for (let i = 0; i < len; i++) if (r + i !== mid) matchSet.add(`${r + i},${c}`);
      } else if (len === 3) { for (let i = 0; i < 3; i++) matchSet.add(`${r + i},${c}`); }
      r += len;
    }
  }
  return { matches: [...matchSet].map(k => { const [r, c] = k.split(","); return [+r, +c]; }), bombPositions };
}

function findMatches(b) { return findMatchesAndBombs(b).matches; }

function explodeBombs(b) {
  const nb = b.map(r => [...r]);
  const rows = new Set(), cols = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (nb[r][c] === BOMB) rows.add(r);
    if (nb[r][c] === VBOMB) cols.add(c);
  }
  if (!rows.size && !cols.size) return { board: nb, explodedRows: [], explodedCols: [] };
  rows.forEach(r => { for (let c = 0; c < COLS; c++) nb[r][c] = null; });
  cols.forEach(c => { for (let r = 0; r < ROWS; r++) nb[r][c] = null; });
  return { board: nb, explodedRows: [...rows], explodedCols: [...cols] };
}

function createBoard() {
  let b;
  do {
    b = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)]));
  } while (findMatches(b).length > 0);
  return b;
}

function removeMatches(b, m) {
  const nb = b.map(r => [...r]);
  m.forEach(([r, c]) => { nb[r][c] = null; });
  return nb;
}

function placeBombs(b, bombs) {
  const nb = b.map(r => [...r]);
  bombs.forEach(({ r, c, type }) => { nb[r][c] = type; });
  return nb;
}

function dropCandies(b) {
  const nb = b.map(r => [...r]);
  for (let c = 0; c < COLS; c++) {
    let e = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nb[r][c] !== null) {
        nb[e][c] = nb[r][c];
        if (e !== r) nb[r][c] = null;
        e--;
      }
    }
    for (let r = e; r >= 0; r--) nb[r][c] = ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
  }
  return nb;
}

function isAdj(r1, c1, r2, c2) {
  return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
}

function findHint(b) {
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const nb = b.map(row => [...row]);
        [nb[r][c], nb[nr][nc]] = [nb[nr][nc], nb[r][c]];
        if (findMatches(nb).length > 0) return [[r, c], [nr, nc]];
      }
  return null;
}

const CSS = `
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.4);opacity:0.5}100%{transform:scale(0);opacity:0}}
@keyframes comboAnim{0%{transform:scale(0) rotate(-10deg);opacity:0}50%{transform:scale(1.3) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:0}}
@keyframes hintPulse{0%,100%{box-shadow:0 0 10px #FFD700,0 0 20px #FFD700;transform:scale(1)}50%{box-shadow:0 0 20px #FFD700,0 0 40px #FF6B9D;transform:scale(1.18)}}
@keyframes bounceIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
@keyframes coinPop{0%{transform:scale(0) translateY(0);opacity:1}80%{transform:scale(1.4) translateY(-30px);opacity:1}100%{transform:scale(1) translateY(-40px);opacity:0}}
@keyframes bombPulse{0%,100%{box-shadow:0 0 10px #FF4400,0 0 20px #FF8800;transform:scale(1)}50%{box-shadow:0 0 20px #FF4400,0 0 40px #FF8800;transform:scale(1.15)}}
@keyframes bombAppear{0%{transform:scale(0) rotate(-180deg);opacity:0}60%{transform:scale(1.6) rotate(15deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes rowExplode{0%{opacity:1}40%{background:rgba(255,230,0,0.9)}100%{opacity:0;transform:scaleY(0)}}
@keyframes colExplode{0%{opacity:1}40%{background:rgba(0,200,255,0.9)}100%{opacity:0;transform:scaleX(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes slideUp{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 12px rgba(255,215,0,0.4)}50%{box-shadow:0 0 28px rgba(255,215,0,0.9)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.cc{transition:transform 0.15s,box-shadow 0.15s;}.cc:hover{transform:scale(1.08);}
.cc.sel{transform:scale(1.15);box-shadow:0 0 15px #fff,0 0 30px #fff;}
.cc.mat{animation:pop 0.4s forwards;}
.cc.hin{animation:hintPulse 0.6s infinite;border:2px solid #FFD700 !important;}
.cc.is-bomb{animation:bombPulse 1.2s infinite;}
.cc.is-vbomb{animation:bombPulse 1.2s infinite;filter:hue-rotate(160deg);}
.cc.bomb-new{animation:bombAppear 0.6s forwards;}
.cc.row-blast{animation:rowExplode 0.5s forwards;}
.cc.col-blast{animation:colExplode 0.5s forwards;}
.lvbtn{transition:transform 0.15s;}.lvbtn:hover{transform:scale(1.06);}
.coin-anim{animation:coinPop 1s forwards;position:fixed;font-size:1.5rem;pointer-events:none;z-index:200;}
.fade-in{animation:fadeIn 0.4s forwards;}
.shake{animation:shake 0.3s;}
.daily-popup{animation:slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;}
.daily-glow{animation:glow 1.5s infinite;}
.lb-panel{animation:slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;}
.spinner{animation:spin 0.8s linear infinite;display:inline-block;}
input:focus{outline:none;}
.world-tab{transition:all 0.2s;}.world-tab.active{background:linear-gradient(135deg,#FF6B9D,#A855F7) !important;color:#fff !important;box-shadow:0 2px 8px rgba(168,85,247,0.4);}
`;

const BG = { minHeight: "100vh", background: "linear-gradient(135deg,#1a0533 0%,#2d0a5e 50%,#1a0533 100%)", fontFamily: "'Segoe UI',sans-serif" };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "1rem", boxSizing: "border-box", marginBottom: "12px" };
const btnPrimary = { width: "100%", background: "linear-gradient(135deg,#FF6B9D,#A855F7)", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", fontSize: "1rem", fontWeight: 800, cursor: "pointer", marginBottom: "10px" };

export default function App() {
  const [authScreen, setAuthScreen] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authShake, setAuthShake] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [screen, setScreen] = useState("levelSelect");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [board, setBoard] = useState(null);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState([]);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(2);
  const [hintCells, setHintCells] = useState(null);
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [coins, setCoins] = useState(0);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [coinAnimKey, setCoinAnimKey] = useState(0);
  const [notEnoughCoins, setNotEnoughCoins] = useState(false);
  const [explodingRows, setExplodingRows] = useState([]);
  const [explodingCols, setExplodingCols] = useState([]);
  const [newBombKeys, setNewBombKeys] = useState([]);
  const [showBombMsg, setShowBombMsg] = useState("");
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [showDailyPopup, setShowDailyPopup] = useState(false);
  const [dailyCollected, setDailyCollected] = useState(false);
  const [lastDailyDate, setLastDailyDate] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lbData, setLbData] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminData, setAdminData] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState(0);
  
  // SMART BOMB & LUCKY SPIN STATES
  const [smartBombType, setSmartBombType] = useState(null);
  const [showSmartBombMenu, setShowSmartBombMenu] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState(null);
  const [lastSpinDate, setLastSpinDate] = useState(null);

  // NEWS STATES
  const [newsList, setNewsList] = useState([]);
  const [showNewsPanel, setShowNewsPanel] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showNewsEditor, setShowNewsEditor] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    icon: "📰",
    type: "sale",
    link: "",
    expiresIn: 7
  });
  const [newsLoading, setNewsLoading] = useState(false);

  const lv = LEVELS[currentLevel];

  // SPIN REWARDS
  const SPIN_REWARDS = [
    { name: "🪙 50 عملة", value: 50, type: "coins", icon: "🪙", color: "#FFD700" },
    { name: "🪙 20 عملة", value: 20, type: "coins", icon: "🪙", color: "#FFD700" },
    { name: "🪙 10 عملات", value: 10, type: "coins", icon: "🪙", color: "#FFD700" },
    { name: "💣 قنبلة ذكية مجانية", value: "smart_bomb", type: "item", icon: "💣", color: "#FF6B9D" },
    { name: "➕ 5 حركات", value: 5, type: "moves", icon: "⚡", color: "#60a5fa" },
    { name: "💡 تلميح إضافي", value: 1, type: "hint", icon: "💡", color: "#A855F7" },
    { name: "🎁 3 عملات", value: 3, type: "coins", icon: "🪙", color: "#FFD700" },
    { name: "❌ للأسف لا شيء", value: 0, type: "nothing", icon: "😔", color: "#666" },
  ];

  const canSpin = () => {
    if (!lastSpinDate) return true;
    const now = new Date();
    const last = new Date(lastSpinDate);
    return now.toDateString() !== last.toDateString();
  };

  const timeUntilNextSpin = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    return `${Math.floor(diff / 3600000)}س ${Math.floor((diff % 3600000) / 60000)}د`;
  };

  // NEWS FUNCTIONS
  const fetchNews = async () => {
    try {
      const { db } = await getFB();
      const { collection, getDocs, query, orderBy } = db._fns;
      const newsQuery = query(collection(db, "market_news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(newsQuery);
      const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNewsList(news);
    } catch (e) {
      console.error("Error fetching news:", e);
      setNewsList([]);
    }
  };

  const saveNewsToCloud = async (newsData) => {
    try {
      const { db } = await getFB();
      const { collection, addDoc } = db._fns;
      
      const docRef = await addDoc(collection(db, "market_news"), {
        title: newsData.title,
        content: newsData.content,
        icon: newsData.icon || "📰",
        type: newsData.type,
        link: newsData.link || "",
        expiresIn: newsData.expiresIn || 7,
        createdAt: new Date().toISOString(),
        author: loggedUser
      });
      
      return true;
    } catch (e) {
      console.error("Error saving news:", e);
      alert("خطأ في الحفظ: " + e.message);
      return false;
    }
  };

  const deleteNews = async (newsId) => {
    if (!confirm("هل أنت متأكد من حذف هذا الخبر؟")) return;
    try {
      const { db } = await getFB();
      const { deleteDoc, doc } = db._fns;
      await deleteDoc(doc(db, "market_news", newsId));
      await fetchNews();
      playCoin();
      alert("✅ تم حذف الخبر");
    } catch (e) {
      console.error("Error deleting news:", e);
      alert("❌ فشل الحذف: " + e.message);
    }
  };

  const openNewsEditor = () => {
    if (loggedUser === ADMIN_USER) {
      setShowNewsEditor(true);
      setEditingNews(null);
      setNewsForm({ title: "", content: "", icon: "📰", type: "sale", link: "", expiresIn: 7 });
    } else {
      alert("❌ هذه الخاصية متاحة فقط للإدارة!");
    }
  };

  const handleSaveNews = async () => {
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      alert("⚠️ الرجاء إدخال عنوان ومحتوى الخبر");
      return;
    }
    
    setNewsLoading(true);
    
    const success = await saveNewsToCloud({
      ...newsForm,
      id: editingNews?.id
    });
    
    if (success) {
      playWin();
      setShowNewsEditor(false);
      setNewsForm({ title: "", content: "", icon: "📰", type: "sale", link: "", expiresIn: 7 });
      await fetchNews();
      alert("✅ تم نشر الخبر بنجاح!");
    }
    
    setNewsLoading(false);
  };

  useEffect(() => {
    getFB().then(({ auth }) => {
      auth._fns.onAuthStateChanged(auth, async (user) => {
        if (user) {
          const uname = user.email.replace("@market-altawfer.game", "");
          const prof = await fsGetProfile(uname) || { unlockedLevels: 1, coins: 0, bestScore: 0, lastDailyDate: null, lastSpinDate: null };
          setLoggedUser(uname);
          setUnlockedLevels(prof.unlockedLevels || 1);
          setCoins(prof.coins || 0);
          setLastDailyDate(prof.lastDailyDate || null);
          setLastSpinDate(prof.lastSpinDate || null);
          setDailyAvailable(canClaimDaily(prof.lastDailyDate || null));
          fetchNews();
        }
      });
    });
  }, []);

  const saveToCloud = useCallback(async (data) => {
    if (!loggedUser) return;
    await fsSaveProfile(loggedUser, data);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  }, [loggedUser]);

  const triggerShake = () => { setAuthShake(true); setTimeout(() => setAuthShake(false), 400); };

  const handleLogin = async () => {
    const u = username.trim();
    if (!u || !password) { setAuthError("أدخل اسم المستخدم وكلمة المرور"); triggerShake(); return; }
    setAuthLoading(true); setAuthError("");
    try {
      await fbLogin(u, password);
      setUsername(""); setPassword("");
    } catch (e) {
      setAuthError(e.code === "auth/invalid-credential" ? "كلمة المرور غير صحيحة" : "خطأ في تسجيل الدخول");
      triggerShake();
    }
    setAuthLoading(false);
  };

  const handleRegister = async () => {
    const u = username.trim();
    if (!u || !password) { setAuthError("أدخل اسم المستخدم وكلمة المرور"); triggerShake(); return; }
    if (u.length < 3) { setAuthError("اسم المستخدم 3 أحرف على الأقل"); triggerShake(); return; }
    if (password.length < 6) { setAuthError("كلمة المرور 6 أحرف على الأقل"); triggerShake(); return; }
    setAuthLoading(true); setAuthError("");
    try {
      await fbRegister(u, password);
      await fsSaveProfile(u, { username: u, unlockedLevels: 1, coins: 0, bestScore: 0, lastDailyDate: null, createdAt: new Date().toISOString() });
      setUsername(""); setPassword("");
    } catch (e) {
      setAuthError(e.code === "auth/email-already-in-use" ? "اسم المستخدم موجود مسبقاً" : "خطأ في إنشاء الحساب");
      triggerShake();
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await fbLogout();
    setLoggedUser(null);
    setUnlockedLevels(1); setCoins(0); setAuthError("");
  };

  const claimDaily = async () => {
    playCoin();
    const today = new Date().toISOString();
    const newCoins = coins + DAILY_REWARD;
    setCoins(newCoins);
    setLastDailyDate(today);
    setDailyAvailable(false);
    setDailyCollected(true);
    setTimeout(() => setDailyCollected(false), 2500);
    setShowDailyPopup(false);
    await saveToCloud({ coins: newCoins, lastDailyDate: today });
  };

  const openLeaderboard = async () => {
    setShowLeaderboard(true); setLbLoading(true);
    setLbData(await fsGetLeaderboard());
    setLbLoading(false);
  };

  const openAdmin = async () => {
    setShowAdmin(true); setAdminLoading(true);
    try {
      const { db } = await getFB();
      const { collection, getDocs, query, orderBy } = db._fns;
      const snap = await getDocs(query(collection(db, "players"), orderBy("unlockedLevels", "desc")));
      setAdminData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setAdminLoading(false);
  };

  const startLevel = useCallback((idx) => {
    setCurrentLevel(idx); setBoard(createBoard()); setScore(0); setMoves(LEVELS[idx].moves);
    setSelected(null); setAnimating(false); setMatchedCells([]); setHintsLeft(2); setHintCells(null);
    setCombo(0); setNotEnoughCoins(false); setExplodingRows([]); setExplodingCols([]);
    setNewBombKeys([]); setShowBombMsg(""); setScreen("game");
  }, []);

  const buyMoves = () => {
    if (coins < MOVES_PURCHASE_COST) { setNotEnoughCoins(true); setTimeout(() => setNotEnoughCoins(false), 2000); return; }
    const nc = coins - MOVES_PURCHASE_COST;
    setCoins(nc); setMoves(m => m + MOVES_PURCHASE_AMOUNT); playCoin();
    saveToCloud({ coins: nc }); setScreen("game");
  };

  // SMART BOMB FUNCTION
  const smartBomb = useCallback((targetType) => {
    if (animating) return;
    
    let countRemoved = 0;
    let newBoard = board.map(row => 
      row.map(cell => {
        if (cell === targetType && !BOMBS.includes(cell)) {
          countRemoved++;
          return null;
        }
        return cell;
      })
    );
    
    if (countRemoved === 0) return;
    
    playBomb();
    setShowSmartBombMenu(false);
    
    const droppedBoard = dropCandies(newBoard);
    setBoard(droppedBoard);
    setScore(prev => prev + (countRemoved * 15));
    
    setAnimating(true);
    setTimeout(() => {
      processMatches(droppedBoard, 1, score + (countRemoved * 15), moves, lv.targetScore, currentLevel);
    }, 300);
  }, [board, animating, moves, score, currentLevel, lv]);

  // LUCKY SPIN FUNCTION
  const performSpin = async () => {
    if (!canSpin()) {
      alert(`⏳ يمكنك الدوران مرة واحدة يومياً!\nالمتبقي: ${timeUntilNextSpin()}`);
      return;
    }
    
    setWheelSpinning(true);
    playMatch();
    
    const random = Math.random();
    let reward;
    if (random < 0.05) reward = SPIN_REWARDS[0];
    else if (random < 0.15) reward = SPIN_REWARDS[1];
    else if (random < 0.35) reward = SPIN_REWARDS[2];
    else if (random < 0.45) reward = SPIN_REWARDS[3];
    else if (random < 0.55) reward = SPIN_REWARDS[4];
    else if (random < 0.65) reward = SPIN_REWARDS[5];
    else if (random < 0.80) reward = SPIN_REWARDS[6];
    else reward = SPIN_REWARDS[7];
    
    setTimeout(async () => {
      setWheelResult(reward);
      setWheelSpinning(false);
      
      if (reward.type === "coins") {
        const newCoins = coins + reward.value;
        setCoins(newCoins);
        await saveToCloud({ coins: newCoins });
        playCoin();
      } else if (reward.type === "moves" && screen === "game") {
        setMoves(prev => prev + reward.value);
        playCoin();
      } else if (reward.type === "hint") {
        setHintsLeft(prev => prev + reward.value);
        playCoin();
      } else if (reward.type === "item") {
        setSmartBombType("available");
        playWin();
      }
      
      setLastSpinDate(new Date().toISOString());
      await saveToCloud({ lastSpinDate: new Date().toISOString() });
      
      setTimeout(() => setWheelResult(null), 2500);
    }, 2000);
  };

  const processMatches = useCallback((b, cc, rs, ml, ts, li) => {
    const { board: afterBombs, explodedRows, explodedCols } = explodeBombs(b);
    if (explodedRows.length || explodedCols.length) {
      playBomb(); setExplodingRows(explodedRows); setExplodingCols(explodedCols);
      const cells = explodedRows.length * COLS + explodedCols.length * ROWS;
      setTimeout(() => {
        setScore(s => s + cells * 20 * (cc + 1));
        setExplodingRows([]); setExplodingCols([]);
        const b3 = dropCandies(afterBombs);
        setBoard(b3);
        setTimeout(() => processMatches(b3, cc + 1, rs + cells * 20 * (cc + 1), ml, ts, li), 300);
      }, 550);
      return;
    }
    const { matches, bombPositions } = findMatchesAndBombs(b);
    if (!matches.length && !bombPositions.length) {
      setAnimating(false); setMatchedCells([]);
      if (cc > 1) { playCombo(); setCombo(cc); setShowCombo(true); setTimeout(() => setShowCombo(false), 1200); }
      if (rs >= ts) {
        playWin();
        const nc = coins + COINS_PER_LEVEL;
        setCoins(nc); setShowCoinAnim(true); setCoinAnimKey(k => k + 1); setTimeout(() => setShowCoinAnim(false), 1200);
        setTimeout(async () => {
          const next = li + 1;
          const newUnlocked = Math.max(unlockedLevels, next + 1);
          setUnlockedLevels(newUnlocked);
          const prof = await fsGetProfile(loggedUser) || {};
          const updates = { unlockedLevels: newUnlocked, coins: nc };
          if (rs > (prof.bestScore || 0)) updates.bestScore = rs;
          await saveToCloud(updates);
          if (next >= 60) setScreen("win");
          else setScreen("levelUp");
        }, 600);
      } else if (ml <= 0) { playFail(); setTimeout(() => setScreen("gameOver"), 500); }
      return;
    }
    playMatch(); setMatchedCells(matches);
    setTimeout(() => {
      setScore(s => s + matches.length * 10 * (cc + 1));
      let b2 = removeMatches(b, matches);
      if (bombPositions.length) {
        b2 = placeBombs(b2, bombPositions);
        setNewBombKeys(bombPositions.map(({ r, c, type }) => ({ key: `${r},${c}`, type })));
        const hasRow = bombPositions.some(x => x.type === BOMB), hasCol = bombPositions.some(x => x.type === VBOMB);
        setShowBombMsg(hasRow && hasCol ? "both" : hasRow ? "row" : "col");
        setTimeout(() => { setNewBombKeys([]); setShowBombMsg(""); }, 1400);
      }
      const b3 = dropCandies(b2); setBoard(b3); setMatchedCells([]);
      setTimeout(() => processMatches(b3, cc + 1, rs + matches.length * 10 * (cc + 1), ml, ts, li), 400);
    }, 400);
  }, [coins, unlockedLevels, loggedUser, saveToCloud]);

  const handleCellClick = (r, c) => {
    if (animating || screen !== "game") return;
    if (!selected) { setSelected([r, c]); return; }
    const [sr, sc] = selected;
    if (sr === r && sc === c) { setSelected(null); return; }
    if (isAdj(sr, sc, r, c)) {
      const nb = board.map(row => [...row]);
      [nb[sr][sc], nb[r][c]] = [nb[r][c], nb[sr][sc]];
      if (findMatches(nb).length || nb[sr][sc] === BOMB || nb[r][c] === BOMB || nb[sr][sc] === VBOMB || nb[r][c] === VBOMB) {
        playSwap(); setBoard(nb); setSelected(null);
        const nm = moves - 1; setMoves(nm); setAnimating(true);
        processMatches(nb, 0, score, nm, lv.targetScore, currentLevel);
      } else setSelected(null);
    } else setSelected([r, c]);
  };

  const handleHint = () => {
    if (!hintsLeft || animating) return;
    const hint = findHint(board); if (!hint) return;
    setHintsLeft(h => h - 1); setHintCells(hint); setTimeout(() => setHintCells(null), 2000);
  };

  const isMatched = (r, c) => matchedCells.some(([mr, mc]) => mr === r && mc === c);
  const isSelected = (r, c) => selected && selected[0] === r && selected[1] === c;
  const isHint = (r, c) => hintCells && hintCells.some(([hr, hc]) => hr === r && hc === c);
  const progress = lv ? Math.min(100, Math.round((score / lv.targetScore) * 100)) : 0;

  const CoinBar = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.35)", borderRadius: "20px", padding: "4px 12px", fontSize: "0.85rem", fontWeight: 800, color: "#FFD700" }}>
      🪙 {coins}
    </div>
  );

  const Spinner = () => <span className="spinner">⏳</span>;

  // AUTH SCREEN
  if (!loggedUser) {
    return (
      <div style={{ ...BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <style>{CSS}</style>
        <div className="fade-in" style={{ width: "100%", maxWidth: "340px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, background: "linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 4px 0", textAlign: "center" }}>🛒 Market Altawfer</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", textAlign: "center", margin: "0 0 24px 0" }}>☁️ مدعوم بـ Firebase</p>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "12px", padding: "4px", marginBottom: "20px" }}>
            {["login", "register"].map(s => (
              <button key={s} onClick={() => { setAuthScreen(s); setAuthError(""); }} style={{ flex: 1, background: authScreen === s ? "linear-gradient(135deg,#FF6B9D,#A855F7)" : "transparent", border: "none", borderRadius: "9px", padding: "9px", color: authScreen === s ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "0.9rem", fontWeight: authScreen === s ? 800 : 400, cursor: "pointer", transition: "all 0.2s" }}>
                {s === "login" ? "تسجيل الدخول" : "حساب جديد"}
              </button>
            ))}
          </div>
          <div className={authShake ? "shake" : ""}>
            <input style={inputStyle} placeholder="اسم المستخدم" value={username} onChange={e => { setUsername(e.target.value); setAuthError(""); }} onKeyDown={e => e.key === "Enter" && (authScreen === "login" ? handleLogin() : handleRegister())} />
            <input style={inputStyle} placeholder="كلمة المرور" type="password" value={password} onChange={e => { setPassword(e.target.value); setAuthError(""); }} onKeyDown={e => e.key === "Enter" && (authScreen === "login" ? handleLogin() : handleRegister())} />
            {authError && <div style={{ color: "#FF6B6B", fontSize: "0.82rem", marginBottom: "12px", textAlign: "center", background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.25)", borderRadius: "8px", padding: "8px" }}>⚠️ {authError}</div>}
            <button style={btnPrimary} onClick={authScreen === "login" ? handleLogin : handleRegister} disabled={authLoading}>
              {authLoading ? <Spinner /> : authScreen === "login" ? "🚀 دخول" : "✅ إنشاء الحساب"}
            </button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", textAlign: "center", marginTop: "12px" }}>☁️ بياناتك محفوظة على السحابة • تسجّل من أي جهاز</p>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  if (showAdmin && loggedUser === ADMIN_USER) {
    return (
      <div style={{ ...BG, minHeight: "100vh", overflowY: "auto", padding: "0" }}>
        <style>{CSS}</style>
        <div style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(168,85,247,0.3)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, color: "#A855F7", fontWeight: 900, fontSize: "1.1rem" }}>⚙️ لوحة تحكم Market Altawfer</h2>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>Firebase Firestore • {adminData.length} لاعب</p>
          </div>
          <button onClick={() => setShowAdmin(false)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "6px 14px", color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", cursor: "pointer" }}>← رجوع</button>
        </div>
        {adminLoading ? <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>⏳ جاري التحميل...</div> : (() => {
          const totalPlayers = adminData.length;
          const completedAll = adminData.filter(p => (p.unlockedLevels || 1) > 20).length;
          const totalCoins = adminData.reduce((s, p) => s + (p.coins || 0), 0);
          const avgLevel = totalPlayers ? Math.round(adminData.reduce((s, p) => s + (p.unlockedLevels || 1), 0) / totalPlayers) : 0;
          return (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px", marginBottom: "20px" }}>
                {[
                  { label: "إجمالي اللاعبين", value: totalPlayers, icon: "👥", color: "#A855F7" },
                  { label: "أكملوا كل المراحل", value: completedAll, icon: "🏅", color: "#FFD700" },
                  { label: "متوسط المرحلة", value: `M${avgLevel}`, icon: "📊", color: "#60a5fa" },
                  { label: "إجمالي العملات", value: totalCoins.toLocaleString(), icon: "🪙", color: "#10B981" },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${s.color}33`, borderRadius: "14px", padding: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.6rem", marginBottom: "4px" }}>{s.icon}</div>
                    <div style={{ color: s.color, fontWeight: 900, fontSize: "1.3rem" }}>{s.value}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", marginTop: "2px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "14px", marginBottom: "16px" }}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", marginBottom: "10px", fontWeight: 700 }}>📈 توزيع اللاعبين على المراحل</div>
                {Array.from({ length: Math.min(LEVELS.length, 60) }, (_, i) => {
                  const count = adminData.filter(p => (p.unlockedLevels || 1) === i + 1).length;
                  const pct = totalPlayers ? Math.round(count / totalPlayers * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", minWidth: "24px", textAlign: "right" }}>M{i + 1}</div>
                      <div style={{ flex: 1, height: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "5px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#FF6B9D,#A855F7)", borderRadius: "5px", transition: "width 0.4s" }} />
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", minWidth: "28px" }}>{count}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "8px", fontWeight: 700 }}>
                  <span>اللاعب</span><span style={{ textAlign: "center" }}>المرحلة</span><span style={{ textAlign: "center" }}>أفضل نقطة</span><span style={{ textAlign: "center" }}>عملات</span>
                </div>
                {adminData.map((p, i) => (
                  <div key={p.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "8px", alignItems: "center", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#FF6B9D,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                        {(p.username || p.id)[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}>{p.username || p.id}</div>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.6rem" }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("ar") : "—"}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", color: "#A855F7", fontWeight: 800, fontSize: "0.88rem" }}>M{Math.min(p.unlockedLevels || 1, 20)}</div>
                    <div style={{ textAlign: "center", color: "#FFD700", fontSize: "0.82rem" }}>{(p.bestScore || 0).toLocaleString()}</div>
                    <div style={{ textAlign: "center", color: "#10B981", fontSize: "0.82rem" }}>🪙{p.coins || 0}</div>
                  </div>
                ))}
              </div>
              <button onClick={openAdmin} style={{ marginTop: "12px", width: "100%", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "10px", padding: "10px", color: "#A855F7", fontSize: "0.85rem", cursor: "pointer", fontWeight: 700 }}>
                🔄 تحديث البيانات
              </button>
            </div>
          );
        })()}
      </div>
    );
  }

  // LEVEL SELECT SCREEN
  if (screen === "levelSelect") {
    const currentWorld = WORLDS[selectedWorld];
    const worldLevels = LEVELS.slice(currentWorld.startLevel, currentWorld.endLevel + 1);
    const completedInWorld = worldLevels.filter((_, idx) => currentWorld.startLevel + idx < unlockedLevels - 1).length;
    const randomNewsForToday = newsList.length > 0 ? newsList[Math.floor(Math.random() * newsList.length)] : null;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0533 0%,#2d0a5e 50%,#1a0533 100%)", fontFamily: "'Segoe UI',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", overflowY: "auto" }}>
        <style>{CSS}</style>
        
        {/* Daily popup */}
        {showDailyPopup && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div className="daily-popup" style={{ background: "linear-gradient(135deg,#2d0a5e,#1a0533)", border: "2px solid rgba(255,215,0,0.5)", borderRadius: "24px", padding: "36px 28px", maxWidth: "320px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: "4rem", marginBottom: "8px" }}>🎁</div>
              <h2 style={{ color: "#FFD700", fontSize: "1.6rem", fontWeight: 900, margin: "0 0 6px 0" }}>مكافأتك اليومية!</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: "0 0 20px 0" }}>ارجع كل يوم واحصل على عملات مجانية</p>
              <div className="daily-glow" style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.4)", borderRadius: "16px", padding: "18px", marginBottom: "22px" }}>
                <div style={{ color: "#FFD700", fontSize: "3rem", fontWeight: 900 }}>+{DAILY_REWARD}</div>
                <div style={{ color: "#FFD700", fontSize: "1rem", fontWeight: 700 }}>عملات ذهبية 🪙</div>
              </div>
              <button onClick={claimDaily} style={{ width: "100%", background: "linear-gradient(135deg,#FFD700,#FF9800)", border: "none", borderRadius: "14px", padding: "14px", color: "#1a0533", fontSize: "1.1rem", fontWeight: 900, cursor: "pointer" }}>🎉 استلم المكافأة</button>
            </div>
          </div>
        )}
        
        {dailyCollected && <div style={{ position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 400, background: "linear-gradient(135deg,#FFD700,#FF9800)", borderRadius: "12px", padding: "10px 22px", color: "#1a0533", fontWeight: 900, fontSize: "1rem", animation: "bounceIn 0.4s forwards", whiteSpace: "nowrap" }}>🎁 +{DAILY_REWARD}🪙 تم الاستلام!</div>}
        
        {/* Leaderboard overlay */}
        {showLeaderboard && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div className="lb-panel" style={{ background: "linear-gradient(180deg,#2d0a5e,#1a0533)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: "24px 24px 0 0", padding: "0 0 32px", width: "100%", maxWidth: "480px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, background: "linear-gradient(90deg,#FFD700,#FF9800)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🏆 لائحة المتصدرين</h2>
                <button onClick={() => setShowLeaderboard(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", padding: "5px 12px", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", cursor: "pointer" }}>✕</button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", textAlign: "center", margin: "6px 0" }}>☁️ بيانات حية من Firebase</p>
              <div style={{ overflowY: "auto", padding: "8px 16px", flex: 1 }}>
                {lbLoading ? <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>⏳ جاري التحميل...</div>
                  : lbData.length === 0 ? <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "32px" }}>لا يوجد لاعبون بعد 👀</div>
                  : lbData.map((p, i) => {
                      const medals = ["🥇", "🥈", "🥉"];
                      const isMe = p.id === loggedUser;
                      const rankColor = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "rgba(255,255,255,0.5)";
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", marginBottom: "8px", borderRadius: "14px", background: isMe ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)", border: isMe ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ minWidth: "28px", textAlign: "center", fontSize: i < 3 ? "1.3rem" : "0.9rem", fontWeight: 900, color: rankColor }}>{i < 3 ? medals[i] : `#${i + 1}`}</div>
                          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: isMe ? "linear-gradient(135deg,#FF6B9D,#A855F7)" : "linear-gradient(135deg,#4B5563,#374151)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                            {(p.username || p.id)[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: isMe ? "#C084FC" : "#fff", fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "5px" }}>
                              {p.username || p.id}{isMe && <span style={{ fontSize: "0.62rem", background: "rgba(168,85,247,0.3)", borderRadius: "5px", padding: "1px 5px", color: "#C084FC" }}>أنت</span>}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>أفضل: {(p.bestScore || 0).toLocaleString()}</div>
                          </div>
                          <div style={{ textAlign: "center", flexShrink: 0 }}>
                            <div style={{ color: rankColor, fontWeight: 900, fontSize: "0.95rem" }}>M{Math.min(p.unlockedLevels || 1, 20)}</div>
                          </div>
                          <div style={{ color: "#FFD700", fontSize: "0.82rem", flexShrink: 0 }}>🪙{p.coins || 0}</div>
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>
        )}
        
        {/* Lucky Wheel overlay */}
        {showLuckyWheel && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "linear-gradient(135deg,#1a0533,#2d0a5e)", borderRadius: "32px", padding: "28px 20px", maxWidth: "360px", width: "100%", textAlign: "center", border: "2px solid #FFD700", boxShadow: "0 0 40px rgba(255,215,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, color: "#FFD700", fontSize: "1.4rem" }}>🎡 العجلة المحظوظة</h2>
                <button onClick={() => setShowLuckyWheel(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "4px 12px", color: "#fff", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", marginBottom: "8px" }}>
                {canSpin() ? "🎉 لديك فرصة دوران اليوم!" : `⏳ العودة بعد ${timeUntilNextSpin()}`}
              </p>
              <div style={{ position: "relative", width: "200px", height: "200px", margin: "20px auto", borderRadius: "50%", background: "conic-gradient(from 0deg, #FF6B9D 0deg 45deg, #A855F7 45deg 90deg, #FFD700 90deg 135deg, #10B981 135deg 180deg, #60a5fa 180deg 225deg, #FF9800 225deg 270deg, #FF4444 270deg 315deg, #00BCD4 315deg 360deg)", boxShadow: "0 0 20px rgba(255,215,0,0.5)", transition: wheelSpinning ? "transform 2s cubic-bezier(0.4, 0, 0.2, 1)" : "none", transform: wheelSpinning ? "rotate(1440deg)" : "none" }}>
                <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "20px solid #FFD700", zIndex: 10 }}></div>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "40px", height: "40px", background: "#1a0533", borderRadius: "50%", border: "3px solid #FFD700", zIndex: 5 }}></div>
              </div>
              {!wheelSpinning && !wheelResult && (
                <button onClick={performSpin} disabled={!canSpin()} style={{
                  width: "100%",
                  background: canSpin() ? "linear-gradient(135deg,#FFD700,#FF9800)" : "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px",
                  color: canSpin() ? "#1a0533" : "rgba(255,255,255,0.3)",
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  cursor: canSpin() ? "pointer" : "not-allowed",
                  marginTop: "20px"
                }}>
                  {canSpin() ? "🌀 دوران الآن" : "⏳ انتظر للغد"}
                </button>
              )}
              {wheelResult && (
                <div style={{ marginTop: "20px", animation: "bounceIn 0.6s forwards" }}>
                  <div style={{ fontSize: "3rem" }}>{wheelResult.icon}</div>
                  <div style={{ color: wheelResult.color, fontSize: "1.3rem", fontWeight: 900, marginTop: "8px" }}>
                    {wheelResult.name}
                  </div>
                  <button onClick={() => { setShowLuckyWheel(false); setWheelResult(null); }} style={{
                    background: "rgba(168,85,247,0.3)",
                    border: "1px solid #A855F7",
                    borderRadius: "10px",
                    padding: "8px 20px",
                    color: "#fff",
                    marginTop: "16px",
                    cursor: "pointer"
                  }}>
                    إغلاق ✕
                  </button>
                </div>
              )}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", marginBottom: "8px" }}>🎁 الجوائز الممكنة:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                  {SPIN_REWARDS.slice(0, 5).map(r => (
                    <span key={r.name} style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "20px", color: r.color }}>{r.icon} {r.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* NEWS PANEL */}
        {showNewsPanel && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "linear-gradient(180deg,#1a0533,#2d0a5e)", borderRadius: "28px", maxWidth: "420px", width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "2px solid #00BCD4" }}>
              <div style={{ background: "linear-gradient(135deg,#00BCD4,#0284C7)", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, color: "#fff", fontSize: "1.3rem" }}>📰 أخبار السوبر ماركت</h2>
                  <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.7)", fontSize: "0.7rem" }}>آخر العروض والأخبار</p>
                </div>
                <button onClick={() => { setShowNewsPanel(false); setSelectedNews(null); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "5px 12px", color: "#fff", fontSize: "1rem", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ overflowY: "auto", padding: "16px", flex: 1 }}>
                {newsList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                    📭 لا توجد أخبار حالياً
                    {loggedUser === ADMIN_USER && (
                      <button onClick={openNewsEditor} style={{ display: "block", margin: "16px auto 0", background: "#FF6B9D", border: "none", borderRadius: "10px", padding: "8px 16px", color: "#fff", cursor: "pointer" }}>
                        ✏️ أضف أول خبر الآن
                      </button>
                    )}
                  </div>
                ) : (
                  newsList.map(news => (
                    <div key={news.id} onClick={() => setSelectedNews(news)} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "14px", marginBottom: "12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "2rem" }}>{news.icon || "📰"}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span style={{ background: NEWS_TYPES[news.type]?.bg || "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "2px 8px", fontSize: "0.6rem", fontWeight: 700, color: "#fff" }}>
                              {NEWS_TYPES[news.type]?.icon} {NEWS_TYPES[news.type]?.label}
                            </span>
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{news.title}</span>
                          </div>
                          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", margin: 0 }}>
                            {news.content.length > 80 ? news.content.substring(0, 80) + "..." : news.content}
                          </p>
                        </div>
                        {loggedUser === ADMIN_USER && (
                          <button onClick={(e) => { e.stopPropagation(); deleteNews(news.id); }} style={{ background: "rgba(255,50,50,0.3)", border: "none", borderRadius: "8px", padding: "4px 8px", color: "#FF8888", fontSize: "0.7rem", cursor: "pointer" }}>🗑️</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", margin: 0, textAlign: "center" }}>🛒 عروض حقيقية من سوق التوفير • {newsList.length} خبر</p>
              </div>
            </div>
          </div>
        )}

        {/* NEWS DETAIL MODAL */}
        {selectedNews && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "linear-gradient(135deg,#1a0533,#2d0a5e)", borderRadius: "32px", maxWidth: "340px", width: "100%", padding: "28px", textAlign: "center", border: `2px solid ${NEWS_TYPES[selectedNews.type]?.color || "#00BCD4"}`, animation: "bounceIn 0.4s forwards" }}>
              <div style={{ fontSize: "4rem", marginBottom: "12px" }}>{selectedNews.icon || "📰"}</div>
              <div style={{ display: "inline-block", background: NEWS_TYPES[selectedNews.type]?.bg || "rgba(0,188,212,0.3)", borderRadius: "20px", padding: "4px 12px", fontSize: "0.7rem", fontWeight: 700, marginBottom: "12px" }}>
                {NEWS_TYPES[selectedNews.type]?.icon} {NEWS_TYPES[selectedNews.type]?.label}
              </div>
              <h3 style={{ color: "#FFD700", fontSize: "1.3rem", margin: "0 0 8px 0" }}>{selectedNews.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", margin: "0 0 16px 0" }}>{selectedNews.content}</p>
              {selectedNews.link && (
                <a href={selectedNews.link} target="_blank" rel="noreferrer" style={{ display: "block", background: "linear-gradient(135deg,#FFD700,#FF9800)", borderRadius: "14px", padding: "12px", color: "#1a0533", fontWeight: 800, textDecoration: "none", marginBottom: "12px" }}>
                  🎯 شارك الآن
                </a>
              )}
              <button onClick={() => setSelectedNews(null)} style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "14px", padding: "10px", color: "#fff", cursor: "pointer" }}>
                إغلاق
              </button>
            </div>
          </div>
        )}

        {/* NEWS EDITOR */}
        {showNewsEditor && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "linear-gradient(135deg,#1a0533,#2d0a5e)", borderRadius: "28px", maxWidth: "450px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", border: "2px solid #FFD700" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#FFD700", margin: 0 }}>✏️ كتابة خبر جديد</h2>
                <button onClick={() => setShowNewsEditor(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "5px 12px", color: "#fff", fontSize: "1rem", cursor: "pointer" }}>✕</button>
              </div>
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>🎨 الأيقونة</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {AVAILABLE_ICONS.map(icon => (
                    <button key={icon} onClick={() => setNewsForm({ ...newsForm, icon })} style={{ background: newsForm.icon === icon ? "linear-gradient(135deg,#FFD700,#FF9800)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", padding: "8px", fontSize: "1.3rem", cursor: "pointer", width: "45px" }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>📋 نوع الخبر</label>
                <select value={newsForm.type} onChange={(e) => setNewsForm({ ...newsForm, type: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
                  {Object.entries(NEWS_TYPES).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>📌 العنوان</label>
                <input type="text" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} placeholder="مثال: خصم 50% على جميع المنتجات" style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
              </div>
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>📝 المحتوى</label>
                <textarea value={newsForm.content} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} placeholder="اكتب تفاصيل الخبر هنا..." rows="4" style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", resize: "vertical" }} />
              </div>
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>🔗 رابط (اختياري)</label>
                <input type="text" value={newsForm.link} onChange={(e) => setNewsForm({ ...newsForm, link: e.target.value })} placeholder="https://..." style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>⏰ يبقى للأيام (0 = لا ينتهي)</label>
                <input type="number" value={newsForm.expiresIn} onChange={(e) => setNewsForm({ ...newsForm, expiresIn: parseInt(e.target.value) || 0 })} min="0" max="30" style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleSaveNews} disabled={newsLoading} style={{ flex: 1, background: "linear-gradient(135deg,#10B981,#047857)", border: "none", borderRadius: "14px", padding: "12px", color: "#fff", fontWeight: 700, cursor: newsLoading ? "not-allowed" : "pointer" }}>
                  {newsLoading ? "⏳ جاري النشر..." : "📢 نشر الخبر"}
                </button>
                <button onClick={() => setShowNewsEditor(false)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "14px", padding: "12px 20px", color: "#fff", cursor: "pointer" }}>
                  إلغاء
                </button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", marginTop: "15px", textAlign: "center" }}>✨ الخبر سيظهر فوراً لجميع اللاعبين</p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "400px", marginBottom: "10px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, background: "linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>🛒 Market Altawfer</h1>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={openLeaderboard} style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "10px", padding: "5px 10px", color: "#FFD700", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>🏆</button>
            <button onClick={() => setShowLuckyWheel(true)} style={{ background: "linear-gradient(135deg,#FFD700,#FF9800)", border: "none", borderRadius: "10px", padding: "5px 10px", color: "#1a0533", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>🎡 دوران</button>
            <button onClick={() => setShowNewsPanel(true)} style={{ background: "linear-gradient(135deg,#00BCD4,#0284C7)", border: "none", borderRadius: "10px", padding: "5px 10px", color: "#fff", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>📰 أخبار</button>
            {loggedUser === ADMIN_USER && <button onClick={openNewsEditor} style={{ background: "linear-gradient(135deg,#FF6B9D,#A855F7)", border: "none", borderRadius: "10px", padding: "5px 10px", color: "#fff", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>✏️ كتابة</button>}
            {loggedUser === ADMIN_USER && <button onClick={openAdmin} style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)", borderRadius: "10px", padding: "5px 10px", color: "#A855F7", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>⚙️</button>}
            <CoinBar />
          </div>
        </div>
        
        {/* User bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "400px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "8px 14px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#FF6B9D,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{loggedUser[0].toUpperCase()}</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>{loggedUser}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>{saveIndicator ? "💾 تم الحفظ ✓ " : "☁️ Firebase"}M{Math.min(unlockedLevels, 60)}/{LEVELS.length}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: "rgba(255,50,50,0.12)", border: "1px solid rgba(255,50,50,0.25)", borderRadius: "8px", padding: "5px 12px", color: "rgba(255,100,100,0.9)", fontSize: "0.78rem", cursor: "pointer" }}>خروج</button>
        </div>
        
        {/* Daily card */}
        <div style={{ width: "100%", maxWidth: "400px", marginBottom: "12px" }}>
          {dailyAvailable ? (
            <button onClick={() => setShowDailyPopup(true)} className="daily-glow" style={{ width: "100%", background: "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,150,0,0.1))", border: "2px solid rgba(255,215,0,0.5)", borderRadius: "14px", padding: "11px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ fontSize: "1.8rem" }}>🎁</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#FFD700", fontWeight: 800, fontSize: "0.88rem" }}>مكافأتك اليومية جاهزة!</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem" }}>استلم {DAILY_REWARD}🪙 مجاناً</div>
                </div>
              </div>
              <div style={{ background: "linear-gradient(135deg,#FFD700,#FF9800)", borderRadius: "10px", padding: "5px 12px", color: "#1a0533", fontWeight: 900, fontSize: "0.82rem" }}>استلم</div>
            </button>
          ) : (
            <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ fontSize: "1.4rem", opacity: 0.3 }}>🎁</div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontWeight: 700, fontSize: "0.82rem" }}>المكافأة اليومية</div>
                  <div style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.66rem" }}>تعود بعد {timeUntilNextDaily()}</div>
                </div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.75rem" }}>✓ تم</div>
            </div>
          )}
        </div>

        {/* Random News Card */}
        {randomNewsForToday && (
          <div onClick={() => setSelectedNews(randomNewsForToday)} style={{ width: "100%", maxWidth: "400px", marginBottom: "12px", background: NEWS_TYPES[randomNewsForToday.type]?.bg || "linear-gradient(135deg,#2d0a5e,#1a0533)", borderRadius: "14px", padding: "10px 16px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "1.8rem" }}>{randomNewsForToday.icon || "📰"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "2px 8px", fontSize: "0.6rem", fontWeight: 700 }}>
                    {NEWS_TYPES[randomNewsForToday.type]?.icon} {NEWS_TYPES[randomNewsForToday.type]?.label}
                  </span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem" }}>{randomNewsForToday.title}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", margin: "4px 0 0 0" }}>{randomNewsForToday.content.substring(0, 50)}...</p>
              </div>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>📖</div>
            </div>
          </div>
        )}
        
        <p style={{ color: "rgba(255,215,0,0.65)", fontSize: "0.75rem", margin: "0 0 12px 0", background: "rgba(255,100,0,0.08)", border: "1px solid rgba(255,100,0,0.18)", borderRadius: "10px", padding: "4px 12px" }}>
          💣 4 متتالية أفقياً = قنبلة تدمر الصف • 🧨 4 متتالية عمودياً = قنبلة تدمر العمود
        </p>
        
        {/* World Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "20px", maxWidth: "400px" }}>
          {WORLDS.map((world, idx) => {
            const worldLevelsCount = world.endLevel - world.startLevel + 1;
            const completed = LEVELS.slice(world.startLevel, world.endLevel + 1).filter((_, i) => world.startLevel + i < unlockedLevels - 1).length;
            return (
              <button key={world.id} onClick={() => setSelectedWorld(idx)} className={`world-tab ${selectedWorld === idx ? "active" : ""}`} style={{
                padding: "10px 16px",
                borderRadius: "30px",
                background: selectedWorld === idx ? "linear-gradient(135deg,#FF6B9D,#A855F7)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: selectedWorld === idx ? "#fff" : "rgba(255,255,255,0.7)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>{world.icon}</span>
                <span>{world.name.split(" ")[1] || world.name}</span>
                <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>({completed}/{worldLevelsCount})</span>
              </button>
            );
          })}
        </div>
        
        {/* Current World Info */}
        <div style={{ background: currentWorld.color, borderRadius: "16px", padding: "12px 20px", marginBottom: "16px", textAlign: "center", width: "100%", maxWidth: "400px" }}>
          <div style={{ fontSize: "2rem" }}>{currentWorld.icon}</div>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: "1.1rem" }}>{currentWorld.name}</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.75rem", marginTop: "4px" }}>
            أكملت {completedInWorld} من {worldLevels.length} مرحلة
          </div>
          <div style={{ height: "6px", background: "rgba(0,0,0,0.3)", borderRadius: "99px", marginTop: "8px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(completedInWorld / worldLevels.length) * 100}%`, background: "rgba(255,255,255,0.8)", borderRadius: "99px" }} />
          </div>
        </div>
        
        {/* Level Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", width: "100%", maxWidth: "400px", padding: "20px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "15px" }}>
          {worldLevels.map((level, idx) => {
            const globalIdx = currentWorld.startLevel + idx;
            const locked = globalIdx >= unlockedLevels;
            const done = globalIdx < unlockedLevels - 1;
            return (
              <div key={globalIdx} className="lvbtn" onClick={() => !locked && startLevel(globalIdx)} style={{
                background: locked ? "rgba(255,255,255,0.04)" : done ? "linear-gradient(135deg,#10B981,#047857)" : "linear-gradient(135deg,#FF6B9D,#A855F7)",
                border: locked ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(255,255,255,0.2)",
                borderRadius: "14px",
                padding: "12px 6px",
                textAlign: "center",
                cursor: locked ? "not-allowed" : "pointer",
                opacity: locked ? 0.4 : 1,
                boxShadow: locked ? "none" : "0 4px 14px rgba(168,85,247,0.3)"
              }}>
                <div style={{ fontSize: "1.3rem", marginBottom: "3px" }}>{locked ? "🔒" : done ? "✅" : "▶️"}</div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>{level.level}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.58rem" }}>{level.moves} حركة</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.55rem" }}>{level.targetScore}⭐</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // GAME OVER SCREEN
  if (screen === "gameOver") {
    return (
      <div style={{ ...BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <div style={{ textAlign: "center", padding: "32px 24px", maxWidth: "340px", width: "100%" }}>
          <div style={{ fontSize: "4rem", marginBottom: "10px" }}>😔</div>
          <h2 style={{ color: "#FF4444", fontSize: "2rem", margin: "0 0 6px 0", fontWeight: 900 }}>انتهت الحركات!</h2>
          <p style={{ color: "rgba(255,255,255,0.65)", margin: "0 0 4px 0" }}>المرحلة {currentLevel + 1} — {lv.label}</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.88rem", margin: "0 0 18px 0" }}>وصلت: <span style={{ color: "#FF6B9D", fontWeight: 800 }}>{score}</span> / {lv.targetScore}</p>
          <div style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "14px", padding: "12px", marginBottom: "14px" }}>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginBottom: "4px" }}>رصيدك</div>
            <div style={{ color: "#FFD700", fontSize: "1.6rem", fontWeight: 900 }}>🪙 {coins}</div>
          </div>
          <button onClick={buyMoves} disabled={coins < MOVES_PURCHASE_COST} style={{ width: "100%", background: coins >= MOVES_PURCHASE_COST ? "linear-gradient(135deg,#FFD700,#FF9800)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: "14px", padding: "13px", color: coins >= MOVES_PURCHASE_COST ? "#1a0533" : "rgba(255,255,255,0.25)", fontSize: "1rem", fontWeight: 800, cursor: coins >= MOVES_PURCHASE_COST ? "pointer" : "not-allowed", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            ➕ شراء {MOVES_PURCHASE_AMOUNT} حركات <span style={{ background: "rgba(0,0,0,0.15)", borderRadius: "8px", padding: "2px 10px" }}>🪙{MOVES_PURCHASE_COST}</span>
          </button>
          {notEnoughCoins && <div style={{ color: "#FF4444", fontSize: "0.8rem", marginBottom: "10px", fontWeight: 700 }}>❌ رصيد غير كافٍ!</div>}
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.68rem", marginBottom: "14px" }}>تكسب {COINS_PER_LEVEL}🪙 عند إكمال كل مرحلة</div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={() => startLevel(currentLevel)} style={{ background: "linear-gradient(135deg,#FF6B9D,#A855F7)", border: "none", borderRadius: "14px", padding: "11px 20px", color: "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>🔄 مجدداً</button>
            <button onClick={() => setScreen("levelSelect")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "14px", padding: "11px 20px", color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", cursor: "pointer" }}>🗺️ المراحل</button>
          </div>
        </div>
      </div>
    );
  }

  // LEVEL UP SCREEN
  if (screen === "levelUp") {
    return (
      <div style={{ ...BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        {showCoinAnim && <div key={coinAnimKey} className="coin-anim" style={{ top: "30%", left: "48%" }}>+{COINS_PER_LEVEL}🪙</div>}
        <div style={{ animation: "bounceIn 0.6s forwards", textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "5rem", marginBottom: "12px" }}>🎉</div>
          <h2 style={{ color: "#FFD700", fontSize: "2.2rem", margin: "0 0 8px 0", fontWeight: 900 }}>أحسنت!</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: "0 0 4px 0" }}>أكملت المرحلة {currentLevel + 1}</p>
          <p style={{ color: "#FF6B9D", fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>نقاطك: {score}</p>
          <div style={{ color: "#FFD700", fontWeight: 700, marginBottom: "6px" }}>🪙 +{COINS_PER_LEVEL} عملات! (رصيدك: {coins})</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", marginBottom: "18px" }}>☁️ تم الحفظ على Firebase</div>
          <a href="https://forms.gle/oZPFpUAzmtm7Srvo8" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginBottom: "18px", background: "linear-gradient(135deg,#10B981,#047857)", borderRadius: "14px", padding: "11px 28px", color: "#fff", fontSize: "0.95rem", fontWeight: 700, textDecoration: "none" }}>📝 سجّل اسمك</a>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => startLevel(currentLevel + 1)} style={{ background: "linear-gradient(135deg,#FF6B9D,#A855F7)", border: "none", borderRadius: "14px", padding: "12px 28px", color: "#fff", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>▶️ المرحلة {currentLevel + 2}</button>
            <button onClick={() => setScreen("levelSelect")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "14px", padding: "12px 28px", color: "rgba(255,255,255,0.8)", fontSize: "1rem", cursor: "pointer" }}>🗺️ المراحل</button>
          </div>
        </div>
      </div>
    );
  }

  // WIN SCREEN
  if (screen === "win") {
    return (
      <div style={{ ...BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <div style={{ animation: "bounceIn 0.6s forwards", textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "5rem", marginBottom: "12px" }}>🏅</div>
          <h2 style={{ color: "#FFD700", fontSize: "2.2rem", margin: "0 0 8px 0", fontWeight: 900 }}>سيد Altawfer! 🎊</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem", margin: "0 0 4px 0" }}>أكملت جميع المراحل الـ {LEVELS.length}!</p>
          <div style={{ color: "#FFD700", fontWeight: 700, marginBottom: "16px" }}>🪙 رصيدك: {coins}</div>
          <a href="https://forms.gle/oZPFpUAzmtm7Srvo8" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginBottom: "16px", background: "linear-gradient(135deg,#FFD700,#FF6B9D)", borderRadius: "14px", padding: "14px 36px", color: "#1a0533", fontSize: "1.1rem", fontWeight: 800, textDecoration: "none" }}>🏆 سجّل اسمك كبطل!</a><br />
          <button onClick={() => setScreen("levelSelect")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "14px", padding: "10px 28px", color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}>🗺️ المراحل</button>
        </div>
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0533 0%,#2d0a5e 50%,#1a0533 100%)", fontFamily: "'Segoe UI',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>
      {showCoinAnim && <div key={coinAnimKey} className="coin-anim" style={{ top: "15%", left: "50%" }}>+{COINS_PER_LEVEL}🪙</div>}
      {showBombMsg && <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", zIndex: 100, fontWeight: 900, animation: "comboAnim 1.2s forwards", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        {(showBombMsg === "row" || showBombMsg === "both") && <div style={{ fontSize: "2rem", color: "#FF4400", textShadow: "0 0 20px #FF8800" }}>💣 قنبلة صف!</div>}
        {(showBombMsg === "col" || showBombMsg === "both") && <div style={{ fontSize: "2rem", color: "#00CFFF", textShadow: "0 0 20px #00CFFF" }}>🧨 قنبلة عمود!</div>}
      </div>}
      {saveIndicator && <div style={{ position: "fixed", top: "10px", right: "12px", zIndex: 200, background: "rgba(16,185,129,0.9)", borderRadius: "8px", padding: "4px 12px", color: "#fff", fontSize: "0.72rem", fontWeight: 700 }}>☁️ تم الحفظ ✓</div>}
      
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", width: "100%", maxWidth: "390px", justifyContent: "space-between" }}>
        <button onClick={() => setScreen("levelSelect")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", padding: "6px 12px", color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", cursor: "pointer" }}>🗺️</button>
        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>👤 {loggedUser}</span>
        <CoinBar />
      </div>
      
      <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "12px", padding: "5px 18px", marginBottom: "10px", color: "#A855F7", fontWeight: 700, fontSize: "0.82rem" }}>
        المرحلة {currentLevel + 1}/{LEVELS.length} — {lv.label}
      </div>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
        {[{ label: "النقاط", value: score, color: "#FFD700" }, { label: "الهدف", value: lv.targetScore, color: "#10B981" }, { label: "الحركات", value: moves, color: moves <= 5 ? "#FF4444" : "#60a5fa" }].map(({ label, value, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "6px 12px", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.62rem", marginBottom: "2px" }}>{label}</div>
            <div style={{ color, fontSize: "1.1rem", fontWeight: 800 }}>{value}</div>
          </div>
        ))}
      </div>
      
      <div style={{ width: "100%", maxWidth: "390px", height: "9px", background: "rgba(255,255,255,0.1)", borderRadius: "99px", marginBottom: "10px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: progress + "%", background: "linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)", borderRadius: "99px", transition: "width 0.4s" }} />
      </div>
      
      {showCombo && <div style={{ position: "fixed", top: "25%", left: "50%", transform: "translateX(-50%)", zIndex: 100, fontSize: "3rem", fontWeight: 900, color: "#FFD700", textShadow: "0 0 20px #FF6B9D", animation: "comboAnim 1.2s forwards", pointerEvents: "none" }}>🔥 COMBO x{combo}!</div>}
      
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: "3px", background: "rgba(255,255,255,0.05)", border: "2px solid rgba(168,85,247,0.4)", borderRadius: "18px", padding: "10px", boxShadow: "0 0 40px rgba(168,85,247,0.3),inset 0 0 30px rgba(0,0,0,0.3)" }}>
        {board && board.map((row, r) => row.map((candy, c) => {
          const mat = isMatched(r, c), sel = isSelected(r, c), hin = isHint(r, c);
          const isBomb = candy === BOMB, isVBomb = candy === VBOMB, isAnyBomb = isBomb || isVBomb;
          const rowBlasting = explodingRows.includes(r), colBlasting = explodingCols.includes(c);
          const newBombObj = newBombKeys.find(x => x.key === `${r},${c}`);
          const bg = candy && COLORS[candy] ? COLORS[candy] : "transparent";
          let cls = "cc";
          if (sel) cls += " sel"; if (mat) cls += " mat"; if (hin) cls += " hin";
          if (isBomb && !rowBlasting) cls += " is-bomb"; if (isVBomb && !colBlasting) cls += " is-vbomb";
          if (newBombObj) cls += " bomb-new";
          if (rowBlasting) cls += " row-blast"; else if (colBlasting) cls += " col-blast";
          const cellBg = isBomb ? "radial-gradient(circle at 35% 35%,#FF9900 0%,#FF3300 55%,#880000 100%)" : isVBomb ? "radial-gradient(circle at 35% 35%,#00EEFF 0%,#0077FF 55%,#003399 100%)" : rowBlasting ? "rgba(255,200,0,0.9)" : colBlasting ? "rgba(0,200,255,0.9)" : sel ? `radial-gradient(circle,#fff 0%,${bg} 60%)` : `radial-gradient(circle at 35% 35%,rgba(255,255,255,0.5) 0%,${bg} 55%,rgba(0,0,0,0.2) 100%)`;
          return (
            <div key={`${r}-${c}`} className={cls} onClick={() => handleCellClick(r, c)} style={{ width: "42px", height: "42px", borderRadius: "10px", background: cellBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isAnyBomb ? "1.5rem" : "1.3rem", cursor: "pointer", userSelect: "none", boxShadow: isBomb ? "0 0 12px #FF4400,0 4px 8px rgba(0,0,0,0.5)" : isVBomb ? "0 0 12px #00CFFF,0 4px 8px rgba(0,0,0,0.5)" : sel ? "0 0 12px #fff,0 4px 8px rgba(0,0,0,0.4)" : "0 3px 6px rgba(0,0,0,0.3)", border: isBomb ? "2px solid #FF6600" : isVBomb ? "2px solid #00EEFF" : sel ? "2px solid #fff" : "1px solid rgba(255,255,255,0.15)", transition: "all 0.15s" }}>
              {candy}
            </div>
          );
        }))}
      </div>
      
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <button onClick={() => startLevel(currentLevel)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", padding: "7px 16px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", cursor: "pointer" }}>🔄 إعادة</button>
        <button onClick={handleHint} disabled={!hintsLeft || animating} style={{ background: hintsLeft ? "linear-gradient(135deg,#FFD700,#FF6B9D)" : "rgba(255,255,255,0.05)", border: hintsLeft ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "7px 16px", color: hintsLeft ? "#1a0533" : "rgba(255,255,255,0.3)", fontSize: "0.85rem", fontWeight: 700, cursor: hintsLeft ? "pointer" : "not-allowed" }}>
          💡 ({hintsLeft}/2)
        </button>
        <button onClick={() => smartBombType === "available" ? setShowSmartBombMenu(true) : (coins >= 5 ? setShowSmartBombMenu(true) : setNotEnoughCoins(true))} disabled={smartBombType !== "available" && coins < 5} style={{ background: (smartBombType === "available" || coins >= 5) ? "linear-gradient(135deg,#FF4444,#FF8800)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: "12px", padding: "7px 16px", color: (smartBombType === "available" || coins >= 5) ? "#fff" : "rgba(255,255,255,0.3)", fontSize: "0.85rem", fontWeight: 700, cursor: (smartBombType === "available" || coins >= 5) ? "pointer" : "not-allowed" }}>
          💣 قنبلة ({smartBombType === "available" ? "مجانية" : "5🪙"})
        </button>
      </div>
      
      {notEnoughCoins && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.9)", color: "#FF4444", padding: "12px 24px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 700, zIndex: 500, animation: "bounceIn 0.3s forwards" }}>
          ❌ رصيد غير كافٍ! تحتاج 5 عملات للقنبلة
        </div>
      )}
      
      {/* Smart Bomb Menu */}
      {showSmartBombMenu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "linear-gradient(135deg,#2d0a5e,#1a0533)", borderRadius: "24px", padding: "24px", maxWidth: "320px", width: "90%", textAlign: "center", border: "2px solid #FF6B9D" }}>
            <h3 style={{ color: "#FFD700", margin: "0 0 12px 0" }}>💣 اختر نوع القنبلة</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", marginBottom: "16px" }}>💰 السعر: 5 عملات فقط! (ستدمر كل الحلوى من نوع واحد)</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "20px" }}>
              {ALL_TYPES.map(type => (
                <button key={type} onClick={() => {
                  if (smartBombType === "available") {
                    smartBomb(type);
                    setSmartBombType(null);
                  } else if (coins >= 5) {
                    setCoins(coins - 5);
                    smartBomb(type);
                    saveToCloud({ coins: coins - 5 });
                  } else {
                    setNotEnoughCoins(true);
                    setTimeout(() => setNotEnoughCoins(false), 2000);
                  }
                }} style={{ background: COLORS[type], border: "none", borderRadius: "12px", padding: "12px", fontSize: "1.5rem", cursor: "pointer", transition: "transform 0.1s" }}>
                  {type}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSmartBombMenu(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", padding: "8px 20px", color: "#fff", cursor: "pointer" }}>إلغاء</button>
          </div>
        </div>
      )}
      
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.65rem", marginTop: "8px", textAlign: "center" }}>4 متتالية أفقياً = قنبلة صف • 4 متتالية عمودياً = قنبلة عمود</p>
    </div>
  );
}
