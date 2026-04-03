import { useState, useCallback } from "react";

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;
function getCtx() { if (!ctx) ctx = new AudioCtx(); return ctx; }
function playSwap() { const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(520,c.currentTime);o.frequency.exponentialRampToValueAtTime(780,c.currentTime+0.1);g.gain.setValueAtTime(0.3,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15);o.start();o.stop(c.currentTime+0.15); }
function playMatch() { const c=getCtx();[0,0.07,0.14].forEach((t,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="triangle";o.frequency.setValueAtTime([440,550,660][i],c.currentTime+t);g.gain.setValueAtTime(0.25,c.currentTime+t);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+t+0.15);o.start(c.currentTime+t);o.stop(c.currentTime+t+0.15);}); }
function playWin() { const c=getCtx(),notes=[523,659,784,1047];notes.forEach((freq,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(freq,c.currentTime+i*0.12);g.gain.setValueAtTime(0.3,c.currentTime+i*0.12);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.3);o.start(c.currentTime+i*0.12);o.stop(c.currentTime+i*0.12+0.3);}); }
function playFail() { const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sawtooth";o.frequency.setValueAtTime(300,c.currentTime);o.frequency.exponentialRampToValueAtTime(100,c.currentTime+0.4);g.gain.setValueAtTime(0.2,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);o.start();o.stop(c.currentTime+0.4); }
function playCombo() { const c=getCtx(),notes=[784,988,1175,1568];notes.forEach((freq,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.setValueAtTime(freq,c.currentTime+i*0.08);g.gain.setValueAtTime(0.15,c.currentTime+i*0.08);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.08+0.12);o.start(c.currentTime+i*0.08);o.stop(c.currentTime+i*0.08+0.12);}); }

const COLS=8,ROWS=8;
const ALL_TYPES=["🍚","🌾","🫙","🧴","🍦","🍌"];
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
{level:11,targetScore:2800,moves:30,label:"عاصفة المنتجات ⚡"},
{level:12,targetScore:3300,moves:30,label:"تحدي التوفير 🔥"},
{level:13,targetScore:3900,moves:30,label:"أسطورة السوق 🌠"},
{level:14,targetScore:4600,moves:30,label:"الأستاذ الكبير 💎"},
{level:15,targetScore:5500,moves:30,label:"سيد Altawfer 🏅"},
];
function findMatches(b){const m=new Set();for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-2;c++)if(b[r][c]&&b[r][c]===b[r][c+1]&&b[r][c]===b[r][c+2])[c,c+1,c+2].forEach(x=>m.add(`${r},${x}`));for(let r=0;r<ROWS-2;r++)for(let c=0;c<COLS;c++)if(b[r][c]&&b[r][c]===b[r+1][c]&&b[r][c]===b[r+2][c])[r,r+1,r+2].forEach(x=>m.add(`${x},${c}`));return[...m].map(k=>{const[r,c]=k.split(",");return[+r,+c];});}
function createBoard(){let b;do{b=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>ALL_TYPES[Math.floor(Math.random()*ALL_TYPES.length)]));}while(findMatches(b).length>0);return b;}
function removeMatches(b,m){const nb=b.map(r=>[...r]);m.forEach(([r,c])=>{nb[r][c]=null;});return nb;}
function dropCandies(b){const nb=b.map(r=>[...r]);for(let c=0;c<COLS;c++){let e=ROWS-1;for(let r=ROWS-1;r>=0;r--){if(nb[r][c]!==null){nb[e][c]=nb[r][c];if(e!==r)nb[r][c]=null;e--;}}for(let r=e;r>=0;r--)nb[r][c]=ALL_TYPES[Math.floor(Math.random()*ALL_TYPES.length)];}return nb;}
function isAdj(r1,c1,r2,c2){return(Math.abs(r1-r2)===1&&c1===c2)||(Math.abs(c1-c2)===1&&r1===r2);}
function findHint(b){const dirs=[[0,1],[0,-1],[1,0],[-1,0]];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc;if(nr<0||nr>=ROWS||nc<0||nc>=COLS)continue;const nb=b.map(row=>[...row]);[nb[r][c],nb[nr][nc]]=[nb[nr][nc],nb[r][c]];if(findMatches(nb).length>0)return[[r,c],[nr,nc]];}return null;}
const CSS=`@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.4);opacity:0.5}100%{transform:scale(0);opacity:0}}@keyframes comboAnim{0%{transform:scale(0) rotate(-10deg);opacity:0}50%{transform:scale(1.3) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:0}}@keyframes hintPulse{0%,100%{box-shadow:0 0 10px #FFD700,0 0 20px #FFD700;transform:scale(1)}50%{box-shadow:0 0 20px #FFD700,0 0 40px #FF6B9D;transform:scale(1.18)}}@keyframes bounceIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}.cc{transition:transform 0.15s,box-shadow 0.15s;}.cc:hover{transform:scale(1.08);}.cc.sel{transform:scale(1.15);box-shadow:0 0 15px #fff,0 0 30px #fff;}.cc.mat{animation:pop 0.4s forwards;}.cc.hin{animation:hintPulse 0.6s infinite;border:2px solid #FFD700 !important;}.lvbtn{transition:transform 0.15s;}.lvbtn:hover{transform:scale(1.06);}`;
const BG={minHeight:"100vh",background:"linear-gradient(135deg,#1a0533 0%,#2d0a5e 50%,#1a0533 100%)",fontFamily:"'Segoe UI',sans-serif"};
export default function App(){
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
const[// استرجاع المرحلة المحفوظة عند بداية التشغيل
const [unlockedLevels, setUnlockedLevels] = useState(() => {
  const saved = localStorage.getItem('unlockedLevels');
  return saved ? parseInt(saved) : 1;
});

// حفظ المرحلة الجديدة تلقائياً كلما فزت بمستوى
  }, [unlockedLevels]);


const [extraMovesUsed, setExtraMovesUsed] = useState(false);
const handleExtraMoves = () => {
  if (!extraMovesUsed && moves > 0) {
    setMoves(m => m + 5);
    setExtraMovesUsed(true);
  }
};

const lv=LEVELS[currentLevel];
const  startLevel = useCallback((idx) => {
    setExtraMovesUsed(false);
    setCurrentLevel(idx);
    setScore(0);
    setMoves(LEVELS[idx].moves);
    setScreen("game");
    setBoard(createBoard());
  }, [createBoard]);

const processMatches=useCallback((b,cc,rs,ml,ts,li)=>{const matches=findMatches(b);if(matches.length===0){setAnimating(false);setMatchedCells([]);if(cc>1){playCombo();setCombo(cc);setShowCombo(true);setTimeout(()=>setShowCombo(false),1200);}if(rs>=ts){playWin();setTimeout(()=>{const next=li+1;if(next>=LEVELS.length)setScreen("win");else{setUnlockedLevels(u=>Math.max(u,next+1));setScreen("levelUp");}},500);}else if(ml<=0){playFail();setTimeout(()=>setScreen("gameOver"),500);}return;}playMatch();setMatchedCells(matches);const pts=matches.length*10*(cc+1);const nrs=rs+pts;setTimeout(()=>{setScore(s=>s+pts);const b2=removeMatches(b,matches);const b3=dropCandies(b2);setBoard(b3);setMatchedCells([]);setTimeout(()=>processMatches(b3,cc+1,nrs,ml,ts,li),300);},400);},[]);
const handleCellClick=(r,c)=>{if(animating||screen!=="game")return;if(!selected){setSelected([r,c]);return;}const[sr,sc]=selected;if(sr===r&&sc===c){setSelected(null);return;}if(isAdj(sr,sc,r,c)){const nb=board.map(row=>[...row]);[nb[sr][sc],nb[r][c]]=[nb[r][c],nb[sr][sc]];if(findMatches(nb).length>0){playSwap();setBoard(nb);setSelected(null);const nm=moves-1;setMoves(nm);setAnimating(true);processMatches(nb,0,score,nm,lv.targetScore,currentLevel);}else setSelected(null);}else setSelected([r,c]);};
const handleHint=()=>{if(hintsLeft<=0||animating)return;const hint=findHint(board);if(!hint)return;setHintsLeft(h=>h-1);setHintCells(hint);setTimeout(()=>setHintCells(null),2000);};
const isMatched=(r,c)=>matchedCells.some(([mr,mc])=>mr===r&&mc===c);
const isSelected=(r,c)=>selected&&selected[0]===r&&selected[1]===c;
const isHint=(r,c)=>hintCells&&hintCells.some(([hr,hc])=>hr===r&&hc===c);
const progress=lv?Math.min(100,Math.round((score/lv.targetScore)*100)):0;
if(screen==="levelSelect")return(<div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",padding:"24px",overflowY:"auto"}}><style>{CSS}</style><h1 style={{fontSize:"2rem",fontWeight:900,background:"linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"0 0 4px 0"}}>🛒 Market Altawfer 🛒</h1><p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.85rem",margin:"0 0 20px 0"}}>اختر المرحلة</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",width:"100%",maxWidth:"400px"}}>{LEVELS.map((l,idx)=>{const locked=idx>=unlockedLevels;const done=idx<unlockedLevels-1;return(<div key={idx} className="lvbtn" onClick={()=>!locked&&startLevel(idx)} style={{background:locked?"rgba(255,255,255,0.04)":done?"linear-gradient(135deg,#10B981,#047857)":"linear-gradient(135deg,#FF6B9D,#A855F7)",border:locked?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"12px 6px",textAlign:"center",cursor:locked?"not-allowed":"pointer",opacity:locked?0.45:1,boxShadow:locked?"none":"0 4px 14px rgba(168,85,247,0.3)"}}><div style={{fontSize:"1.3rem",marginBottom:"3px"}}>{locked?"🔒":done?"✅":"▶️"}</div><div style={{color:"#fff",fontWeight:800,fontSize:"1rem"}}>{l.level}</div><div style={{color:"rgba(255,255,255,0.65)",fontSize:"0.58rem",marginTop:"1px"}}>{l.moves} حركة</div><div style={{color:"rgba(255,255,255,0.5)",fontSize:"0.55rem"}}>{l.targetScore}⭐</div></div>);})}</div><p style={{color:"rgba(255,255,255,0.2)",fontSize:"0.7rem",marginTop:"18px"}}>اجمع النقاط المطلوبة لفتح المرحلة التالية 🏆</p></div>);
if(screen==="levelUp")return(<div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><div style={{animation:"bounceIn 0.6s forwards",textAlign:"center",padding:"40px"}}><div style={{fontSize:"5rem",marginBottom:"12px"}}>🎉</div><h2 style={{color:"#FFD700",fontSize:"2.2rem",margin:"0 0 8px 0",fontWeight:900}}>أحسنت!</h2><p style={{color:"rgba(255,255,255,0.8)",margin:"0 0 6px 0"}}>أكملت المرحلة {currentLevel+1}</p><p style={{color:"#FF6B9D",fontSize:"1.3rem",fontWeight:800,margin:"0 0 16px 0"}}>نقاطك: {score}</p><a href="https://forms.gle/oZPFpUAzmtm7Srvo8" target="_blank" rel="noreferrer" style={{display:"inline-block",marginBottom:"18px",background:"linear-gradient(135deg,#10B981,#047857)",borderRadius:"14px",padding:"11px 28px",color:"#fff",fontSize:"0.95rem",fontWeight:700,textDecoration:"none",boxShadow:"0 4px 16px rgba(16,185,129,0.4)"}}>📝 سجّل اسمك — المرحلة {currentLevel+1}</a><div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}><button onClick={()=>startLevel(currentLevel+1)} style={{background:"linear-gradient(135deg,#FF6B9D,#A855F7)",border:"none",borderRadius:"14px",padding:"12px 28px",color:"#fff",fontSize:"1rem",fontWeight:700,cursor:"pointer"}}>▶️ المرحلة {currentLevel+2}</button><button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"12px 28px",color:"rgba(255,255,255,0.8)",fontSize:"1rem",cursor:"pointer"}}>🗺️ خريطة المراحل</button></div></div></div>);
if(screen==="gameOver")return(<div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><div style={{textAlign:"center",padding:"40px"}}><div style={{fontSize:"5rem",marginBottom:"12px"}}>😔</div><h2 style={{color:"#FF4444",fontSize:"2rem",margin:"0 0 8px 0",fontWeight:900}}>انتهت الحركات!</h2><p style={{color:"rgba(255,255,255,0.7)",margin:"0 0 4px 0"}}>المرحلة {currentLevel+1} — {lv.label}</p><p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.9rem",margin:"0 0 20px 0"}}>وصلت: <span style={{color:"#FF6B9D",fontWeight:800}}>{score}</span> / {lv.targetScore}</p><div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}><button onClick={()=>startLevel(currentLevel)} style={{background:"linear-gradient(135deg,#FF6B9D,#A855F7)",border:"none",borderRadius:"14px",padding:"12px 28px",color:"#fff",fontSize:"1rem",fontWeight:700,cursor:"pointer"}}>🔄 حاول مجدداً</button><button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"12px 28px",color:"rgba(255,255,255,0.8)",fontSize:"1rem",cursor:"pointer"}}>🗺️ خريطة المراحل</button></div></div></div>);
if(screen==="win")return(<div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><div style={{animation:"bounceIn 0.6s forwards",textAlign:"center",padding:"40px"}}><div style={{fontSize:"5rem",marginBottom:"12px"}}>🏅</div><h2 style={{color:"#FFD700",fontSize:"2.2rem",margin:"0 0 8px 0",fontWeight:900}}>سيد Altawfer! 🎊</h2><p style={{color:"rgba(255,255,255,0.8)",fontSize:"1.1rem",margin:"0 0 6px 0"}}>أكملت جميع المراحل الـ 15!</p><a href="https://forms.gle/oZPFpUAzmtm7Srvo8" target="_blank" rel="noreferrer" style={{display:"inline-block",marginBottom:"16px",background:"linear-gradient(135deg,#FFD700,#FF6B9D)",borderRadius:"14px",padding:"14px 36px",color:"#1a0533",fontSize:"1.1rem",fontWeight:800,textDecoration:"none",boxShadow:"0 4px 24px rgba(255,215,0,0.5)"}}>🏆 سجّل اسمك كبطل!</a><br/><button onClick={()=>{setUnlockedLevels(1);setScreen("levelSelect");}} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"10px 28px",color:"rgba(255,255,255,0.8)",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",marginTop:"8px"}}>🔄 العب من البداية</button></div></div>);
return(<div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",color:"white",fontFamily:"'Cairo',sans-serif",direction:"rtl",position:"relative",overflow:"hidden"}}><div style={{display:"flex",gap:"10px",marginBottom:"10px",zIndex:100}}><button onClick={handleExtraMoves} disabled={extraMovesUsed || moves <= 0} style={{padding:"8px 12px",background:extraMovesUsed?"#666":"#ff9800",color:"white",border:"none",borderRadius:"10px",fontWeight:"bold",fontSize:"14px",cursor:"pointer"}}>{extraMovesUsed?"تم":"+5 🎁"}</button><button onClick={handleHint} disabled={hintsLeft<=0||animating} style={{padding:"8px 12px",background:"#fdd835",color:"#333",border:"none",borderRadius:"10px",fontWeight:"bold",fontSize:"14px",cursor:"pointer"}}>تلميح ({hintsLeft})</button><button onClick={()=>startLevel(currentLevel)} style={{padding:"8px 12px",background:"#4fc3f7",color:"white",border:"none",borderRadius:"10px",fontWeight:"bold",fontSize:"14px",cursor:"pointer"}}>إعادة</button></div><div style={{position:"relative",width:"min(95vw, 400px)",aspectRatio:"1/1",background:"rgba(255,255,255,0.1)",borderRadius:"15px",padding:"10px",boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}>{board.map((row,r)=>row.map((cell,c)=>(<div key={`${r}-${c}`} onClick={()=>handleCellClick(r,c)} style={{position:"absolute",width:`${100/COLS}%`,height:`${100/ROWS}%`,top:`${(r/ROWS)*100}%`,left:`${(c/COLS)*100}%`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"min(6vw, 24px)",cursor:"pointer",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",transform:isMatched(r,c)?"scale(0)":isSelected(r,c)?"scale(1.1)":"scale(1)",opacity:isMatched(r,c)?0:1,zIndex:isSelected(r,c)?2:1,filter:isHint(r,c)?"drop-shadow(0 0 8px #fff)":"none",background:isSelected(r,c)?"rgba(255,255,255,0.2)":"transparent",borderRadius:"8px"}}>{cell}</div>)))}</div></div>);

