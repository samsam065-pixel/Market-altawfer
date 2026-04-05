import { useState, useCallback, useEffect } from "react";

// ======= Firebase SDK (loaded via CDN globals) =======
const FB_CONFIG = {
  apiKey: "AIzaSyC1XsjEakrMPBYru8j8zM2Y1rUbHrRPh8A",
  authDomain: "market-altawfer.firebaseapp.com",
  projectId: "market-altawfer",
  storageBucket: "market-altawfer.firebasestorage.app",
  messagingSenderId: "956981319308",
  appId: "1:956981319308:web:e0d16a4c1427834a830da9",
};

// Lazy init Firebase
let _app=null, _db=null, _auth=null;
async function getFB(){
  if(_db) return {db:_db,auth:_auth};
  const {initializeApp,getApps}=await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const {getFirestore,doc,getDoc,setDoc,updateDoc,collection,getDocs,query,orderBy,limit}=await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged}=await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  _app = getApps().length?getApps()[0]:initializeApp(FB_CONFIG);
  _db  = getFirestore(_app);
  _auth= getAuth(_app);
  // attach helpers
  _db._fns={doc,getDoc,setDoc,updateDoc,collection,getDocs,query,orderBy,limit};
  _auth._fns={createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged};
  return {db:_db,auth:_auth};
}

// ======= Firestore helpers =======
async function fsGetProfile(username){
  try{
    const{db}=await getFB();
    const{doc,getDoc}=db._fns;
    const snap=await getDoc(doc(db,"players",username));
    return snap.exists()?snap.data():null;
  }catch(e){console.error("fsGetProfile",e);return null;}
}
async function fsSaveProfile(username,data){
  try{
    const{db}=await getFB();
    const{doc,setDoc}=db._fns;
    await setDoc(doc(db,"players",username),data,{merge:true});
  }catch(e){console.error("fsSaveProfile",e);}
}
async function fsGetLeaderboard(){
  try{
    const{db}=await getFB();
    const{collection,getDocs}=db._fns;
    const snap=await getDocs(collection(db,"players"));
    if(snap.empty) return [];
    const all=snap.docs.map(d=>{
      const data=d.data();
      return {
        id:d.id,
        username:data.username||d.id,
        unlockedLevels:Number(data.unlockedLevels)||1,
        bestScore:Number(data.bestScore)||0,
        coins:Number(data.coins)||0,
      };
    });
    return all.sort((a,b)=>
      b.unlockedLevels-a.unlockedLevels||b.bestScore-a.bestScore
    ).slice(0,10);
  }catch(e){
    console.error("fsGetLeaderboard error:",e);
    return[];
  }
}

// ======= Firebase Auth helpers =======
async function fbRegister(username,password){
  const email=`${username}@market-altawfer.game`;
  const{auth}=await getFB();
  const{createUserWithEmailAndPassword}=auth._fns;
  const cred=await createUserWithEmailAndPassword(auth,email,password);
  return cred.user;
}
async function fbLogin(username,password){
  const email=`${username}@market-altawfer.game`;
  const{auth}=await getFB();
  const{signInWithEmailAndPassword}=auth._fns;
  const cred=await signInWithEmailAndPassword(auth,email,password);
  return cred.user;
}
async function fbLogout(){
  const{auth}=await getFB();
  const{signOut}=auth._fns;
  await signOut(auth);
}

// ======= Audio =======
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;
function getCtx(){if(!ctx)ctx=new AudioCtx();return ctx;}
function playSwap(){const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(520,c.currentTime);o.frequency.exponentialRampToValueAtTime(780,c.currentTime+0.1);g.gain.setValueAtTime(0.3,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15);o.start();o.stop(c.currentTime+0.15);}
function playMatch(){const c=getCtx();[0,0.07,0.14].forEach((t,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="triangle";o.frequency.setValueAtTime([440,550,660][i],c.currentTime+t);g.gain.setValueAtTime(0.25,c.currentTime+t);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+t+0.15);o.start(c.currentTime+t);o.stop(c.currentTime+t+0.15);});}
function playWin(){const c=getCtx(),notes=[523,659,784,1047];notes.forEach((freq,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(freq,c.currentTime+i*0.12);g.gain.setValueAtTime(0.3,c.currentTime+i*0.12);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.3);o.start(c.currentTime+i*0.12);o.stop(c.currentTime+i*0.12+0.3);});}
function playFail(){const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sawtooth";o.frequency.setValueAtTime(300,c.currentTime);o.frequency.exponentialRampToValueAtTime(100,c.currentTime+0.4);g.gain.setValueAtTime(0.2,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);o.start();o.stop(c.currentTime+0.4);}
function playCombo(){const c=getCtx(),notes=[784,988,1175,1568];notes.forEach((freq,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.setValueAtTime(freq,c.currentTime+i*0.08);g.gain.setValueAtTime(0.15,c.currentTime+i*0.08);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.08+0.12);o.start(c.currentTime+i*0.08);o.stop(c.currentTime+i*0.08+0.12);});}
function playCoin(){const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(880,c.currentTime);o.frequency.exponentialRampToValueAtTime(1320,c.currentTime+0.08);g.gain.setValueAtTime(0.3,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.2);o.start();o.stop(c.currentTime+0.2);}
function playBomb(){const c=getCtx();const buf=c.createBuffer(1,c.sampleRate*0.5,c.sampleRate);const data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(c.sampleRate*0.08));const src=c.createBufferSource();src.buffer=buf;const g=c.createGain();src.connect(g);g.connect(c.destination);g.gain.setValueAtTime(0.7,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.5);src.start();src.stop(c.currentTime+0.5);}

// ======= Constants =======
const COLS=8,ROWS=8;
const ALL_TYPES=["🍚","🌾","🫙","🧴","🍦","🍌"];
const BOMB="💣", VBOMB="🧨", BOMBS=[BOMB,VBOMB];
const COLORS={"🍚":"#E8F5E9","🌾":"#D4A017","🫙":"#FFD700","🧴":"#00BCD4","🍦":"#FCE4EC","🍌":"#FFF176"};
const LEVELS=[
  {level:1,targetScore:200,moves:35,label:"سوق البداية 🛒"},
  {level:2,targetScore:350,moves:35,label:"المتسوق الجديد 🧺"},
  {level:3,targetScore:500,moves:35,label:"عروض الأسبوع 🏷️"},
  {level:4,targetScore:700,moves:35,label:"خصومات كبيرة 💰"},
  {level:5,targetScore:900,moves:35,label:"مخزن التوفير 📦"},
  {level:6,targetScore:1150,moves:30,label:"المتسوق الماهر 🎯"},
  {level:7,targetScore:1400,moves:30,label:"صياد الصفقات 🦅"},
  {level:8,targetScore:1700,moves:30,label:"ملك السوق 👑"},
  {level:9,targetScore:2000,moves:30,label:"بطل التوفير 🏆"},
  {level:10,targetScore:2400,moves:30,label:"خبير الأسواق 🌟"},
  {level:11,targetScore:2800,moves:25,label:"عاصفة المنتجات ⚡"},
  {level:12,targetScore:3300,moves:25,label:"تحدي التوفير 🔥"},
  {level:13,targetScore:3900,moves:25,label:"أسطورة السوق 🌠"},
  {level:14,targetScore:4600,moves:25,label:"الأستاذ الكبير 💎"},
  {level:15,targetScore:5500,moves:25,label:"سيد Altawfer 🏅"},
  {level:16,targetScore:6000,moves:25,label:"محترف التسوق 🔱"},
  {level:17,targetScore:7000,moves:25,label:"أمير السوق 👸"},
  {level:18,targetScore:7500,moves:25,label:"عملاق الأسواق 🦁"},
  {level:19,targetScore:8500,moves:25,label:"أسطورة التوفير 🌋"},
  {level:20,targetScore:9500,moves:25,label:"إمبراطور Altawfer 🏯"},
{level:21,targetScore:10000,moves:25,label:"بوابة المول 🏬"},
{level:22,targetScore:11000,moves:25,label:"عروض المول 🎪"},
{level:23,targetScore:12000,moves:25,label:"متاجر الأزياء 👗"},
{level:24,targetScore:13500,moves:25,label:"مطاعم المول 🍽️"},
{level:25,targetScore:15000,moves:25,label:"سينما المول 🎬"},
{level:26,targetScore:16500,moves:25,label:"ألعاب المول 🎮"},
{level:27,targetScore:18000,moves:25,label:"مجوهرات المول 💍"},
{level:28,targetScore:20000,moves:25,label:"VIP المول 🌟"},
{level:29,targetScore:22000,moves:25,label:"بطل المول 🏆"},
{level:30,targetScore:24000,moves:25,label:"ملك المول 👑"},
{level:31,targetScore:26000,moves:22,label:"مستودع صغير 📦"},
{level:32,targetScore:28000,moves:22,label:"مستودع متوسط 🏭"},
{level:33,targetScore:30000,moves:22,label:"مستودع كبير 🏗️"},
{level:34,targetScore:32500,moves:22,label:"مدير المستودع 📋"},
{level:35,targetScore:35000,moves:22,label:"خبير التخزين 🔧"},
{level:36,targetScore:37500,moves:22,label:"أمين المخزن ⚙️"},
{level:37,targetScore:40000,moves:22,label:"قائد الشحن 🚛"},
{level:38,targetScore:43000,moves:22,label:"محترف اللوجستيك 🗺️"},
{level:39,targetScore:46000,moves:22,label:"عملاق التوزيع 💪"},
{level:40,targetScore:50000,moves:22,label:"سيد المستودع 🏅"},
{level:41,targetScore:54000,moves:20,label:"سوق الذهب الصغير 💛"},
{level:42,targetScore:58000,moves:20,label:"تاجر الذهب 🥇"},
{level:43,targetScore:62000,moves:20,label:"صائد الكنوز 💎"},
{level:44,targetScore:66000,moves:20,label:"ملك الذهب 👸"},
{level:45,targetScore:70000,moves:20,label:"أمير الثروة 🤴"},
{level:46,targetScore:75000,moves:20,label:"حارس الخزينة 🔐"},
{level:47,targetScore:80000,moves:20,label:"سيد الثروة 💰"},
{level:48,targetScore:85000,moves:20,label:"إمبراطور الذهب ⚜️"},
{level:49,targetScore:90000,moves:20,label:"أسطورة الثروة 🌠"},
{level:50,targetScore:95000,moves:20,label:"قمة الذهب 🏔️"},
{level:51,targetScore:100000,moves:18,label:"بوابة الإمبراطورية 🏯"},
{level:52,targetScore:106000,moves:18,label:"قاعة العرش 🎖️"},
{level:53,targetScore:112000,moves:18,label:"حارس التاج 🛡️"},
{level:54,targetScore:118000,moves:18,label:"وزير التوفير 📜"},
{level:55,targetScore:125000,moves:18,label:"قائد الجيش 🎯"},
{level:56,targetScore:132000,moves:18,label:"أمير الإمبراطورية 👑"},
{level:57,targetScore:140000,moves:18,label:"حاكم المدينة 🌆"},
{level:58,targetScore:148000,moves:18,label:"سلطان التوفير 🕌"},
{level:59,targetScore:156000,moves:18,label:"الإمبراطور الأكبر 🌍"},
{level:60,targetScore:165000,moves:18,label:"سيد Altawfer الأعظم 🏆"},
];
const MOVES_PURCHASE_COST=13,MOVES_PURCHASE_AMOUNT=5,COINS_PER_LEVEL=5,DAILY_REWARD=5;
const ADMIN_USER="admin"; // اسم مستخدم المشرف

// ======= Daily helpers =======
function canClaimDaily(lastDailyDate){
  if(!lastDailyDate)return true;
  return new Date(lastDailyDate).toDateString()!==new Date().toDateString();
}
function timeUntilNextDaily(){
  const now=new Date(),tom=new Date(now);
  tom.setDate(tom.getDate()+1);tom.setHours(0,0,0,0);
  const d=tom-now;
  return `${Math.floor(d/3600000)}س ${Math.floor((d%3600000)/60000)}د`;
}

// ======= Game logic =======
function findMatchesAndBombs(b){
  const matchSet=new Set();const bombPositions=[];
  for(let r=0;r<ROWS;r++){let c=0;while(c<COLS){if(!b[r][c]||BOMBS.includes(b[r][c])){c++;continue;}let len=1;while(c+len<COLS&&b[r][c+len]===b[r][c])len++;if(len>=4){const mid=c+Math.floor(len/2);bombPositions.push({r,c:mid,type:BOMB});for(let i=0;i<len;i++)if(c+i!==mid)matchSet.add(`${r},${c+i}`);}else if(len===3){for(let i=0;i<3;i++)matchSet.add(`${r},${c+i}`);}c+=len;}}
  for(let c=0;c<COLS;c++){let r=0;while(r<ROWS){if(!b[r][c]||BOMBS.includes(b[r][c])){r++;continue;}let len=1;while(r+len<ROWS&&b[r+len][c]===b[r][c])len++;if(len>=4){const mid=r+Math.floor(len/2);bombPositions.push({r:mid,c,type:VBOMB});for(let i=0;i<len;i++)if(r+i!==mid)matchSet.add(`${r+i},${c}`);}else if(len===3){for(let i=0;i<3;i++)matchSet.add(`${r+i},${c}`);}r+=len;}}
  return{matches:[...matchSet].map(k=>{const[r,c]=k.split(",");return[+r,+c];}),bombPositions};
}
function findMatches(b){return findMatchesAndBombs(b).matches;}
function explodeBombs(b){const nb=b.map(r=>[...r]);const rows=new Set(),cols=new Set();for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(nb[r][c]===BOMB)rows.add(r);if(nb[r][c]===VBOMB)cols.add(c);}if(!rows.size&&!cols.size)return{board:nb,explodedRows:[],explodedCols:[]};rows.forEach(r=>{for(let c=0;c<COLS;c++)nb[r][c]=null;});cols.forEach(c=>{for(let r=0;r<ROWS;r++)nb[r][c]=null;});return{board:nb,explodedRows:[...rows],explodedCols:[...cols]};}
function createBoard(){let b;do{b=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>ALL_TYPES[Math.floor(Math.random()*ALL_TYPES.length)]));}while(findMatches(b).length>0);return b;}
function removeMatches(b,m){const nb=b.map(r=>[...r]);m.forEach(([r,c])=>{nb[r][c]=null;});return nb;}
function placeBombs(b,bombs){const nb=b.map(r=>[...r]);bombs.forEach(({r,c,type})=>{nb[r][c]=type;});return nb;}
function dropCandies(b){const nb=b.map(r=>[...r]);for(let c=0;c<COLS;c++){let e=ROWS-1;for(let r=ROWS-1;r>=0;r--){if(nb[r][c]!==null){nb[e][c]=nb[r][c];if(e!==r)nb[r][c]=null;e--;}}for(let r=e;r>=0;r--)nb[r][c]=ALL_TYPES[Math.floor(Math.random()*ALL_TYPES.length)];}return nb;}
function isAdj(r1,c1,r2,c2){return(Math.abs(r1-r2)===1&&c1===c2)||(Math.abs(c1-c2)===1&&r1===r2);}
function findHint(b){const dirs=[[0,1],[0,-1],[1,0],[-1,0]];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc;if(nr<0||nr>=ROWS||nc<0||nc>=COLS)continue;const nb=b.map(row=>[...row]);[nb[r][c],nb[nr][nc]]=[nb[nr][nc],nb[r][c]];if(findMatches(nb).length>0)return[[r,c],[nr,nc]];}return null;}

// ======= CSS =======
const CSS=`
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
`;
const BG={minHeight:"100vh",background:"linear-gradient(135deg,#1a0533 0%,#2d0a5e 50%,#1a0533 100%)",fontFamily:"'Segoe UI',sans-serif"};
const inputStyle={width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"12px",padding:"12px 16px",color:"#fff",fontSize:"1rem",boxSizing:"border-box",marginBottom:"12px"};
const btnPrimary={width:"100%",background:"linear-gradient(135deg,#FF6B9D,#A855F7)",border:"none",borderRadius:"12px",padding:"13px",color:"#fff",fontSize:"1rem",fontWeight:800,cursor:"pointer",marginBottom:"10px"};

// ===================== APP =====================
export default function App(){
  // Auth
  const[authScreen,setAuthScreen]=useState("login");
  const[username,setUsername]=useState("");
  const[password,setPassword]=useState("");
  const[authError,setAuthError]=useState("");
  const[authShake,setAuthShake]=useState(false);
  const[authLoading,setAuthLoading]=useState(false);
  const[loggedUser,setLoggedUser]=useState(null);

  // Game
  const[screen,setScreen]=useState("levelSelect");
  const[currentLevel,setCurrentLevel]=useState(0);
  const[board,setBoard]=useState(null);
  const[selected,setSelected]=useState(null);
  const[score,setScore]=useState(0);
  const[moves,setMoves]=useState(0);
  const[animating,setAnimating]=useState(false);
  const[matchedCells,setMatchedCells]=useState([]);
  const[combo,setCombo]=useState(0);
  const[showCombo,setShowCombo]=useState(false);
  const[hintsLeft,setHintsLeft]=useState(2);
  const[hintCells,setHintCells]=useState(null);
  const[unlockedLevels,setUnlockedLevels]=useState(1);
  const[coins,setCoins]=useState(0);
  const[showCoinAnim,setShowCoinAnim]=useState(false);
  const[coinAnimKey,setCoinAnimKey]=useState(0);
  const[notEnoughCoins,setNotEnoughCoins]=useState(false);
  const[explodingRows,setExplodingRows]=useState([]);
  const[explodingCols,setExplodingCols]=useState([]);
  const[newBombKeys,setNewBombKeys]=useState([]);
  const[showBombMsg,setShowBombMsg]=useState("");
  const[saveIndicator,setSaveIndicator]=useState(false);

  // Daily
  const[dailyAvailable,setDailyAvailable]=useState(false);
  const[showDailyPopup,setShowDailyPopup]=useState(false);
  const[dailyCollected,setDailyCollected]=useState(false);
  const[lastDailyDate,setLastDailyDate]=useState(null);

  // Leaderboard
  const[showLeaderboard,setShowLeaderboard]=useState(false);
  const[lbData,setLbData]=useState([]);
  const[lbLoading,setLbLoading]=useState(false);

  // Admin dashboard
  const[showAdmin,setShowAdmin]=useState(false);
  const[adminData,setAdminData]=useState([]);
  const[adminLoading,setAdminLoading]=useState(false);

  const lv=LEVELS[currentLevel];

  // ---- Firebase: auto-restore session ----
  useEffect(()=>{
    getFB().then(({auth})=>{
      auth._fns.onAuthStateChanged(auth,async(user)=>{
        if(user){
          const uname=user.email.replace("@market-altawfer.game","");
          const prof=await fsGetProfile(uname)||{unlockedLevels:1,coins:0,bestScore:0,lastDailyDate:null};
          setLoggedUser(uname);
          setUnlockedLevels(prof.unlockedLevels||1);
          setCoins(prof.coins||0);
          setLastDailyDate(prof.lastDailyDate||null);
          const avail=canClaimDaily(prof.lastDailyDate||null);
          setDailyAvailable(avail);
          if(avail)setTimeout(()=>setShowDailyPopup(true),800);
        }
      });
    });
  },[]);

  // ---- Auto-save to Firestore ----
  const saveToCloud=useCallback(async(data)=>{
    if(!loggedUser)return;
    await fsSaveProfile(loggedUser,data);
    setSaveIndicator(true);
    setTimeout(()=>setSaveIndicator(false),1500);
  },[loggedUser]);

  // ---- Auth ----
  const triggerShake=()=>{setAuthShake(true);setTimeout(()=>setAuthShake(false),400);};

  const handleLogin=async()=>{
    const u=username.trim();
    if(!u||!password){setAuthError("أدخل اسم المستخدم وكلمة المرور");triggerShake();return;}
    setAuthLoading(true);setAuthError("");
    try{
      await fbLogin(u,password);
      setUsername("");setPassword("");
    }catch(e){
      const msg=e.code==="auth/invalid-credential"||e.code==="auth/wrong-password"?"كلمة المرور غير صحيحة":e.code==="auth/user-not-found"?"المستخدم غير موجود":"خطأ في تسجيل الدخول";
      setAuthError(msg);triggerShake();
    }
    setAuthLoading(false);
  };

  const handleRegister=async()=>{
    const u=username.trim();
    if(!u||!password){setAuthError("أدخل اسم المستخدم وكلمة المرور");triggerShake();return;}
    if(u.length<3){setAuthError("اسم المستخدم 3 أحرف على الأقل");triggerShake();return;}
    if(password.length<6){setAuthError("كلمة المرور 6 أحرف على الأقل");triggerShake();return;}
    setAuthLoading(true);setAuthError("");
    try{
      await fbRegister(u,password);
      await fsSaveProfile(u,{username:u,unlockedLevels:1,coins:0,bestScore:0,lastDailyDate:null,createdAt:new Date().toISOString()});
      setUsername("");setPassword("");
    }catch(e){
      const msg=e.code==="auth/email-already-in-use"?"اسم المستخدم موجود مسبقاً":"خطأ في إنشاء الحساب";
      setAuthError(msg);triggerShake();
    }
    setAuthLoading(false);
  };

  const handleLogout=async()=>{
    await fbLogout();
    setLoggedUser(null);setScreen("levelSelect");
    setUnlockedLevels(1);setCoins(0);setAuthError("");
  };

  // ---- Daily Reward ----
  const claimDaily=async()=>{
    playCoin();
    const today=new Date().toISOString();
    const newCoins=coins+DAILY_REWARD;
    setCoins(newCoins);
    setLastDailyDate(today);
    setDailyAvailable(false);
    setDailyCollected(true);
    setTimeout(()=>setDailyCollected(false),2500);
    setShowDailyPopup(false);
    await saveToCloud({coins:newCoins,lastDailyDate:today});
  };

  // ---- Leaderboard ----
  const openLeaderboard=async()=>{
    setShowLeaderboard(true);setLbLoading(true);
    const data=await fsGetLeaderboard();
    setLbData(data);setLbLoading(false);
  };

  // ---- Admin Dashboard ----
  const openAdmin=async()=>{
    setShowAdmin(true);setAdminLoading(true);
    try{
      const{db}=await getFB();
      const{collection,getDocs,query,orderBy}=db._fns;
      const q=query(collection(db,"players"),orderBy("unlockedLevels","desc"));
      const snap=await getDocs(q);
      setAdminData(snap.docs.map(d=>({id:d.id,...d.data()})));
    }catch(e){console.error(e);}
    setAdminLoading(false);
  };

  // ---- Game ----
  const startLevel=useCallback((idx)=>{
    setCurrentLevel(idx);setBoard(createBoard());setScore(0);setMoves(LEVELS[idx].moves);
    setSelected(null);setAnimating(false);setMatchedCells([]);setHintsLeft(2);setHintCells(null);
    setCombo(0);setNotEnoughCoins(false);setExplodingRows([]);setExplodingCols([]);
    setNewBombKeys([]);setShowBombMsg("");setScreen("game");
  },[]);

  const buyMoves=()=>{
    if(coins<MOVES_PURCHASE_COST){setNotEnoughCoins(true);setTimeout(()=>setNotEnoughCoins(false),2000);return;}
    const nc=coins-MOVES_PURCHASE_COST;
    setCoins(nc);setMoves(m=>m+MOVES_PURCHASE_AMOUNT);playCoin();
    saveToCloud({coins:nc});setScreen("game");
  };

  const processMatches=useCallback((b,cc,rs,ml,ts,li)=>{
    const{board:afterBombs,explodedRows,explodedCols}=explodeBombs(b);
    if(explodedRows.length||explodedCols.length){
      playBomb();setExplodingRows(explodedRows);setExplodingCols(explodedCols);
      const cells=explodedRows.length*COLS+explodedCols.length*ROWS;
      const nrs=rs+cells*20*(cc+1);
      setTimeout(()=>{setScore(s=>s+cells*20*(cc+1));setExplodingRows([]);setExplodingCols([]);const b3=dropCandies(afterBombs);setBoard(b3);setTimeout(()=>processMatches(b3,cc+1,nrs,ml,ts,li),300);},550);
      return;
    }
    const{matches,bombPositions}=findMatchesAndBombs(b);
    if(!matches.length&&!bombPositions.length){
      setAnimating(false);setMatchedCells([]);
      if(cc>1){playCombo();setCombo(cc);setShowCombo(true);setTimeout(()=>setShowCombo(false),1200);}
      if(rs>=ts){
        playWin();
        const nc=coins+COINS_PER_LEVEL;
        setCoins(nc);setShowCoinAnim(true);setCoinAnimKey(k=>k+1);setTimeout(()=>setShowCoinAnim(false),1200);
        setTimeout(async()=>{
          const next=li+1;
          const newUnlocked=Math.max(unlockedLevels,next+1);
          setUnlockedLevels(newUnlocked);
          // حفظ في Firestore
          const prof=await fsGetProfile(loggedUser)||{};
          const updates={unlockedLevels:newUnlocked,coins:nc};
          if(rs>(prof.bestScore||0))updates.bestScore=rs;
          await saveToCloud(updates);
          if(next>=20)setScreen("win");
          else setScreen("levelUp");
        },600);
      }else if(ml<=0){playFail();setTimeout(()=>setScreen("gameOver"),500);}
      return;
    }
    playMatch();setMatchedCells(matches);
    const pts=matches.length*10*(cc+1);const nrs=rs+pts;
    setTimeout(()=>{
      setScore(s=>s+pts);let b2=removeMatches(b,matches);
      if(bombPositions.length){
        b2=placeBombs(b2,bombPositions);
        setNewBombKeys(bombPositions.map(({r,c,type})=>({key:`${r},${c}`,type})));
        const hasRow=bombPositions.some(x=>x.type===BOMB),hasCol=bombPositions.some(x=>x.type===VBOMB);
        setShowBombMsg(hasRow&&hasCol?"both":hasRow?"row":"col");
        setTimeout(()=>{setNewBombKeys([]);setShowBombMsg("");},1400);
      }
      const b3=dropCandies(b2);setBoard(b3);setMatchedCells([]);
      setTimeout(()=>processMatches(b3,cc+1,nrs,ml,ts,li),300);
    },400);
  },[coins,unlockedLevels,loggedUser,saveToCloud]);

  const handleCellClick=(r,c)=>{
    if(animating||screen!=="game")return;
    if(!selected){setSelected([r,c]);return;}
    const[sr,sc]=selected;
    if(sr===r&&sc===c){setSelected(null);return;}
    if(isAdj(sr,sc,r,c)){
      const nb=board.map(row=>[...row]);[nb[sr][sc],nb[r][c]]=[nb[r][c],nb[sr][sc]];
      if(findMatches(nb).length||nb[sr][sc]===BOMB||nb[r][c]===BOMB||nb[sr][sc]===VBOMB||nb[r][c]===VBOMB){
        playSwap();setBoard(nb);setSelected(null);
        const nm=moves-1;setMoves(nm);setAnimating(true);
        processMatches(nb,0,score,nm,lv.targetScore,currentLevel);
      }else setSelected(null);
    }else setSelected([r,c]);
  };

  const handleHint=()=>{
    if(!hintsLeft||animating)return;
    const hint=findHint(board);if(!hint)return;
    setHintsLeft(h=>h-1);setHintCells(hint);setTimeout(()=>setHintCells(null),2000);
  };

  const isMatched=(r,c)=>matchedCells.some(([mr,mc])=>mr===r&&mc===c);
  const isSelected=(r,c)=>selected&&selected[0]===r&&selected[1]===c;
  const isHint=(r,c)=>hintCells&&hintCells.some(([hr,hc])=>hr===r&&hc===c);
  const progress=lv?Math.min(100,Math.round((score/lv.targetScore)*100)):0;

  const CoinBar=()=>(
    <div style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,215,0,0.12)",border:"1px solid rgba(255,215,0,0.35)",borderRadius:"20px",padding:"4px 12px",fontSize:"0.85rem",fontWeight:800,color:"#FFD700"}}>
      🪙 {coins}
    </div>
  );

  const Spinner=()=><span className="spinner">⏳</span>;

  // ==================== AUTH ====================
  if(!loggedUser)return(
    <div style={{...BG,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{CSS}</style>
      <div className="fade-in" style={{width:"100%",maxWidth:"340px"}}>
        <h1 style={{fontSize:"2rem",fontWeight:900,background:"linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"0 0 4px 0",textAlign:"center"}}>🛒 Market Altawfer</h1>
        <p style={{color:"rgba(255,255,255,0.35)",fontSize:"0.75rem",textAlign:"center",margin:"0 0 24px 0"}}>☁️ مدعوم بـ Firebase</p>
        <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:"12px",padding:"4px",marginBottom:"20px"}}>
          {["login","register"].map(s=>(
            <button key={s} onClick={()=>{setAuthScreen(s);setAuthError("");}} style={{flex:1,background:authScreen===s?"linear-gradient(135deg,#FF6B9D,#A855F7)":"transparent",border:"none",borderRadius:"9px",padding:"9px",color:authScreen===s?"#fff":"rgba(255,255,255,0.5)",fontSize:"0.9rem",fontWeight:authScreen===s?800:400,cursor:"pointer",transition:"all 0.2s"}}>
              {s==="login"?"تسجيل الدخول":"حساب جديد"}
            </button>
          ))}
        </div>
        <div className={authShake?"shake":""}>
          <input style={inputStyle} placeholder="اسم المستخدم" value={username} onChange={e=>{setUsername(e.target.value);setAuthError("");}} onKeyDown={e=>e.key==="Enter"&&(authScreen==="login"?handleLogin():handleRegister())}/>
          <input style={inputStyle} placeholder="كلمة المرور" type="password" value={password} onChange={e=>{setPassword(e.target.value);setAuthError("");}} onKeyDown={e=>e.key==="Enter"&&(authScreen==="login"?handleLogin():handleRegister())}/>
          {authError&&<div style={{color:"#FF6B6B",fontSize:"0.82rem",marginBottom:"12px",textAlign:"center",background:"rgba(255,50,50,0.1)",border:"1px solid rgba(255,50,50,0.25)",borderRadius:"8px",padding:"8px"}}>⚠️ {authError}</div>}
          <button style={btnPrimary} onClick={authScreen==="login"?handleLogin:handleRegister} disabled={authLoading}>
            {authLoading?<Spinner/>:authScreen==="login"?"🚀 دخول":"✅ إنشاء الحساب"}
          </button>
        </div>
        <p style={{color:"rgba(255,255,255,0.2)",fontSize:"0.7rem",textAlign:"center",marginTop:"12px"}}>☁️ بياناتك محفوظة على السحابة • تسجّل من أي جهاز</p>
      </div>
    </div>
  );

  // ==================== ADMIN DASHBOARD ====================
  if(showAdmin&&loggedUser===ADMIN_USER)return(
    <div style={{...BG,minHeight:"100vh",overflowY:"auto",padding:"0"}}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{background:"rgba(0,0,0,0.4)",borderBottom:"1px solid rgba(168,85,247,0.3)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div>
          <h2 style={{margin:0,color:"#A855F7",fontWeight:900,fontSize:"1.1rem"}}>⚙️ لوحة تحكم Market Altawfer</h2>
          <p style={{margin:0,color:"rgba(255,255,255,0.3)",fontSize:"0.7rem"}}>Firebase Firestore • {adminData.length} لاعب</p>
        </div>
        <button onClick={()=>setShowAdmin(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"8px",padding:"6px 14px",color:"rgba(255,255,255,0.7)",fontSize:"0.82rem",cursor:"pointer"}}>← رجوع</button>
      </div>

      {/* Stats cards */}
      {adminLoading?<div style={{textAlign:"center",padding:"60px",color:"rgba(255,255,255,0.4)"}}>⏳ جاري التحميل...</div>:(()=>{
        const totalPlayers=adminData.length;
        const completedAll=adminData.filter(p=>(p.unlockedLevels||1)>20).length;
        const totalCoins=adminData.reduce((s,p)=>s+(p.coins||0),0);
        const avgLevel=totalPlayers?Math.round(adminData.reduce((s,p)=>s+(p.unlockedLevels||1),0)/totalPlayers):0;

        return(
          <div style={{padding:"16px 20px"}}>
            {/* Summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px",marginBottom:"20px"}}>
              {[
                {label:"إجمالي اللاعبين",value:totalPlayers,icon:"👥",color:"#A855F7"},
                {label:"أكملوا كل المراحل",value:completedAll,icon:"🏅",color:"#FFD700"},
                {label:"متوسط المرحلة",value:`M${avgLevel}`,icon:"📊",color:"#60a5fa"},
                {label:"إجمالي العملات",value:totalCoins.toLocaleString(),icon:"🪙",color:"#10B981"},
              ].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${s.color}33`,borderRadius:"14px",padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:"1.6rem",marginBottom:"4px"}}>{s.icon}</div>
                  <div style={{color:s.color,fontWeight:900,fontSize:"1.3rem"}}>{s.value}</div>
                  <div style={{color:"rgba(255,255,255,0.4)",fontSize:"0.65rem",marginTop:"2px"}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Level distribution bar */}
            <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"14px",marginBottom:"16px"}}>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.78rem",marginBottom:"10px",fontWeight:700}}>📈 توزيع اللاعبين على المراحل</div>
              {Array.from({length: LEVELS.length},(_,i)=>{
                const count=adminData.filter(p=>(p.unlockedLevels||1)===i+1).length;
                const pct=totalPlayers?Math.round(count/totalPlayers*100):0;
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                    <div style={{color:"rgba(255,255,255,0.4)",fontSize:"0.65rem",minWidth:"24px",textAlign:"right"}}>M{i+1}</div>
                    <div style={{flex:1,height:"10px",background:"rgba(255,255,255,0.06)",borderRadius:"5px",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#FF6B9D,#A855F7)",borderRadius:"5px",transition:"width 0.4s"}}/>
                    </div>
                    <div style={{color:"rgba(255,255,255,0.5)",fontSize:"0.65rem",minWidth:"28px"}}>{count}</div>
                  </div>
                );
              })

            </div>

            {/* Players table */}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",fontSize:"0.72rem",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"8px",fontWeight:700}}>
                <span>اللاعب</span><span style={{textAlign:"center"}}>المرحلة</span><span style={{textAlign:"center"}}>أفضل نقطة</span><span style={{textAlign:"center"}}>عملات</span>
              </div>
              {adminData.map((p,i)=>(
                <div key={p.id} style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"8px",alignItems:"center",background:i%2===0?"transparent":"rgba(255,255,255,0.02)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"linear-gradient(135deg,#FF6B9D,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.78rem",fontWeight:800,color:"#fff",flexShrink:0}}>
                      {(p.username||p.id)[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{color:"#fff",fontSize:"0.82rem",fontWeight:600}}>{p.username||p.id}</div>
                      <div style={{color:"rgba(255,255,255,0.25)",fontSize:"0.6rem"}}>{p.createdAt?new Date(p.createdAt).toLocaleDateString("ar"):"—"}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"center",color:"#A855F7",fontWeight:800,fontSize:"0.88rem"}}>M{Math.min(p.unlockedLevels||1,20)}</div>
                  <div style={{textAlign:"center",color:"#FFD700",fontSize:"0.82rem"}}>{(p.bestScore||0).toLocaleString()}</div>
                  <div style={{textAlign:"center",color:"#10B981",fontSize:"0.82rem"}}>🪙{p.coins||0}</div>
                </div>
              ))}
            </div>

            <button onClick={openAdmin} style={{marginTop:"12px",width:"100%",background:"rgba(168,85,247,0.15)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:"10px",padding:"10px",color:"#A855F7",fontSize:"0.85rem",cursor:"pointer",fontWeight:700}}>
              🔄 تحديث البيانات
            </button>
          </div>
        );
      })()}
    </div>
  );

  // ==================== LEVEL SELECT ====================
  if(screen==="levelSelect")return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a0533 0%,#2d0a5e 50%,#1a0533 100%)",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px",overflowY:"auto",minHeight:"100vh"}}>
      <style>{CSS}</style>

      {/* Daily popup */}
      {showDailyPopup&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
          <div className="daily-popup" style={{background:"linear-gradient(135deg,#2d0a5e,#1a0533)",border:"2px solid rgba(255,215,0,0.5)",borderRadius:"24px",padding:"36px 28px",maxWidth:"320px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:"4rem",marginBottom:"8px"}}>🎁</div>
            <h2 style={{color:"#FFD700",fontSize:"1.6rem",fontWeight:900,margin:"0 0 6px 0"}}>مكافأتك اليومية!</h2>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.85rem",margin:"0 0 20px 0"}}>ارجع كل يوم واحصل على عملات مجانية</p>
            <div className="daily-glow" style={{background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.4)",borderRadius:"16px",padding:"18px",marginBottom:"22px"}}>
              <div style={{color:"#FFD700",fontSize:"3rem",fontWeight:900}}>+{DAILY_REWARD}</div>
              <div style={{color:"#FFD700",fontSize:"1rem",fontWeight:700}}>عملات ذهبية 🪙</div>
            </div>
            <button onClick={claimDaily} style={{width:"100%",background:"linear-gradient(135deg,#FFD700,#FF9800)",border:"none",borderRadius:"14px",padding:"14px",color:"#1a0533",fontSize:"1.1rem",fontWeight:900,cursor:"pointer"}}>🎉 استلم المكافأة</button>
          </div>
        </div>
      )}

      {/* Daily collected toast */}
      {dailyCollected&&<div style={{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",zIndex:400,background:"linear-gradient(135deg,#FFD700,#FF9800)",borderRadius:"12px",padding:"10px 22px",color:"#1a0533",fontWeight:900,fontSize:"1rem",animation:"bounceIn 0.4s forwards",whiteSpace:"nowrap"}}>🎁 +{DAILY_REWARD}🪙 تم الاستلام!</div>}

      {/* Leaderboard overlay */}
      {showLeaderboard&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div className="lb-panel" style={{background:"linear-gradient(180deg,#2d0a5e,#1a0533)",border:"1px solid rgba(168,85,247,0.4)",borderRadius:"24px 24px 0 0",padding:"0 0 32px",width:"100%",maxWidth:"480px",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px 12px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <h2 style={{margin:0,fontSize:"1.2rem",fontWeight:900,background:"linear-gradient(90deg,#FFD700,#FF9800)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>🏆 لائحة المتصدرين</h2>
              <button onClick={()=>setShowLeaderboard(false)} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:"8px",padding:"5px 12px",color:"rgba(255,255,255,0.6)",fontSize:"0.85rem",cursor:"pointer"}}>✕</button>
            </div>
            <p style={{color:"rgba(255,255,255,0.3)",fontSize:"0.7rem",textAlign:"center",margin:"6px 0"}}>☁️ بيانات حية من Firebase</p>
            <div style={{overflowY:"auto",padding:"8px 16px",flex:1}}>
              {lbLoading?<div style={{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.4)"}}>⏳ جاري التحميل...</div>
              :lbData.length===0?<div style={{color:"rgba(255,255,255,0.3)",textAlign:"center",marginTop:"32px"}}>لا يوجد لاعبون بعد 👀</div>
              :lbData.map((p,i)=>{
                const medals=["🥇","🥈","🥉"];
                const isMe=p.id===loggedUser;
                const rankColor=i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(255,255,255,0.5)";
                return(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"11px 14px",marginBottom:"8px",borderRadius:"14px",background:isMe?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.04)",border:isMe?"1px solid rgba(168,85,247,0.4)":"1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{minWidth:"28px",textAlign:"center",fontSize:i<3?"1.3rem":"0.9rem",fontWeight:900,color:rankColor}}>{i<3?medals[i]:`#${i+1}`}</div>
                    <div style={{width:"34px",height:"34px",borderRadius:"50%",background:isMe?"linear-gradient(135deg,#FF6B9D,#A855F7)":"linear-gradient(135deg,#4B5563,#374151)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem",fontWeight:800,color:"#fff",flexShrink:0}}>
                      {(p.username||p.id)[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:isMe?"#C084FC":"#fff",fontWeight:700,fontSize:"0.88rem",display:"flex",alignItems:"center",gap:"5px"}}>
                        {p.username||p.id}{isMe&&<span style={{fontSize:"0.62rem",background:"rgba(168,85,247,0.3)",borderRadius:"5px",padding:"1px 5px",color:"#C084FC"}}>أنت</span>}
                      </div>
                      <div style={{color:"rgba(255,255,255,0.35)",fontSize:"0.68rem"}}>أفضل: {(p.bestScore||0).toLocaleString()}</div>
                    </div>
                    <div style={{textAlign:"center",flexShrink:0}}>
                      <div style={{color:rankColor,fontWeight:900,fontSize:"0.95rem"}}>M{Math.min(p.unlockedLevels||1,20)}</div>
                    </div>
                    <div style={{color:"#FFD700",fontSize:"0.82rem",flexShrink:0}}>🪙{p.coins||0}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",maxWidth:"400px",marginBottom:"10px"}}>
        <h1 style={{fontSize:"1.5rem",fontWeight:900,background:"linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0}}>🛒 Market Altawfer</h1>
        <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          <button onClick={openLeaderboard} style={{background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:"10px",padding:"5px 10px",color:"#FFD700",fontSize:"0.8rem",cursor:"pointer",fontWeight:700}}>🏆</button>
          {loggedUser===ADMIN_USER&&<button onClick={openAdmin} style={{background:"rgba(168,85,247,0.15)",border:"1px solid rgba(168,85,247,0.35)",borderRadius:"10px",padding:"5px 10px",color:"#A855F7",fontSize:"0.8rem",cursor:"pointer",fontWeight:700}}>⚙️</button>}
          <CoinBar/>
        </div>
      </div>

      {/* User bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",maxWidth:"400px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"12px",padding:"8px 14px",marginBottom:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#FF6B9D,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",fontWeight:800,color:"#fff"}}>{loggedUser[0].toUpperCase()}</div>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:"0.88rem"}}>{loggedUser}</div>
            <div style={{color:"rgba(255,255,255,0.35)",fontSize:"0.68rem"}}>{saveIndicator?"💾 تم الحفظ ✓ ":"☁️ Firebase"}M{Math.min(unlockedLevels,20)}/LEVELS.length</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{background:"rgba(255,50,50,0.12)",border:"1px solid rgba(255,50,50,0.25)",borderRadius:"8px",padding:"5px 12px",color:"rgba(255,100,100,0.9)",fontSize:"0.78rem",cursor:"pointer"}}>خروج</button>
      </div>

      {/* Daily card */}
      <div style={{width:"100%",maxWidth:"400px",marginBottom:"12px"}}>
        {dailyAvailable?(
          <button onClick={()=>setShowDailyPopup(true)} className="daily-glow" style={{width:"100%",background:"linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,150,0,0.1))",border:"2px solid rgba(255,215,0,0.5)",borderRadius:"14px",padding:"11px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",boxSizing:"border-box"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{fontSize:"1.8rem"}}>🎁</div>
              <div style={{textAlign:"right"}}>
                <div style={{color:"#FFD700",fontWeight:800,fontSize:"0.88rem"}}>مكافأتك اليومية جاهزة!</div>
                <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.7rem"}}>استلم {DAILY_REWARD}🪙 مجاناً</div>
              </div>
            </div>
            <div style={{background:"linear-gradient(135deg,#FFD700,#FF9800)",borderRadius:"10px",padding:"5px 12px",color:"#1a0533",fontWeight:900,fontSize:"0.82rem"}}>استلم</div>
          </button>
        ):(
          <div style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",boxSizing:"border-box"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <div style={{fontSize:"1.4rem",opacity:0.3}}>🎁</div>
              <div>
                <div style={{color:"rgba(255,255,255,0.25)",fontWeight:700,fontSize:"0.82rem"}}>المكافأة اليومية</div>
                <div style={{color:"rgba(255,255,255,0.18)",fontSize:"0.66rem"}}>تعود بعد {timeUntilNextDaily()}</div>
              </div>
            </div>
            <div style={{color:"rgba(255,255,255,0.18)",fontSize:"0.75rem"}}>✓ تم</div>
          </div>
        )}
      </div>

      <p style={{color:"rgba(255,215,0,0.65)",fontSize:"0.75rem",margin:"0 0 12px 0",background:"rgba(255,100,0,0.08)",border:"1px solid rgba(255,100,0,0.18)",borderRadius:"10px",padding:"4px 12px"}}>
        💣 4 أفقي = يدمر الصف • 🧨 4 عمودي = يدمر العمود
      </p>

      {/* Level grid */}
    <div style={{
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "15px",
  maxHeight: "400px",
  overflowY: "scroll",
  padding: "20px",
  backgroundColor: "rgba(0,0,0,0.2)",
  borderRadius: "15px"
}}>

    {LEVELS.map((l,idx)=>{
          const locked=idx>=unlockedLevels,done=idx<unlockedLevels-1;
          return(
            <div key={idx} className="lvbtn" onClick={()=>!locked&&startLevel(idx)} style={{background:locked?"rgba(255,255,255,0.04)":done?"linear-gradient(135deg,#10B981,#047857)":"linear-gradient(135deg,#FF6B9D,#A855F7)",border:locked?"1px solid rgba(255,255,255,0.07)":"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"12px 6px",textAlign:"center",cursor:locked?"not-allowed":"pointer",opacity:locked?0.4:1,boxShadow:locked?"none":"0 4px 14px rgba(168,85,247,0.3)"}}>
              <div style={{fontSize:"1.3rem",marginBottom:"3px"}}>{locked?"🔒":done?"✅":"▶️"}</div>
              <div style={{color:"#fff",fontWeight:800,fontSize:"1rem"}}>{l.level}</div>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.58rem"}}>{l.moves} حركة</div>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:"0.55rem"}}>{l.targetScore}⭐</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==================== GAME OVER ====================
  if(screen==="gameOver")return(
    <div style={{...BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",padding:"32px 24px",maxWidth:"340px",width:"100%"}}>
        <div style={{fontSize:"4rem",marginBottom:"10px"}}>😔</div>
        <h2 style={{color:"#FF4444",fontSize:"2rem",margin:"0 0 6px 0",fontWeight:900}}>انتهت الحركات!</h2>
        <p style={{color:"rgba(255,255,255,0.65)",margin:"0 0 4px 0"}}>المرحلة {currentLevel+1} — {lv.label}</p>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:"0.88rem",margin:"0 0 18px 0"}}>وصلت: <span style={{color:"#FF6B9D",fontWeight:800}}>{score}</span> / {lv.targetScore}</p>
        <div style={{background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:"14px",padding:"12px",marginBottom:"14px"}}>
          <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.75rem",marginBottom:"4px"}}>رصيدك</div>
          <div style={{color:"#FFD700",fontSize:"1.6rem",fontWeight:900}}>🪙 {coins}</div>
        </div>
        <button onClick={buyMoves} disabled={coins<MOVES_PURCHASE_COST} style={{width:"100%",background:coins>=MOVES_PURCHASE_COST?"linear-gradient(135deg,#FFD700,#FF9800)":"rgba(255,255,255,0.05)",border:"none",borderRadius:"14px",padding:"13px",color:coins>=MOVES_PURCHASE_COST?"#1a0533":"rgba(255,255,255,0.25)",fontSize:"1rem",fontWeight:800,cursor:coins>=MOVES_PURCHASE_COST?"pointer":"not-allowed",marginBottom:"8px",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
          ➕ شراء {MOVES_PURCHASE_AMOUNT} حركات <span style={{background:"rgba(0,0,0,0.15)",borderRadius:"8px",padding:"2px 10px"}}>🪙{MOVES_PURCHASE_COST}</span>
        </button>
        {notEnoughCoins&&<div style={{color:"#FF4444",fontSize:"0.8rem",marginBottom:"10px",fontWeight:700}}>❌ رصيد غير كافٍ!</div>}
        <div style={{color:"rgba(255,255,255,0.25)",fontSize:"0.68rem",marginBottom:"14px"}}>تكسب {COINS_PER_LEVEL}🪙 عند إكمال كل مرحلة</div>
        <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
          <button onClick={()=>startLevel(currentLevel)} style={{background:"linear-gradient(135deg,#FF6B9D,#A855F7)",border:"none",borderRadius:"14px",padding:"11px 20px",color:"#fff",fontSize:"0.95rem",fontWeight:700,cursor:"pointer"}}>🔄 مجدداً</button>
          <button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"11px 20px",color:"rgba(255,255,255,0.8)",fontSize:"0.95rem",cursor:"pointer"}}>🗺️ المراحل</button>
        </div>
      </div>
    </div>
  );

  // ==================== LEVEL UP ====================
  if(screen==="levelUp")return(
    <div style={{...BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      {showCoinAnim&&<div key={coinAnimKey} className="coin-anim" style={{top:"30%",left:"48%"}}>+{COINS_PER_LEVEL}🪙</div>}
      <div style={{animation:"bounceIn 0.6s forwards",textAlign:"center",padding:"40px"}}>
        <div style={{fontSize:"5rem",marginBottom:"12px"}}>🎉</div>
        <h2 style={{color:"#FFD700",fontSize:"2.2rem",margin:"0 0 8px 0",fontWeight:900}}>أحسنت!</h2>
        <p style={{color:"rgba(255,255,255,0.8)",margin:"0 0 4px 0"}}>أكملت المرحلة {currentLevel+1}</p>
        <p style={{color:"#FF6B9D",fontSize:"1.3rem",fontWeight:800,margin:"0 0 4px 0"}}>نقاطك: {score}</p>
        <div style={{color:"#FFD700",fontWeight:700,marginBottom:"6px"}}>🪙 +{COINS_PER_LEVEL} عملات! (رصيدك: {coins})</div>
        <div style={{color:"rgba(255,255,255,0.3)",fontSize:"0.72rem",marginBottom:"18px"}}>☁️ تم الحفظ على Firebase</div>
        <a href="https://forms.gle/oZPFpUAzmtm7Srvo8" target="_blank" rel="noreferrer" style={{display:"inline-block",marginBottom:"18px",background:"linear-gradient(135deg,#10B981,#047857)",borderRadius:"14px",padding:"11px 28px",color:"#fff",fontSize:"0.95rem",fontWeight:700,textDecoration:"none"}}>📝 سجّل اسمك</a>
        <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>startLevel(currentLevel+1)} style={{background:"linear-gradient(135deg,#FF6B9D,#A855F7)",border:"none",borderRadius:"14px",padding:"12px 28px",color:"#fff",fontSize:"1rem",fontWeight:700,cursor:"pointer"}}>▶️ المرحلة {currentLevel+2}</button>
          <button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"12px 28px",color:"rgba(255,255,255,0.8)",fontSize:"1rem",cursor:"pointer"}}>🗺️ المراحل</button>
        </div>
      </div>
    </div>
  );

  // ==================== WIN ====================
  if(screen==="win")return(
    <div style={{...BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{animation:"bounceIn 0.6s forwards",textAlign:"center",padding:"40px"}}>
        <div style={{fontSize:"5rem",marginBottom:"12px"}}>🏅</div>
        <h2 style={{color:"#FFD700",fontSize:"2.2rem",margin:"0 0 8px 0",fontWeight:900}}>سيد Altawfer! 🎊</h2>
        <p style={{color:"rgba(255,255,255,0.8)",fontSize:"1.1rem",margin:"0 0 4px 0"}}>أكملت جميع المراحل الـ {LEVELS.length}!</p>
        <div style={{color:"#FFD700",fontWeight:700,marginBottom:"16px"}}>🪙 رصيدك: {coins}</div>
        <a href="https://forms.gle/oZPFpUAzmtm7Srvo8" target="_blank" rel="noreferrer" style={{display:"inline-block",marginBottom:"16px",background:"linear-gradient(135deg,#FFD700,#FF6B9D)",borderRadius:"14px",padding:"14px 36px",color:"#1a0533",fontSize:"1.1rem",fontWeight:800,textDecoration:"none"}}>🏆 سجّل اسمك كبطل!</a><br/>
        <button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"10px 28px",color:"rgba(255,255,255,0.8)",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",marginTop:"8px"}}>🗺️ المراحل</button>
      </div>
    </div>
  );

  // ==================== GAME ====================
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a0533 0%,#2d0a5e 50%,#1a0533 100%)",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px",position:"relative",overflow:"hidden"}}>
      <style>{CSS}</style>
      {showCoinAnim&&<div key={coinAnimKey} className="coin-anim" style={{top:"15%",left:"50%"}}>+{COINS_PER_LEVEL}🪙</div>}
      {showBombMsg&&<div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",zIndex:100,fontWeight:900,animation:"comboAnim 1.2s forwards",pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
        {(showBombMsg==="row"||showBombMsg==="both")&&<div style={{fontSize:"2rem",color:"#FF4400",textShadow:"0 0 20px #FF8800"}}>💣 قنبلة صف!</div>}
        {(showBombMsg==="col"||showBombMsg==="both")&&<div style={{fontSize:"2rem",color:"#00CFFF",textShadow:"0 0 20px #00CFFF"}}>🧨 قنبلة عمود!</div>}
      </div>}
      {saveIndicator&&<div style={{position:"fixed",top:"10px",right:"12px",zIndex:200,background:"rgba(16,185,129,0.9)",borderRadius:"8px",padding:"4px 12px",color:"#fff",fontSize:"0.72rem",fontWeight:700}}>☁️ تم الحفظ ✓</div>}

      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px",width:"100%",maxWidth:"390px",justifyContent:"space-between"}}>
        <button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"10px",padding:"6px 12px",color:"rgba(255,255,255,0.7)",fontSize:"0.8rem",cursor:"pointer"}}>🗺️</button>
        <span style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.35)",fontWeight:600}}>👤 {loggedUser}</span>
        <CoinBar/>
      </div>

      <div style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:"12px",padding:"5px 18px",marginBottom:"10px",color:"#A855F7",fontWeight:700,fontSize:"0.82rem"}}>
        المرحلة {currentLevel+1}/{LEVELS.length} — {lv.label}
      </div>

      <div style={{display:"flex",gap:"10px",marginBottom:"8px"}}>
        {[{label:"النقاط",value:score,color:"#FFD700"},{label:"الهدف",value:lv.targetScore,color:"#10B981"},{label:"الحركات",value:moves,color:moves<=5?"#FF4444":"#60a5fa"}].map(({label,value,color})=>(
          <div key={label} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"12px",padding:"6px 12px",textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:"0.62rem",marginBottom:"2px"}}>{label}</div>
            <div style={{color,fontSize:"1.1rem",fontWeight:800}}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{width:"100%",maxWidth:"390px",height:"9px",background:"rgba(255,255,255,0.1)",borderRadius:"99px",marginBottom:"10px",overflow:"hidden"}}>
        <div style={{height:"100%",width:progress+"%",background:"linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)",borderRadius:"99px",transition:"width 0.4s"}}/>
      </div>

      {showCombo&&<div style={{position:"fixed",top:"25%",left:"50%",transform:"translateX(-50%)",zIndex:100,fontSize:"3rem",fontWeight:900,color:"#FFD700",textShadow:"0 0 20px #FF6B9D",animation:"comboAnim 1.2s forwards",pointerEvents:"none"}}>🔥 COMBO x{combo}!</div>}

      <div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},1fr)`,gap:"3px",background:"rgba(255,255,255,0.05)",border:"2px solid rgba(168,85,247,0.4)",borderRadius:"18px",padding:"10px",boxShadow:"0 0 40px rgba(168,85,247,0.3),inset 0 0 30px rgba(0,0,0,0.3)"}}>
        {board&&board.map((row,r)=>row.map((candy,c)=>{
          const mat=isMatched(r,c),sel=isSelected(r,c),hin=isHint(r,c);
          const isBomb=candy===BOMB,isVBomb=candy===VBOMB,isAnyBomb=isBomb||isVBomb;
          const rowBlasting=explodingRows.includes(r),colBlasting=explodingCols.includes(c);
          const newBombObj=newBombKeys.find(x=>x.key===`${r},${c}`);
          const bg=candy&&COLORS[candy]?COLORS[candy]:"transparent";
          let cls="cc";
          if(sel)cls+=" sel"; if(mat)cls+=" mat"; if(hin)cls+=" hin";
          if(isBomb&&!rowBlasting)cls+=" is-bomb"; if(isVBomb&&!colBlasting)cls+=" is-vbomb";
          if(newBombObj)cls+=" bomb-new";
          if(rowBlasting)cls+=" row-blast"; else if(colBlasting)cls+=" col-blast";
          const cellBg=isBomb?"radial-gradient(circle at 35% 35%,#FF9900 0%,#FF3300 55%,#880000 100%)":isVBomb?"radial-gradient(circle at 35% 35%,#00EEFF 0%,#0077FF 55%,#003399 100%)":rowBlasting?"rgba(255,200,0,0.9)":colBlasting?"rgba(0,200,255,0.9)":sel?`radial-gradient(circle,#fff 0%,${bg} 60%)`:`radial-gradient(circle at 35% 35%,rgba(255,255,255,0.5) 0%,${bg} 55%,rgba(0,0,0,0.2) 100%)`;
          return(
            <div key={`${r}-${c}`} className={cls} onClick={()=>handleCellClick(r,c)} style={{width:"42px",height:"42px",borderRadius:"10px",background:cellBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isAnyBomb?"1.5rem":"1.3rem",cursor:"pointer",userSelect:"none",boxShadow:isBomb?"0 0 12px #FF4400,0 4px 8px rgba(0,0,0,0.5)":isVBomb?"0 0 12px #00CFFF,0 4px 8px rgba(0,0,0,0.5)":sel?"0 0 12px #fff,0 4px 8px rgba(0,0,0,0.4)":"0 3px 6px rgba(0,0,0,0.3)",border:isBomb?"2px solid #FF6600":isVBomb?"2px solid #00EEFF":sel?"2px solid #fff":"1px solid rgba(255,255,255,0.15)",transition:"all 0.15s"}}>
              {candy}
            </div>
          );
        }))}
      </div>

      <div style={{display:"flex",gap:"10px",marginTop:"12px"}}>
        <button onClick={()=>startLevel(currentLevel)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"12px",padding:"7px 16px",color:"rgba(255,255,255,0.7)",fontSize:"0.85rem",cursor:"pointer"}}>🔄 إعادة</button>
        <button onClick={handleHint} disabled={!hintsLeft||animating} style={{background:hintsLeft?"linear-gradient(135deg,#FFD700,#FF6B9D)":"rgba(255,255,255,0.05)",border:hintsLeft?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"7px 16px",color:hintsLeft?"#1a0533":"rgba(255,255,255,0.3)",fontSize:"0.85rem",fontWeight:700,cursor:hintsLeft?"pointer":"not-allowed"}}>
          💡 ({hintsLeft}/2)
        </button>
      </div>
      <p style={{color:"rgba(255,255,255,0.2)",fontSize:"0.65rem",marginTop:"8px",textAlign:"center"}}>4 أفقي=💣صف • 4 عمودي=🧨عمود</p>
    </div>
  );
}
