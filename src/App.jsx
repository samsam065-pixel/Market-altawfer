import { useState, useCallback } from "react";

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;
function getCtx() { if (!ctx) ctx = new AudioCtx(); return ctx; }
function playSwap() { const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(520,c.currentTime);o.frequency.exponentialRampToValueAtTime(780,c.currentTime+0.1);g.gain.setValueAtTime(0.3,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15);o.start();o.stop(c.currentTime+0.15); }
function playMatch() { const c=getCtx();[0,0.07,0.14].forEach((t,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="triangle";o.frequency.setValueAtTime([440,550,660][i],c.currentTime+t);g.gain.setValueAtTime(0.25,c.currentTime+t);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+t+0.15);o.start(c.currentTime+t);o.stop(c.currentTime+t+0.15);}); }
function playWin() { const c=getCtx(),notes=[523,659,784,1047];notes.forEach((freq,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(freq,c.currentTime+i*0.12);g.gain.setValueAtTime(0.3,c.currentTime+i*0.12);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.3);o.start(c.currentTime+i*0.12);o.stop(c.currentTime+i*0.12+0.3);}); }
function playFail() { const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sawtooth";o.frequency.setValueAtTime(300,c.currentTime);o.frequency.exponentialRampToValueAtTime(100,c.currentTime+0.4);g.gain.setValueAtTime(0.2,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);o.start();o.stop(c.currentTime+0.4); }
function playCombo() { const c=getCtx(),notes=[784,988,1175,1568];notes.forEach((freq,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.setValueAtTime(freq,c.currentTime+i*0.08);g.gain.setValueAtTime(0.15,c.currentTime+i*0.08);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.08+0.12);o.start(c.currentTime+i*0.08);o.stop(c.currentTime+i*0.08+0.12);}); }
function playCoin() { const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(880,c.currentTime);o.frequency.exponentialRampToValueAtTime(1320,c.currentTime+0.08);g.gain.setValueAtTime(0.3,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.2);o.start();o.stop(c.currentTime+0.2); }
function playBomb() {
  const c=getCtx();
  const buf=c.createBuffer(1,c.sampleRate*0.5,c.sampleRate);
  const data=buf.getChannelData(0);
  for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.exp(-i/(c.sampleRate*0.08));
  const src=c.createBufferSource();
  src.buffer=buf;
  const g=c.createGain();
  src.connect(g);g.connect(c.destination);
  g.gain.setValueAtTime(0.7,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.5);
  src.start();src.stop(c.currentTime+0.5);
}

const COLS=8,ROWS=8;
const ALL_TYPES=["🍚","🌾","🫙","🧴","🍦","🍌"];
const BOMB="💣";
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
];

const MOVES_PURCHASE_COST=13;
const MOVES_PURCHASE_AMOUNT=5;
const COINS_PER_LEVEL=5;

// إيجاد تطابقات + كشف تسلسل 4 لتوليد قنبلة
function findMatchesAndBombs(b){
  const matchSet=new Set();
  const bombPositions=[];
  // أفقي
  for(let r=0;r<ROWS;r++){
    let c=0;
    while(c<COLS){
      if(!b[r][c]||b[r][c]===BOMB){c++;continue;}
      let len=1;
      while(c+len<COLS&&b[r][c+len]===b[r][c])len++;
      if(len>=4){
        const mid=c+Math.floor(len/2);
        bombPositions.push({r,c:mid});
        for(let i=0;i<len;i++)if(c+i!==mid)matchSet.add(`${r},${c+i}`);
      }else if(len===3){
        for(let i=0;i<3;i++)matchSet.add(`${r},${c+i}`);
      }
      c+=len;
    }
  }
  // عمودي (3 فقط)
  for(let c=0;c<COLS;c++){
    let r=0;
    while(r<ROWS){
      if(!b[r][c]||b[r][c]===BOMB){r++;continue;}
      let len=1;
      while(r+len<ROWS&&b[r+len][c]===b[r][c])len++;
      if(len>=3){for(let i=0;i<len;i++)matchSet.add(`${r+i},${c}`);}
      r+=len;
    }
  }
  const matches=[...matchSet].map(k=>{const[r,c]=k.split(",");return[+r,+c];});
  return{matches,bombPositions};
}

function findMatches(b){return findMatchesAndBombs(b).matches;}

function explodeBombs(b){
  const nb=b.map(r=>[...r]);
  const explodedRows=new Set();
  for(let r=0;r<ROWS;r++)
    for(let c=0;c<COLS;c++)
      if(nb[r][c]===BOMB)explodedRows.add(r);
  if(explodedRows.size===0)return{board:nb,explodedRows:[]};
  explodedRows.forEach(r=>{for(let c=0;c<COLS;c++)nb[r][c]=null;});
  return{board:nb,explodedRows:[...explodedRows]};
}

function createBoard(){
  let b;
  do{b=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>ALL_TYPES[Math.floor(Math.random()*ALL_TYPES.length)]));}
  while(findMatches(b).length>0);
  return b;
}
function removeMatches(b,m){const nb=b.map(r=>[...r]);m.forEach(([r,c])=>{nb[r][c]=null;});return nb;}
function placeBombs(b,bombs){const nb=b.map(r=>[...r]);bombs.forEach(({r,c})=>{nb[r][c]=BOMB;});return nb;}
function dropCandies(b){const nb=b.map(r=>[...r]);for(let c=0;c<COLS;c++){let e=ROWS-1;for(let r=ROWS-1;r>=0;r--){if(nb[r][c]!==null){nb[e][c]=nb[r][c];if(e!==r)nb[r][c]=null;e--;}}for(let r=e;r>=0;r--)nb[r][c]=ALL_TYPES[Math.floor(Math.random()*ALL_TYPES.length)];}return nb;}
function isAdj(r1,c1,r2,c2){return(Math.abs(r1-r2)===1&&c1===c2)||(Math.abs(c1-c2)===1&&r1===r2);}
function findHint(b){const dirs=[[0,1],[0,-1],[1,0],[-1,0]];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc;if(nr<0||nr>=ROWS||nc<0||nc>=COLS)continue;const nb=b.map(row=>[...row]);[nb[r][c],nb[nr][nc]]=[nb[nr][nc],nb[r][c]];if(findMatches(nb).length>0)return[[r,c],[nr,nc]];}return null;}

const CSS=`
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.4);opacity:0.5}100%{transform:scale(0);opacity:0}}
@keyframes comboAnim{0%{transform:scale(0) rotate(-10deg);opacity:0}50%{transform:scale(1.3) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:0}}
@keyframes hintPulse{0%,100%{box-shadow:0 0 10px #FFD700,0 0 20px #FFD700;transform:scale(1)}50%{box-shadow:0 0 20px #FFD700,0 0 40px #FF6B9D;transform:scale(1.18)}}
@keyframes bounceIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
@keyframes coinPop{0%{transform:scale(0) translateY(0);opacity:1}80%{transform:scale(1.4) translateY(-30px);opacity:1}100%{transform:scale(1) translateY(-40px);opacity:0}}
@keyframes bombPulse{0%,100%{box-shadow:0 0 10px #FF4400,0 0 20px #FF8800;transform:scale(1)}50%{box-shadow:0 0 20px #FF4400,0 0 40px #FF8800;transform:scale(1.15)}}
@keyframes bombAppear{0%{transform:scale(0) rotate(-180deg);opacity:0}60%{transform:scale(1.6) rotate(15deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes rowExplode{0%{opacity:1;background:rgba(255,100,0,0.9)}40%{background:rgba(255,230,0,0.9)}100%{opacity:0;transform:scaleY(0)}}
.cc{transition:transform 0.15s,box-shadow 0.15s;}.cc:hover{transform:scale(1.08);}
.cc.sel{transform:scale(1.15);box-shadow:0 0 15px #fff,0 0 30px #fff;}
.cc.mat{animation:pop 0.4s forwards;}
.cc.hin{animation:hintPulse 0.6s infinite;border:2px solid #FFD700 !important;}
.cc.is-bomb{animation:bombPulse 1.2s infinite;}
.cc.bomb-new{animation:bombAppear 0.6s forwards;}
.cc.row-blast{animation:rowExplode 0.5s forwards;}
.lvbtn{transition:transform 0.15s;}.lvbtn:hover{transform:scale(1.06);}
.coin-anim{animation:coinPop 1s forwards;position:fixed;font-size:1.5rem;pointer-events:none;z-index:200;}
`;

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
  const[unlockedLevels,setUnlockedLevels]=useState(1);
  const[coins,setCoins]=useState(0);
  const[showCoinAnim,setShowCoinAnim]=useState(false);
  const[coinAnimKey,setCoinAnimKey]=useState(0);
  const[notEnoughCoins,setNotEnoughCoins]=useState(false);
  const[explodingRows,setExplodingRows]=useState([]);
  const[newBombKeys,setNewBombKeys]=useState([]);
  const[showBombMsg,setShowBombMsg]=useState(false);

  const lv=LEVELS[currentLevel];

  const startLevel=useCallback((idx)=>{
    setCurrentLevel(idx);setBoard(createBoard());setScore(0);setMoves(LEVELS[idx].moves);
    setSelected(null);setAnimating(false);setMatchedCells([]);setHintsLeft(2);setHintCells(null);
    setCombo(0);setNotEnoughCoins(false);setExplodingRows([]);setNewBombKeys([]);setShowBombMsg(false);
    setScreen("game");
  },[]);

  const buyMoves=()=>{
    if(coins<MOVES_PURCHASE_COST){setNotEnoughCoins(true);setTimeout(()=>setNotEnoughCoins(false),2000);return;}
    setCoins(c=>c-MOVES_PURCHASE_COST);setMoves(m=>m+MOVES_PURCHASE_AMOUNT);playCoin();setScreen("game");
  };

  const processMatches=useCallback((b,cc,rs,ml,ts,li)=>{
    // أولاً: تفجير قنابل موجودة
    const{board:afterBombs,explodedRows}=explodeBombs(b);
    if(explodedRows.length>0){
      playBomb();
      setExplodingRows(explodedRows);
      const bombPts=explodedRows.length*COLS*15*(cc+1);
      const nrs=rs+bombPts;
      setTimeout(()=>{
        setScore(s=>s+bombPts);
        setExplodingRows([]);
        const b3=dropCandies(afterBombs);
        setBoard(b3);
        setTimeout(()=>processMatches(b3,cc+1,nrs,ml,ts,li),300);
      },550);
      return;
    }
    // ثانياً: تطابقات عادية + توليد قنابل
    const{matches,bombPositions}=findMatchesAndBombs(b);
    if(matches.length===0&&bombPositions.length===0){
      setAnimating(false);setMatchedCells([]);
      if(cc>1){playCombo();setCombo(cc);setShowCombo(true);setTimeout(()=>setShowCombo(false),1200);}
      if(rs>=ts){
        playWin();setCoins(c=>c+COINS_PER_LEVEL);setShowCoinAnim(true);setCoinAnimKey(k=>k+1);
        setTimeout(()=>setShowCoinAnim(false),1200);
        setTimeout(()=>{const next=li+1;if(next>=LEVELS.length)setScreen("win");else{setUnlockedLevels(u=>Math.max(u,next+1));setScreen("levelUp");}},600);
      }else if(ml<=0){playFail();setTimeout(()=>setScreen("gameOver"),500);}
      return;
    }
    playMatch();
    setMatchedCells(matches);
    const pts=matches.length*10*(cc+1);
    const nrs=rs+pts;
    setTimeout(()=>{
      setScore(s=>s+pts);
      let b2=removeMatches(b,matches);
      if(bombPositions.length>0){
        b2=placeBombs(b2,bombPositions);
        setNewBombKeys(bombPositions.map(({r,c})=>`${r},${c}`));
        setShowBombMsg(true);
        setTimeout(()=>{setNewBombKeys([]);setShowBombMsg(false);},1200);
      }
      const b3=dropCandies(b2);
      setBoard(b3);setMatchedCells([]);
      setTimeout(()=>processMatches(b3,cc+1,nrs,ml,ts,li),300);
    },400);
  },[]);

  const handleCellClick=(r,c)=>{
    if(animating||screen!=="game")return;
    if(!selected){setSelected([r,c]);return;}
    const[sr,sc]=selected;
    if(sr===r&&sc===c){setSelected(null);return;}
    if(isAdj(sr,sc,r,c)){
      const nb=board.map(row=>[...row]);
      [nb[sr][sc],nb[r][c]]=[nb[r][c],nb[sr][sc]];
      const hasBombMove=nb[sr][sc]===BOMB||nb[r][c]===BOMB;
      if(findMatches(nb).length>0||hasBombMove){
        playSwap();setBoard(nb);setSelected(null);
        const nm=moves-1;setMoves(nm);setAnimating(true);
        processMatches(nb,0,score,nm,lv.targetScore,currentLevel);
      }else setSelected(null);
    }else setSelected([r,c]);
  };

  const handleHint=()=>{
    if(hintsLeft<=0||animating)return;
    const hint=findHint(board);if(!hint)return;
    setHintsLeft(h=>h-1);setHintCells(hint);setTimeout(()=>setHintCells(null),2000);
  };

  const isMatched=(r,c)=>matchedCells.some(([mr,mc])=>mr===r&&mc===c);
  const isSelected=(r,c)=>selected&&selected[0]===r&&selected[1]===c;
  const isHint=(r,c)=>hintCells&&hintCells.some(([hr,hc])=>hr===r&&hc===c);
  const progress=lv?Math.min(100,Math.round((score/lv.targetScore)*100)):0;

  const CoinBar=()=>(
    <div style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,215,0,0.12)",border:"1px solid rgba(255,215,0,0.35)",borderRadius:"20px",padding:"4px 14px",fontSize:"0.9rem",fontWeight:800,color:"#FFD700"}}>
      🪙 <span>{coins}</span>
    </div>
  );

  if(screen==="levelSelect")return(
    <div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",padding:"24px",overflowY:"auto"}}>
      <style>{CSS}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",maxWidth:"400px",marginBottom:"12px"}}>
        <h1 style={{fontSize:"1.8rem",fontWeight:900,background:"linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0}}>🛒 Market Altawfer</h1>
        <CoinBar/>
      </div>
      <p style={{color:"rgba(255,215,0,0.8)",fontSize:"0.8rem",margin:"0 0 18px 0",background:"rgba(255,100,0,0.1)",border:"1px solid rgba(255,100,0,0.3)",borderRadius:"10px",padding:"6px 16px"}}>
        💣 طابق 4 متشابهين أفقياً = قنبلة تدمر الصف كاملاً!
      </p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",width:"100%",maxWidth:"400px"}}>
        {LEVELS.map((l,idx)=>{
          const locked=idx>=unlockedLevels,done=idx<unlockedLevels-1;
          return(
            <div key={idx} className="lvbtn" onClick={()=>!locked&&startLevel(idx)} style={{background:locked?"rgba(255,255,255,0.04)":done?"linear-gradient(135deg,#10B981,#047857)":"linear-gradient(135deg,#FF6B9D,#A855F7)",border:locked?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"12px 6px",textAlign:"center",cursor:locked?"not-allowed":"pointer",opacity:locked?0.45:1,boxShadow:locked?"none":"0 4px 14px rgba(168,85,247,0.3)"}}>
              <div style={{fontSize:"1.3rem",marginBottom:"3px"}}>{locked?"🔒":done?"✅":"▶️"}</div>
              <div style={{color:"#fff",fontWeight:800,fontSize:"1rem"}}>{l.level}</div>
              <div style={{color:"rgba(255,255,255,0.65)",fontSize:"0.58rem"}}>{l.moves} حركة</div>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:"0.55rem"}}>{l.targetScore}⭐</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if(screen==="gameOver")return(
    <div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",padding:"32px 24px",maxWidth:"360px",width:"100%"}}>
        <div style={{fontSize:"4rem",marginBottom:"10px"}}>😔</div>
        <h2 style={{color:"#FF4444",fontSize:"2rem",margin:"0 0 6px 0",fontWeight:900}}>انتهت الحركات!</h2>
        <p style={{color:"rgba(255,255,255,0.7)",margin:"0 0 4px 0"}}>المرحلة {currentLevel+1} — {lv.label}</p>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.9rem",margin:"0 0 20px 0"}}>وصلت: <span style={{color:"#FF6B9D",fontWeight:800}}>{score}</span> / {lv.targetScore}</p>
        <div style={{background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:"14px",padding:"12px",marginBottom:"16px"}}>
          <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.78rem",marginBottom:"4px"}}>رصيدك الحالي</div>
          <div style={{color:"#FFD700",fontSize:"1.6rem",fontWeight:900}}>🪙 {coins}</div>
        </div>
        <button onClick={buyMoves} disabled={coins<MOVES_PURCHASE_COST} style={{width:"100%",background:coins>=MOVES_PURCHASE_COST?"linear-gradient(135deg,#FFD700,#FF9800)":"rgba(255,255,255,0.06)",border:coins>=MOVES_PURCHASE_COST?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",padding:"13px 20px",color:coins>=MOVES_PURCHASE_COST?"#1a0533":"rgba(255,255,255,0.3)",fontSize:"1rem",fontWeight:800,cursor:coins>=MOVES_PURCHASE_COST?"pointer":"not-allowed",marginBottom:"8px",boxShadow:coins>=MOVES_PURCHASE_COST?"0 0 18px rgba(255,215,0,0.45)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
          ➕ شراء {MOVES_PURCHASE_AMOUNT} حركات <span style={{background:"rgba(0,0,0,0.15)",borderRadius:"8px",padding:"2px 10px"}}>🪙 {MOVES_PURCHASE_COST}</span>
        </button>
        {notEnoughCoins&&<div style={{color:"#FF4444",fontSize:"0.82rem",marginBottom:"10px",fontWeight:700}}>❌ لا يوجد عملات كافية!</div>}
        <div style={{color:"rgba(255,255,255,0.35)",fontSize:"0.72rem",marginBottom:"16px"}}>تكسب {COINS_PER_LEVEL}🪙 عند إكمال كل مرحلة</div>
        <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
          <button onClick={()=>startLevel(currentLevel)} style={{background:"linear-gradient(135deg,#FF6B9D,#A855F7)",border:"none",borderRadius:"14px",padding:"11px 22px",color:"#fff",fontSize:"0.95rem",fontWeight:700,cursor:"pointer"}}>🔄 حاول مجدداً</button>
          <button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"11px 22px",color:"rgba(255,255,255,0.8)",fontSize:"0.95rem",cursor:"pointer"}}>🗺️ المراحل</button>
        </div>
      </div>
    </div>
  );

  if(screen==="levelUp")return(
    <div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      {showCoinAnim&&<div key={coinAnimKey} className="coin-anim" style={{top:"30%",left:"48%"}}>+{COINS_PER_LEVEL}🪙</div>}
      <div style={{animation:"bounceIn 0.6s forwards",textAlign:"center",padding:"40px"}}>
        <div style={{fontSize:"5rem",marginBottom:"12px"}}>🎉</div>
        <h2 style={{color:"#FFD700",fontSize:"2.2rem",margin:"0 0 8px 0",fontWeight:900}}>أحسنت!</h2>
        <p style={{color:"rgba(255,255,255,0.8)",margin:"0 0 4px 0"}}>أكملت المرحلة {currentLevel+1}</p>
        <p style={{color:"#FF6B9D",fontSize:"1.3rem",fontWeight:800,margin:"0 0 4px 0"}}>نقاطك: {score}</p>
        <div style={{color:"#FFD700",fontSize:"1rem",fontWeight:700,marginBottom:"16px"}}>🪙 +{COINS_PER_LEVEL} عملات! (رصيدك: {coins})</div>
        <a href="https://forms.gle/oZPFpUAzmtm7Srvo8" target="_blank" rel="noreferrer" style={{display:"inline-block",marginBottom:"18px",background:"linear-gradient(135deg,#10B981,#047857)",borderRadius:"14px",padding:"11px 28px",color:"#fff",fontSize:"0.95rem",fontWeight:700,textDecoration:"none"}}>📝 سجّل اسمك — المرحلة {currentLevel+1}</a>
        <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>startLevel(currentLevel+1)} style={{background:"linear-gradient(135deg,#FF6B9D,#A855F7)",border:"none",borderRadius:"14px",padding:"12px 28px",color:"#fff",fontSize:"1rem",fontWeight:700,cursor:"pointer"}}>▶️ المرحلة {currentLevel+2}</button>
          <button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"12px 28px",color:"rgba(255,255,255,0.8)",fontSize:"1rem",cursor:"pointer"}}>🗺️ خريطة المراحل</button>
        </div>
      </div>
    </div>
  );

  if(screen==="win")return(
    <div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{animation:"bounceIn 0.6s forwards",textAlign:"center",padding:"40px"}}>
        <div style={{fontSize:"5rem",marginBottom:"12px"}}>🏅</div>
        <h2 style={{color:"#FFD700",fontSize:"2.2rem",margin:"0 0 8px 0",fontWeight:900}}>سيد Altawfer! 🎊</h2>
        <p style={{color:"rgba(255,255,255,0.8)",fontSize:"1.1rem",margin:"0 0 4px 0"}}>أكملت جميع المراحل الـ 15!</p>
        <div style={{color:"#FFD700",fontSize:"1rem",fontWeight:700,marginBottom:"16px"}}>🪙 رصيدك: {coins} عملة</div>
        <a href="https://forms.gle/oZPFpUAzmtm7Srvo8" target="_blank" rel="noreferrer" style={{display:"inline-block",marginBottom:"16px",background:"linear-gradient(135deg,#FFD700,#FF6B9D)",borderRadius:"14px",padding:"14px 36px",color:"#1a0533",fontSize:"1.1rem",fontWeight:800,textDecoration:"none"}}>🏆 سجّل اسمك كبطل!</a><br/>
        <button onClick={()=>{setUnlockedLevels(1);setCoins(0);setScreen("levelSelect");}} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"14px",padding:"10px 28px",color:"rgba(255,255,255,0.8)",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",marginTop:"8px"}}>🔄 العب من البداية</button>
      </div>
    </div>
  );

  // شاشة اللعبة
  return(
    <div style={{...BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px",position:"relative",overflow:"hidden"}}>
      <style>{CSS}</style>
      {showCoinAnim&&<div key={coinAnimKey} className="coin-anim" style={{top:"15%",left:"50%"}}>+{COINS_PER_LEVEL}🪙</div>}
      {showBombMsg&&(
        <div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",zIndex:100,fontSize:"2.2rem",fontWeight:900,color:"#FF4400",textShadow:"0 0 20px #FF8800,0 0 40px #FF4400",animation:"comboAnim 1.2s forwards",pointerEvents:"none",whiteSpace:"nowrap"}}>
          💣 قنبلة جديدة!
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px",width:"100%",maxWidth:"390px",justifyContent:"space-between"}}>
        <button onClick={()=>setScreen("levelSelect")} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"10px",padding:"6px 12px",color:"rgba(255,255,255,0.7)",fontSize:"0.8rem",cursor:"pointer"}}>🗺️ المراحل</button>
        <h1 style={{fontSize:"1.2rem",fontWeight:900,margin:0,background:"linear-gradient(90deg,#FF6B9D,#A855F7,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>🛒 Market Altawfer</h1>
        <CoinBar/>
      </div>

      <div style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:"12px",padding:"5px 18px",marginBottom:"10px",color:"#A855F7",fontWeight:700,fontSize:"0.82rem"}}>
        المرحلة {currentLevel+1} / 15 — {lv.label}
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

      {showCombo&&(
        <div style={{position:"fixed",top:"25%",left:"50%",transform:"translateX(-50%)",zIndex:100,fontSize:"3rem",fontWeight:900,color:"#FFD700",textShadow:"0 0 20px #FF6B9D",animation:"comboAnim 1.2s forwards",pointerEvents:"none"}}>
          🔥 COMBO x{combo}!
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},1fr)`,gap:"3px",background:"rgba(255,255,255,0.05)",border:"2px solid rgba(168,85,247,0.4)",borderRadius:"18px",padding:"10px",boxShadow:"0 0 40px rgba(168,85,247,0.3),inset 0 0 30px rgba(0,0,0,0.3)"}}>
        {board&&board.map((row,r)=>row.map((candy,c)=>{
          const mat=isMatched(r,c);
          const sel=isSelected(r,c);
          const hin=isHint(r,c);
          const isBomb=candy===BOMB;
          const isBlasting=explodingRows.includes(r);
          const isNewB=newBombKeys.includes(`${r},${c}`);
          const bg=candy&&COLORS[candy]?COLORS[candy]:"transparent";

          let cls="cc";
          if(sel)cls+=" sel";
          if(mat)cls+=" mat";
          if(hin)cls+=" hin";
          if(isBomb&&!isBlasting)cls+=" is-bomb";
          if(isNewB)cls+=" bomb-new";
          if(isBlasting)cls+=" row-blast";

          return(
            <div key={`${r}-${c}`} className={cls} onClick={()=>handleCellClick(r,c)} style={{
              width:"42px",height:"42px",borderRadius:"10px",
              background: isBomb
                ?"radial-gradient(circle at 35% 35%,#FF9900 0%,#FF3300 55%,#880000 100%)"
                :isBlasting
                  ?"rgba(255,150,0,0.9)"
                  :sel
                    ?`radial-gradient(circle,#fff 0%,${bg} 60%)`
                    :`radial-gradient(circle at 35% 35%,rgba(255,255,255,0.5) 0%,${bg} 55%,rgba(0,0,0,0.2) 100%)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:isBomb?"1.5rem":"1.3rem",
              cursor:"pointer",userSelect:"none",
              boxShadow:isBomb?"0 0 12px #FF4400,0 4px 8px rgba(0,0,0,0.5)":sel?"0 0 12px #fff,0 4px 8px rgba(0,0,0,0.4)":"0 3px 6px rgba(0,0,0,0.3)",
              border:isBomb?"2px solid #FF6600":sel?"2px solid #fff":"1px solid rgba(255,255,255,0.15)",
              transition:"all 0.15s"
            }}>
              {candy}
            </div>
          );
        }))}
      </div>

      <div style={{display:"flex",gap:"10px",marginTop:"12px"}}>
        <button onClick={()=>startLevel(currentLevel)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"12px",padding:"7px 16px",color:"rgba(255,255,255,0.7)",fontSize:"0.85rem",cursor:"pointer"}}>🔄 إعادة</button>
        <button onClick={handleHint} disabled={hintsLeft<=0||animating} style={{background:hintsLeft>0?"linear-gradient(135deg,#FFD700,#FF6B9D)":"rgba(255,255,255,0.05)",border:hintsLeft>0?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"7px 16px",color:hintsLeft>0?"#1a0533":"rgba(255,255,255,0.3)",fontSize:"0.85rem",fontWeight:700,cursor:hintsLeft>0?"pointer":"not-allowed"}}>
          💡 مساعدة ({hintsLeft}/2)
        </button>
      </div>
      <p style={{color:"rgba(255,255,255,0.25)",fontSize:"0.68rem",marginTop:"8px"}}>طابق 3+ للنقاط • طابق 4 أفقياً = 💣 تدمر الصف!</p>
    </div>
  );
}

