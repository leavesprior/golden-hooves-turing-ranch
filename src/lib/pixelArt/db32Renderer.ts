// @ts-nocheck
/* eslint-disable */
// ============================================================================
// DB32 32/64-bit pixel-art scene renderer for the LIVE BOBR web game.
// FAITHFUL LIFT of the working PIXEL_ART module from
//   ~/Neoma_os/clawd/game/bobr-improvements/demo/32-64bit-visual-layer.html
// (DawnBringer DB32 palette, 320x180 internal buffer, nearest-neighbor upscale,
//  1px top-left light, deterministic scatter). 12 Gold Country scenes + HUD.
// Self-contained: no assets, no external state. Call client-side only (uses
// document.createElement for its internal buffer). createDB32Renderer() returns
//   { renderScene(ctx,w,h,loc,st,logArr), pickScene? , scenes[] }.
// ============================================================================

    export function createDB32Renderer() {
      const IW = 320, IH = 180;
      let _st: any = null;
      const buf = document.createElement('canvas'); buf.width = IW; buf.height = IH;
      const b = buf.getContext('2d'); b.imageSmoothingEnabled = false;

      // DawnBringer DB32 — known-good fixed palette (palette discipline = the
      // single most falsifiable "is it really pixel art" property, per the plan).
      const P = {
        ink:'#000000', dusk:'#222034', plum:'#45283c', bark:'#663931',
        wood:'#8f563b', orange:'#df7126', tan:'#d9a066', cream:'#eec39a',
        yellow:'#fbf236', lime:'#99e550', green:'#6abe30', teal:'#37946e',
        moss:'#4b692f', olive:'#524b24', slate:'#323c39', navy:'#3f3f74',
        blue:'#306082', azure:'#5b6ee1', sky:'#639bff', cyan:'#5fcde4',
        ice:'#cbdbfc', white:'#ffffff', steel:'#9badb7', gray:'#847e87',
        dgray:'#696a6a', ash:'#595652', purple:'#76428a', red:'#ac3232',
        rose:'#d95763', pink:'#d77bba', sage:'#8f974a', brass:'#8a6f30'
      };
      const BOOKS = [P.red,P.teal,P.navy,P.brass,P.moss,P.plum,P.orange,P.blue,P.olive,P.rose];

      // deterministic RNG so "scatter" is authored-looking and identical each load
      function rng(seed){ let t=(seed>>>0)||1; return function(){ t+=0x6D2B79F5; let x=Math.imul(t^(t>>>15),1|t); x^=x+Math.imul(x^(x>>>7),61|x); return ((x^(x>>>14))>>>0)/4294967296; }; }
      function rect(x,y,w,h,c){ b.fillStyle=c; b.fillRect(x|0,y|0,Math.max(1,w|0),Math.max(1,h|0)); }
      function block(x,y,w,h,base,light,dark){ rect(x,y,w,h,base); b.fillStyle=light; b.fillRect(x|0,y|0,w|0,1); b.fillRect(x|0,y|0,1,h|0); b.fillStyle=dark; b.fillRect(x|0,(y+h-1)|0,w|0,1); b.fillRect((x+w-1)|0,y|0,1,h|0); }
      function dith(x,y,w,h,c,prob,r){ b.fillStyle=c; for(let j=0;j<h;j++) for(let i=0;i<w;i++){ if(((i+j)&1)===0 && r()<prob) b.fillRect((x+i)|0,(y+j)|0,1,1); } }
      function glow(cx,cy,rad,c,a){ b.save(); b.globalAlpha=a; b.fillStyle=c; for(let rr=rad;rr>0;rr-=2){ b.globalAlpha=a*(rr/rad); b.beginPath(); b.arc(cx,cy,rr,0,6.2832); b.fill(); } b.restore(); }
      function vignette(){ b.save(); b.globalAlpha=0.30; b.fillStyle=P.ink; b.fillRect(0,0,IW,8); b.fillRect(0,IH-10,IW,10); b.fillRect(0,0,10,IH); b.fillRect(IW-10,0,10,IH); b.restore(); }

      // ---- map panel (continents on a wall) ----
      function mapPanel(x,y,w,h,r){ block(x,y,w,h,P.bark,P.wood,P.plum); rect(x+2,y+2,w-4,h-4,P.blue); for(let i=0;i<14;i++){ const cw=3+((r()*7)|0), ch=2+((r()*5)|0); rect(x+3+r()*(w-7),y+3+r()*(h-7),cw,ch,r()<0.5?P.tan:P.sage); } b.fillStyle=P.dusk; for(let gx=x+3;gx<x+w-3;gx+=6) b.fillRect(gx,y+2,1,h-4); }

      // ===== SCENE: isometric detective office (the hero / image.jpg style) =====
      function drawOffice(st,r){
        rect(0,0,IW,IH,P.dusk);
        // two back walls forming a room corner
        rect(20,16,140,66,P.slate); dith(20,16,140,66,P.teal,0.10,r);
        rect(160,16,140,66,'#2b3b34'); dith(160,16,140,66,P.teal,0.08,r);
        rect(158,16,4,66,P.ink); // corner seam
        rect(20,78,280,4,P.bark); // wall base trim
        // wood floor with perspective planks + rug
        rect(20,82,280,98,P.bark);
        for(let yy=84; yy<180; yy+=6){ b.fillStyle=P.plum; b.fillRect(20,yy,280,1); b.fillStyle=P.wood; b.fillRect(20,yy+1,280,1); }
        dith(20,82,280,98,P.wood,0.06,r);
        block(96,120,128,46,P.navy,P.blue,P.ink); for(let i=0;i<10;i++) rect(100+i*12,124+(i%2)*18,6,6,P.brass); // patterned rug
        // wall maps
        mapPanel(28,24,54,38,r); mapPanel(214,22,58,42,r);
        // bookshelf
        block(120,26,34,52,P.bark,P.wood,P.ink); for(let sh=0;sh<4;sh++){ rect(122,30+sh*12,30,1,P.plum); for(let bk=0;bk<7;bk++) rect(123+bk*4,31+sh*12,3,9,BOOKS[(sh*7+bk)%BOOKS.length]); }
        // red coat on stand (Carmen focal)
        rect(170,40,1,30,P.gray); rect(166,38,9,3,P.gray); // pole+shoulders
        block(164,41,13,22,P.red,P.rose,P.plum); rect(168,41,3,22,P.rose); // coat + sheen
        b.fillStyle=P.brass; b.beginPath(); b.arc(170,35,4,0,6.2832); b.fill(); rect(166,35,8,2,P.bark); // hat
        // CRT cluster (left) — beige monitors w/ green text
        for(let m=0;m<2;m++){ const mx=30+m*30, my=92+m*8; block(mx,my,24,18,P.steel,P.ice,P.ash); rect(mx+2,my+2,20,12,P.ink); for(let ln=0;ln<4;ln++) rect(mx+3,my+3+ln*3,2+((r()*14)|0),1,P.green); block(mx+3,my+20,18,4,P.gray,P.steel,P.ash); }
        rect(28,112,60,4,P.bark); // low desk under CRTs
        // main desk + seated detective
        block(118,112,72,26,P.wood,P.tan,P.plum); rect(120,114,68,2,P.cream);
        block(146,120,20,14,P.ink,P.dgray,P.ink); rect(148,122,16,9,P.cyan); for(let ln=0;ln<3;ln++) rect(149,123+ln*3,10,1,P.azure); // desk monitor
        rect(126,108,18,8,P.tan); b.fillStyle=P.bark; b.beginPath(); b.arc(135,104,6,3.14,6.2832); b.fill(); rect(129,101,12,3,P.bark); // detective hat/shoulders
        for(let i=0;i<5;i++) rect(168+i*3,124,4,5,P.cream); // desk papers
        // shadow spy (right)
        block(228,92,16,34,P.navy,P.azure,P.ink); rect(228,92,2,34,P.sky); // rim light
        rect(230,90,12,6,P.dusk); rect(231,88,10,3,P.ink); // hat
        rect(232,96,8,2,P.white); rect(232,99,8,1,P.ink); // collar + shades line
        // wall sconces + warm light pools
        rect(36,52,3,5,P.brass); rect(284,50,3,5,P.brass);
        glow(38,54,16,P.orange,0.10); glow(286,52,16,P.orange,0.10); glow(156,128,30,P.cream,0.06);
        // scattered floor papers + small busts
        for(let i=0;i<16;i++){ const px=30+r()*260, py=140+r()*36; block(px,py,4,3,P.cream,P.white,P.gray); }
        rect(112,70,6,8,P.gray); rect(202,70,6,8,P.gray); // busts on shelf ends
        vignette();
      }

      // ===== SCENE: Carmen-style world travel map =====
      function drawMap(st,r){
        rect(0,0,IW,IH,P.blue); dith(0,0,IW,IH,P.navy,0.08,r);
        for(let i=0;i<7;i++){ const cw=30+((r()*70)|0), ch=18+((r()*34)|0); block(20+r()*240,18+r()*120,cw,ch,P.sage,P.tan,P.moss); }
        b.fillStyle=P.ice; for(let gx=0;gx<IW;gx+=24) b.fillRect(gx,0,1,IH); for(let gy=0;gy<IH;gy+=24) b.fillRect(0,gy,IW,1);
        const pins=[[60,70],[140,50],[210,96],[260,60]];
        b.strokeStyle=P.rose; b.lineWidth=1; b.beginPath(); b.moveTo(pins[0][0],pins[0][1]); for(let i=1;i<pins.length;i++) b.lineTo(pins[i][0],pins[i][1]); b.stroke();
        pins.forEach((p,i)=>{ b.fillStyle=i===0?P.yellow:P.red; b.beginPath(); b.arc(p[0],p[1],2.5,0,6.2832); b.fill(); });
        block(248,12,60,46,P.bark,P.wood,P.ink); rect(252,16,52,30,P.tan); rect(262,20,32,22,P.plum); rect(268,24,20,12,P.cream); b.fillStyle=P.ink; b.font='6px monospace'; b.fillText('WANTED',258,54); // wanted poster
        block(8,8,70,12,P.slate,P.teal,P.ink); b.fillStyle=P.green; b.font='7px monospace'; b.fillText('TRAIL MAP',12,17);
        vignette();
      }

      // ===== SCENE: Shining/Chrono battle field =====
      function drawBattle(st,r,loc){
        for(let y=0;y<70;y++){ rect(0,y,IW, 1, y<28?P.azure:(y<46?P.sky:P.cyan)); }
        for(let i=0;i<26;i++){ const mx=i*14-((r()*8)|0); const mh=16+((r()*22)|0); b.fillStyle=P.slate; b.beginPath(); b.moveTo(mx,70); b.lineTo(mx+14,70); b.lineTo(mx+7,70-mh); b.fill(); }
        rect(0,64,IW,8,P.moss);
        for(let y=70;y<180;y++){ rect(0,y,IW,1, (y&1)? P.teal:P.moss); }
        for(let i=0;i<60;i++){ rect(r()*IW,72+r()*100,1,2,P.green); }
        rect(60,150,18,7,P.olive); rect(220,156,16,8,P.olive); // rocks
        // hero (blue/tan) vs foe (skeleton gray)
        block(96,104,12,22,P.azure,P.sky,P.navy); rect(100,98,6,7,P.tan); rect(108,108,8,2,P.steel); // hero+head+sword
        block(206,100,12,24,P.steel,P.white,P.dgray); rect(210,94,6,7,P.steel); rect(196,104,10,2,P.ice); rect(206,98,3,10,P.red); // skeleton+shield(red cape)
        // ornate UI boxes (gold frame, blue fill)
        block(214,8,96,26,P.brass,P.yellow,P.bark); rect(218,12,88,18,P.navy); b.fillStyle=P.white; b.font='7px monospace'; b.fillText('PROSPECTOR  HP', 222,20); rect(286,15,18,4,P.red); rect(286,15,12,4,P.lime);
        block(10,150,300,24,P.brass,P.yellow,P.bark); rect(14,154,292,16,P.navy); b.fillStyle=P.ice; b.font='8px monospace'; b.fillText('The witness remembers your trail. Attack or speak?',20,165);
        vignette();
      }

      // ===== Fallout/Carmen-fusion HUD (drawn at full res for crisp text) =====
      function drawHUD(ctx,w,h,st,loc,logArr,factOverride,labelOverride){
        const bh=Math.max(34,Math.round(h*0.16)); const y0=h-bh;
        ctx.imageSmoothingEnabled=false;
        ctx.fillStyle='#2a2620'; ctx.fillRect(0,y0,w,bh);
        ctx.fillStyle='#5a5048'; ctx.fillRect(0,y0,w,2);
        ctx.fillStyle='#15120d'; ctx.fillRect(0,y0+bh-2,w,2);
        for(let rx=8;rx<w;rx+=22){ ctx.fillStyle='#6a5f4f'; ctx.fillRect(rx,y0+4,2,2); }
        const pad=Math.round(bh*0.18);
        // left LCD stat panel
        const lw=Math.round(w*0.20);
        ctx.fillStyle='#0a140c'; ctx.fillRect(pad,y0+pad,lw,bh-pad*2);
        ctx.fillStyle='#1d3a22'; ctx.fillRect(pad,y0+pad,lw,2);
        const clues=(st&&st.discoveredClues)?st.discoveredClues.length:0;
        const river=(st&&st.karma)?Math.floor(st.karma.neutral||0):0;
        ctx.fillStyle='#6abe30'; ctx.font=Math.round(bh*0.22)+'px monospace';
        ctx.fillText('CLUES '+clues, pad+8, y0+pad+Math.round(bh*0.30));
        ctx.fillText('RIVER '+river, pad+8, y0+pad+Math.round(bh*0.62));
        // center globe + fact ticker
        const gx=Math.round(w*0.40), gy=y0+Math.round(bh*0.5), gr=Math.round(bh*0.34);
        ctx.fillStyle='#306082'; ctx.beginPath(); ctx.arc(gx,gy,gr,0,6.2832); ctx.fill();
        ctx.fillStyle='#37946e'; ctx.beginPath(); ctx.arc(gx-gr*0.3,gy-gr*0.2,gr*0.4,0,6.2832); ctx.fill(); ctx.beginPath(); ctx.arc(gx+gr*0.4,gy+gr*0.3,gr*0.3,0,6.2832); ctx.fill();
        ctx.fillStyle='#cbdbfc'; ctx.fillRect(gx-gr,gy,gr*2,1);
        const facts={office:'Geography fact: this country has 17,508 islands.',map:'ACME tracks the suspect across the Mother Lode.',battle:'The land remembers its caretakers.',wall:'A witness from your trail steps forward.'};
        const fkey=(loc&&loc.indexOf('office')>=0)?'office':(loc==='map'||loc==='carmen')?'map':(loc&&loc.indexOf('battle')>=0)?'battle':(loc&&loc.indexOf('wall')>=0)?'wall':'office';
        ctx.fillStyle='#df7126'; ctx.font=Math.round(bh*0.20)+'px monospace';
        ctx.fillText((factOverride||facts[fkey]||'').substring(0,52), gx+gr+10, gy+Math.round(bh*0.07));
        ctx.fillStyle='#847e87'; ctx.fillText('LOC: '+((labelOverride||loc||'')+'').toUpperCase(), gx+gr+10, gy+Math.round(bh*0.40));
        // right inventory grid
        const cols=5,rows=2, cell=Math.floor((bh-pad*2)/rows)-1; const ix=w-pad-cols*(cell+2);
        const items=['#ac3232','#d9a066','#5fcde4','#fbf236','#6abe30','#76428a','#d77bba','#8f563b','#9badb7','#df7126'];
        for(let rIdx=0;rIdx<rows;rIdx++) for(let c=0;c<cols;c++){ const cx=ix+c*(cell+2), cy=y0+pad+rIdx*(cell+1); ctx.fillStyle='#15120d'; ctx.fillRect(cx,cy,cell,cell); ctx.fillStyle=items[(rIdx*cols+c)%items.length]; ctx.fillRect(cx+2,cy+2,cell-4,cell-4); ctx.fillStyle='#5a5048'; ctx.fillRect(cx,cy,cell,1); }
      }

      // ---- shared scenery helpers ----
      function oak(x,y,s){ rect(x,y,2,s,P.bark); for(let i=0;i<5;i++){ b.fillStyle=(i&1)?P.teal:P.moss; const ox=x-6+(i*3), oy=y-8+((i*2)%5); b.beginPath(); b.arc(ox,oy,4,0,6.2832); b.fill(); } }
      function conifer(x,baseY,hgt,c,cd){ for(let i=0;i<hgt;i++){ const ww=Math.max(1,(((hgt-i)*0.7)|0)); rect(x-(ww>>1),baseY-hgt+i,ww,1,(i&1)?c:cd);} rect(x-1,baseY,2,3,P.bark); }

      // ===== Per-area scenes (each matched to a real Gold Country place + DB32) =====
      // West Point ranch hub — golden oak savanna, two lakes, faded-red barn (WARM)
      function drawRanch(st,r){
        for(let y=0;y<58;y++) rect(0,y,IW,1, y<20?P.sky:(y<38?'#f2b25a':P.cream));
        for(let i=0;i<IW;i+=6){ const hh=8+((r()*10)|0); rect(i,52-hh,6,hh,P.navy); }
        rect(0,56,IW,124,P.tan); dith(0,56,IW,124,P.orange,0.05,r); dith(0,56,IW,124,P.sage,0.05,r);
        for(let y=58;y<180;y+=5){ b.fillStyle=P.brass; b.fillRect(0,y,IW,1); }
        rect(28,92,86,26,P.blue); rect(28,92,86,2,P.cyan); rect(30,116,82,2,P.navy); dith(28,94,86,22,P.azure,0.10,r);
        oak(150,70,16); oak(196,64,20); oak(120,66,14);
        block(214,86,58,40,P.red,P.rose,P.plum); b.fillStyle=P.dgray; b.fillRect(210,80,66,8); rect(236,104,14,22,P.bark); rect(220,92,10,10,P.plum); rect(256,92,10,10,P.plum);
        block(168,104,40,24,P.wood,P.tan,P.bark); rect(166,100,44,5,P.ash); rect(184,114,8,14,P.bark); rect(172,110,8,7,P.cyan);
        for(let fx=8;fx<IW-8;fx+=18){ rect(fx,150,2,16,P.bark); } rect(8,154,IW-16,2,P.wood); rect(8,162,IW-16,2,P.wood);
        rect(96,120,26,5,P.bark); rect(96,121,26,2,P.dgray);
        glow(292,30,22,P.yellow,0.10); vignette();
      }
      // Columbia boomtown — red brick + green shutters + white boardwalk + autumn canopy (BRIGHT)
      function drawColumbia(st,r){
        for(let y=0;y<40;y++) rect(0,y,IW,1,y<22?P.sky:P.ice);
        rect(0,40,IW,140,P.tan); dith(0,60,IW,120,P.bark,0.05,r);
        for(let i=0;i<3;i++){ const x=4+i*42, w=40; block(x,44,w,70,P.red,P.rose,P.plum); rect(x-1,40,w+2,5,P.bark); for(let wx=x+4;wx<x+w-6;wx+=12){ rect(wx,52,8,12,P.moss); rect(wx,52,8,1,P.cream);} rect(x+(w>>1)-3,98,7,16,P.bark); rect(x,114,w,3,P.cream); }
        for(let i=0;i<3;i++){ const w=34-i*6, x=IW-8-(i+1)*(w+6); block(x,46+i*4,w,58-i*6,P.bark,P.wood,P.plum); for(let wx=x+3;wx<x+w-5;wx+=10){ rect(wx,52+i*4,6,8,P.moss);} }
        for(let i=0;i<40;i++){ b.fillStyle=[P.orange,P.yellow,P.moss,P.brass][i%4]; b.fillRect(r()*IW,r()*34,3,3); }
        rect(150,30,4,30,P.bark);
        for(let i=0;i<60;i++){ b.fillStyle=(i&1)?P.orange:P.brass; b.fillRect(40+r()*240,120+r()*54,2,1); }
        block(120,120,28,16,P.plum,P.bark,P.ink); b.fillStyle=P.ink; b.beginPath(); b.arc(126,138,4,0,6.2832); b.fill(); b.beginPath(); b.arc(142,138,4,0,6.2832); b.fill(); rect(124,124,8,6,P.tan);
        rect(8,118,6,10,P.wood); rect(16,120,6,8,P.bark); vignette();
      }
      // Mokelumne Hill — grey rhyolite, 3-story IOOF hall, iron shutters (COOL/MELANCHOLY)
      function drawMokeHill(st,r){
        for(let y=0;y<46;y++) rect(0,y,IW,1,'#7f8a93');
        rect(0,44,IW,136,P.gray); dith(0,44,IW,136,P.ash,0.06,r);
        block(132,18,46,96,P.steel,P.ice,P.dgray);
        for(let fl=0;fl<3;fl++){ for(let wx=138;wx<172;wx+=12){ rect(wx,26+fl*26,8,12,P.slate); rect(wx,26+fl*26,8,1,P.navy); rect(wx,26+fl*26,1,12,P.navy);} }
        rect(130,14,50,5,P.bark);
        block(70,60,56,54,P.steel,P.ice,P.ash); for(let wx=76;wx<118;wx+=12){ rect(wx,68,8,12,P.navy);}
        block(186,64,60,50,P.gray,P.steel,P.ash); for(let wx=192;wx<240;wx+=12){ rect(wx,72,8,11,P.navy);}
        rect(96,100,12,14,P.bark); rect(208,100,12,14,P.bark);
        block(150,116,8,16,P.dusk,P.navy,P.ink); rect(151,112,6,5,P.gray);
        b.save(); b.globalAlpha=0.12; b.fillStyle=P.navy; b.fillRect(0,44,IW,136); b.restore(); vignette();
      }
      // Bear Valley — pine + granite + snow + A-frame lodge + chairlift (COLD OUTLIER)
      function drawBearValley(st,r){
        for(let y=0;y<54;y++) rect(0,y,IW,1, y<26?P.sky:P.ice);
        for(let i=0;i<6;i++){ const mx=i*60-20, mh=30+((r()*26)|0); b.fillStyle=P.steel; b.beginPath(); b.moveTo(mx,60); b.lineTo(mx+60,60); b.lineTo(mx+30,60-mh); b.fill(); b.fillStyle=P.white; b.beginPath(); b.moveTo(mx+22,60-mh+8); b.lineTo(mx+38,60-mh+8); b.lineTo(mx+30,60-mh); b.fill(); }
        for(let i=0;i<IW;i+=8){ conifer(i+4,86,22+((r()*8)|0),P.moss,P.slate); }
        rect(0,84,IW,96,P.ice); dith(0,84,IW,96,P.sky,0.10,r);
        b.fillStyle=P.bark; b.beginPath(); b.moveTo(150,140); b.lineTo(186,140); b.lineTo(168,104); b.fill(); b.fillStyle=P.white; b.beginPath(); b.moveTo(152,108); b.lineTo(184,108); b.lineTo(168,100); b.fill();
        rect(162,122,12,18,P.wood); rect(165,126,6,7,P.yellow); glow(168,129,8,P.yellow,0.18);
        rect(60,70,2,40,P.gray); rect(110,60,2,50,P.gray); b.strokeStyle=P.dgray; b.lineWidth=1; b.beginPath(); b.moveTo(60,70); b.lineTo(110,60); b.stroke(); rect(84,66,5,4,P.navy); rect(85,70,3,4,P.ash);
        for(let i=0;i<5;i++) rect(200+i*4,132,3,8,P.bark); vignette();
      }
      // Mokelumne River ford — teal water + foam + granite boulders + covered bridge (karma-tinted)
      function drawRiver(st,r){
        const healthy = !(st&&st.karma) || ((st.karma.bad||0) <= (st.karma.good||0));
        const wA=healthy?P.cyan:P.rose, wB=healthy?P.blue:P.plum;
        for(let y=0;y<50;y++) rect(0,y,IW,1,y<24?P.sky:P.ice);
        b.fillStyle=P.steel; b.beginPath(); b.moveTo(0,30); b.lineTo(70,30); b.lineTo(0,90); b.fill(); b.beginPath(); b.moveTo(IW,28); b.lineTo(IW-80,28); b.lineTo(IW,96); b.fill(); dith(0,30,70,60,P.cream,0.10,r); dith(IW-80,28,80,68,P.cream,0.10,r);
        rect(0,48,IW,8,P.teal); rect(IW-90,40,90,10,P.moss);
        for(let y=56;y<150;y+=4){ rect(0,y,IW,2, ((y/4)&1)?wA:wB); }
        for(let i=0;i<70;i++) rect(r()*IW,58+r()*88,2,1,P.white);
        for(let i=0;i<6;i++){ const bx=20+i*46+((r()*10)|0), by=70+((r()*60)|0); block(bx,by,12,8,P.steel,P.ice,P.dgray); }
        block(108,70,104,12,P.bark,P.wood,P.plum); rect(108,66,104,5,P.red); for(let px=112;px<208;px+=10) rect(px,82,3,8,P.bark);
        rect(0,150,IW,30,P.moss); vignette();
      }
      // Hydraulic mine ruins — rust headframe + stamp mill + tailing wheel + raw clay scar (OMINOUS)
      function drawMine(st,r){
        for(let y=0;y<48;y++) rect(0,y,IW,1,'#8a8f95');
        b.fillStyle=P.orange; b.beginPath(); b.moveTo(IW,40); b.lineTo(IW-120,40); b.lineTo(IW,160); b.fill();
        for(let y=44;y<160;y+=3){ b.fillStyle=(y&1)?P.rose:P.tan; b.fillRect(IW-118+(y%8),y,118,1); } dith(IW-120,40,120,120,P.plum,0.06,r);
        rect(0,120,IW,60,P.bark); dith(0,120,IW,60,P.ash,0.08,r);
        const hx=70; b.strokeStyle=P.slate; b.lineWidth=1; b.beginPath(); b.moveTo(hx-16,150); b.lineTo(hx,40); b.lineTo(hx+16,150); b.moveTo(hx-12,120); b.lineTo(hx+12,120); b.moveTo(hx-8,90); b.lineTo(hx+8,90); b.moveTo(hx-16,150); b.lineTo(hx+12,120); b.moveTo(hx+16,150); b.lineTo(hx-12,120); b.stroke();
        rect(hx-3,40,6,8,P.gray); b.fillStyle=P.ink; b.beginPath(); b.arc(hx,44,4,0,6.2832); b.fill();
        block(20,108,44,28,P.bark,P.wood,P.plum); rect(18,104,48,5,P.dgray); for(let wx=24;wx<58;wx+=8) rect(wx,114,5,8,P.ink);
        block(150,96,42,42,P.ash,P.gray,P.ink); b.strokeStyle=P.wood; b.lineWidth=1; b.beginPath(); b.arc(171,117,16,0,6.2832); b.stroke(); for(let a=0;a<8;a++){ b.beginPath(); b.moveTo(171,117); b.lineTo(171+Math.cos(a*0.785)*16,117+Math.sin(a*0.785)*16); b.stroke(); }
        rect(40,150,IW-60,2,P.dgray); rect(40,156,IW-60,2,P.dgray); block(96,140,18,12,P.ash,P.steel,P.ink); rect(98,142,14,5,P.brass);
        for(let i=0;i<18;i++){ b.fillStyle=(i&1)?P.red:P.orange; b.fillRect(r()*IW,120+r()*50,1,1); } vignette();
      }
      // Angels Camp — tan stone Angels Hotel + brass frog plaques + wanted poster (JAUNTY-UNDERTONE)
      function drawAngels(st,r){
        for(let y=0;y<44;y++) rect(0,y,IW,1,y<22?P.sky:P.ice);
        rect(0,42,IW,138,P.tan); dith(0,60,IW,120,P.bark,0.05,r);
        for(let i=0;i<IW;i+=8){ const hh=6+((r()*8)|0); rect(i,42-hh,8,hh,P.moss); }
        block(40,44,84,72,P.steel,P.cream,P.ash); rect(38,40,88,5,P.bark);
        for(let wx=48;wx<116;wx+=14){ rect(wx,52,9,12,P.navy); rect(wx,82,9,12,P.navy); }
        rect(40,76,84,3,P.bark); rect(72,100,14,16,P.bark);
        rect(96,86,6,8,P.dusk); rect(97,84,4,3,P.cream);
        block(150,56,60,58,P.wood,P.tan,P.plum); for(let wx=156;wx<204;wx+=12) rect(wx,64,8,10,P.slate);
        rect(8,118,IW-16,4,P.bark); for(let fx=20;fx<IW-20;fx+=24){ b.fillStyle=P.brass; b.beginPath(); b.arc(fx,120,2,0,6.2832); b.fill(); b.fillStyle=P.yellow; b.fillRect(fx-1,119,1,1); }
        rect(224,96,2,22,P.bark); block(216,84,18,16,P.cream,P.white,P.gray); rect(220,88,10,8,P.plum); b.fillStyle=P.ink; b.font='5px monospace'; b.fillText('WANTED',217,99); vignette();
      }
      // Murphys — tan stone hotel + wrought-iron balcony under a leafy green canopy (GENTEEL/SHADED)
      function drawMurphys(st,r){
        for(let y=0;y<30;y++) rect(0,y,IW,1,P.ice);
        rect(0,30,IW,150,P.tan); dith(0,60,IW,120,P.bark,0.05,r);
        for(let i=0;i<70;i++){ b.fillStyle=(i&1)?P.moss:P.teal; b.fillRect(r()*IW,r()*40,3,3); }
        rect(40,34,4,24,P.bark); rect(250,34,4,26,P.bark);
        block(70,52,110,64,P.cream,P.white,P.gray); rect(68,48,114,5,P.bark);
        for(let wx=78;wx<170;wx+=15){ rect(wx,60,10,12,P.slate); rect(wx,60,10,1,P.navy); }
        rect(70,80,110,3,P.ink); for(let bx=74;bx<178;bx+=6) rect(bx,80,1,6,P.ink);
        rect(70,92,110,4,P.white); for(let wx=80;wx<168;wx+=18){ rect(wx,98,12,14,P.bark); }
        rect(8,118,IW-16,4,P.wood); glow(120,70,30,P.yellow,0.06);
        for(let i=0;i<24;i++){ b.fillStyle=P.lime; b.fillRect(r()*IW,40+r()*70,1,1); } vignette();
      }
      // Eagle Point Lookout — layered hazy ridges, two lakes, Mt Diablo (PANORAMA)
      function drawLookout(st,r){
        const bands=['#cfe0f5','#bcd2ec','#9fb9d8','#86a2c2','#6f8aad','#5b7596'];
        for(let i=0;i<bands.length;i++){ const y=20+i*16; rect(0,y,IW,IH-y,bands[i]); for(let x=0;x<IW;x+=5){ const hh=4+((r()*8)|0); b.fillStyle=bands[Math.min(bands.length-1,i+1)]; b.fillRect(x,y-hh,5,hh); } }
        rect(0,0,IW,22,P.ice); b.save(); b.globalAlpha=0.5; b.fillStyle=P.white; b.fillRect(0,30,IW,6); b.restore();
        block(70,96,30,10,P.blue,P.cyan,P.navy); block(150,110,26,8,P.blue,P.cyan,P.navy);
        b.fillStyle='#6f8aad'; b.beginPath(); b.moveTo(244,40); b.lineTo(276,40); b.lineTo(260,26); b.fill();
        block(20,150,60,30,P.steel,P.ice,P.dgray); block(40,144,16,10,P.gray,P.steel,P.ash); vignette();
      }

      // Cyrus Vane, "the Tare" — the scarred-stranger antagonist, close player-vantage portrait for the confrontation.
      function drawVane(st,r){
        for(let y=0;y<62;y++) rect(0,y,IW,1, y<22?'#2a2438':(y<44?P.plum:'#5a4636')); // dusk road sky
        rect(0,60,IW,120,P.bark); dith(0,60,IW,120,P.plum,0.05,r);
        for(let y=64;y<180;y+=7){ b.fillStyle=P.dusk; b.fillRect(0,y,IW,1); }
        block(20,84,34,22,P.gray,P.steel,P.ink); // boulder (ambush point)
        rect(282,40,5,40,P.bark); for(let i=0;i<5;i++){ b.fillStyle=P.moss; b.beginPath(); b.arc(278+(i*4),40+(i%3)*4,5,0,6.2832); b.fill(); }
        block(276,58,14,12,P.cream,P.white,P.gray); // poem nailed to the oak
        glow(60,72,30,P.orange,0.10); // lantern glow
        const cx=150;
        block(cx-26,84,52,96,P.navy,P.blue,P.ink); rect(cx-2,90,4,90,P.ink); // long frock coat + seam
        block(cx-26,84,52,10,P.dusk,P.navy,P.ink); // shoulders
        rect(cx-8,96,16,40,P.plum); for(let i=0;i<5;i++) rect(cx-6,100+i*7,2,2,P.brass); // vest + buttons
        rect(cx+2,100,8,1,P.brass); rect(cx+10,100,1,9,P.brass); // watch chain
        rect(cx-8,92,16,4,P.cream); rect(cx-2,94,4,6,P.ink); // collar + tie
        block(cx-12,54,24,28,P.cream,P.white,P.tan); // face
        rect(cx-18,50,36,4,P.ink); block(cx-12,40,24,12,P.dusk,P.navy,P.ink); // wide-brim hat
        rect(cx-7,62,3,2,P.ink); rect(cx+4,62,3,2,P.ink); rect(cx-8,60,4,1,P.ash); rect(cx+4,60,4,1,P.ash); // cold eyes + brows
        rect(cx-4,72,9,1,P.bark); rect(cx+5,71,2,1,P.bark); // thin mouth, slight upturn
        b.fillStyle=P.red; b.fillRect(cx+6,64,1,2); b.fillRect(cx+5,66,1,2); b.fillRect(cx+4,68,1,2); b.fillStyle=P.rose; b.fillRect(cx+7,63,1,1); // THE fresh scar
        rect(cx+18,118,8,5,P.cream); // hand
        rect(cx+26,94,1,28,P.brass); rect(cx+18,94,18,1,P.brass); // balance scale post + beam
        block(cx+15,96,7,4,P.brass,P.yellow,P.bark); block(cx+30,96,7,4,P.brass,P.yellow,P.bark); // two pans
        rect(cx+33,97,2,2,P.yellow); // a pinch of shaved gold ('the Tare')
        rect(cx-26,84,2,96,P.blue); // rim light
        vignette();
      }
      function pickScene(L){
        const s=(L||'').toLowerCase();
        if((s.indexOf('vane')>=0) || (s.indexOf('bart')>=0 && _st && _st.flags && state.flags.scarredStranger)) return ['vane', drawVane];
        if(s.indexOf('ranch')>=0||s.indexOf('welcome')>=0||s.indexOf('home')>=0||s.indexOf('barn')>=0||s.indexOf('orchard')>=0) return ['ranch',drawRanch];
        if(s.indexOf('columbia')>=0||s.indexOf('town')>=0||s.indexOf('drytown')>=0||s.indexOf('hangtown')>=0||s.indexOf('volcano')>=0) return ['columbia',drawColumbia];
        if(s.indexOf('mokehill')>=0||s.indexOf('mokelumne_hill')>=0||s.indexOf('stone')>=0||s.indexOf('assay_ext')>=0) return ['mokehill',drawMokeHill];
        if(s.indexOf('bear')>=0||s.indexOf('alpine')>=0||s.indexOf('pass')>=0||s.indexOf('donner')>=0||s.indexOf('carson')>=0||s.indexOf('snow')>=0) return ['bearvalley',drawBearValley];
        if(s.indexOf('river')>=0||s.indexOf('ford')>=0||s.indexOf('cross')>=0||s.indexOf('creek')>=0) return ['river',drawRiver];
        if(s.indexOf('mine')>=0||s.indexOf('hydraulic')>=0||s.indexOf('scar')>=0||s.indexOf('cavern')>=0||s.indexOf('shaft')>=0) return ['mine',drawMine];
        if(s.indexOf('angels')>=0||s.indexOf('frog')>=0) return ['angels',drawAngels];
        if(s.indexOf('murphys')>=0||s.indexOf('jackson')>=0||s.indexOf('genteel')>=0) return ['murphys',drawMurphys];
        if(s.indexOf('lookout')>=0||s.indexOf('eagle')>=0||s.indexOf('panorama')>=0||s.indexOf('vista')>=0) return ['lookout',drawLookout];
        if(s==='map'||s.indexOf('carmen')>=0||s.indexOf('trail')>=0) return ['map',drawMap];
        if(s.indexOf('battle')>=0||s.indexOf('wall')>=0||s.indexOf('confront')>=0||s.indexOf('bart')>=0||s.indexOf('murrieta')>=0||s.indexOf('outlaw')>=0) return ['battle',drawBattle];
        return ['office',drawOffice];
      }
      const META={ranch:["Pryor's Back of Beyond — 160 acres, two lakes, golden oak.","West Point Ranch"],columbia:["Columbia boomtown — brick, green shutters, stagecoach dust.","Columbia"],mokehill:["Mokelumne Hill — rhyolite stone, iron shutters, old ghosts.","Mokelumne Hill"],bearvalley:["Bear Valley — 7,000 ft of pine, granite and snow.","Bear Valley"],river:["The Karmic River — cross with respect or pay the toll.","Mokelumne Ford"],mine:["Hydraulic scar — the mountain stripped to bone.","Mine Ruins"],angels:["Angels Camp — Twain's frog, Black Bart's road.","Angels Camp"],murphys:["Murphys — Queen of the Sierra, iron balconies, shade.","Murphys"],lookout:["Eagle Point — Sierra east, Valley west, Diablo beyond.","Eagle Point"],map:["ACME tracks the suspect across the Mother Lode.","Trail Map"],battle:["The witness remembers your trail. Attack or speak?","Encounter"],office:["Geography fact: this country has 17,508 islands.","Assay Office"],vane:["Cyrus Vane, 'the Tare' — the scar that threads every con.","Cyrus Vane"]};
      function renderScene(ctx:any,w:number,h:number,loc:string,st:any,logArr:any,opts:any){
        _st = st;
        b.clearRect(0,0,IW,IH);
        const r=rng(0xB0B); // stable seed (deterministic scatter)
        const ps=pickScene(loc); ps[1](st,r,loc);
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(buf,0,0,IW,IH,0,0,w,h);
        // HUD (clue/river stats, inventory grid, LOC label) is part of the in-game
        // view, not decorative backdrops. Opt out with { hud:false }; default = on,
        // so existing callers (e.g. /pixel-preview) are unchanged.
        if(!opts || opts.hud!==false){
          const m=META[ps[0]]||['',loc];
          drawHUD(ctx,w,h,st,loc,logArr,m[0],m[1]);
        }
      }
      return { handles:function(){ return true; }, renderScene:renderScene,
        scenes:['ranch','columbia','mokehill','bearvalley','river','mine','angels','murphys','lookout','map','battle','office'] };
    }
