/* Sūq – Prüfung der Kernlogik.
   Läuft ohne Browser: Store wird minimal nachgebaut, danach werden
   Wächter, Skript, Shots und Rechtstexte gegen erwartetes Verhalten
   geprüft.

       node tools/pruef_suq.js

   Die Falschalarm-Fälle sind kein Beiwerk. Ein Wächter, der die richtige
   Formulierung bemängelt, wird nach dem dritten Mal weggeklickt — und
   dann bemerkt er auch das Falsche nicht mehr. */
const fs=require('fs'), vm=require('vm');
const ctx={console};
vm.createContext(ctx);
// Store minimal nachbauen - nur was die Module lesen
vm.runInContext(`var Store={einstellungen:{
  grenzen:{keinePersonen:true,keineFrauen:true,keineMusik:true,puppeErlaubt:true,keineUebertreibung:true,keinRiba:true},
  recht:{wort:"Werbung",imBild:true,gesprochen:false,kiOffenlegung:true,provisionshinweis:true},
  klang:"ambient"}};`, ctx);
for (const f of ['studio/js/recht.js','studio/js/halal.js','studio/js/skript.js','studio/js/shots.js'])
  vm.runInContext(fs.readFileSync(f,'utf8'), ctx, {filename:f});

let fehler=0;
const ok=(bed,name)=>{ if(!bed){console.log("  FEHLGESCHLAGEN: "+name); fehler++;} else console.log("  ok  "+name); };

const produkt={id:"p1",name:"Gebetsteppich",kategorie:"Gebetsteppich",preis:24.99,
  merkmale:["8 mm Polsterung"],einwaende:["zu rutschig"],fotos:[{id:"b1",name:"a.jpg"}],
  freigabe:{erteilt:true,am:"2026-08-01",wie:"Nachricht"},status:"aktiv"};

function neuesVideo(){ return {id:"v1",produktId:"p1",titel:"Test",stand:"skript",
  skript:{hook:{text:"",sek:0},problem:{text:"",sek:0},produkt:{text:"",sek:0},
          beweis:{text:"",sek:0},einwand:{text:"",sek:0},cta:{text:"",sek:0}},
  shots:[],stimme:{erzeugt:null,datei:"",stimmeId:""},
  zahlen:{},gepostetAm:null}; }

console.log("\n-- Waechter: verbotene Inhalte --");
let v=neuesVideo();
v.skript.hook.text="Werbung. Eine Frau trägt die Abaya und lächelt in die Kamera.";
let e=ctx.Halal.pruefe(v,produkt);
ok(e.sperren.some(b=>b.regel==="frauen"), "erkennt weibliche Darstellung");
ok(e.sperren.some(b=>b.regel==="personen"), "erkennt Gesicht/Person");
ok(!e.frei, "Video wird gesperrt");

v=neuesVideo();
v.skript.produkt.text="Dazu ein ruhiger Beat im Hintergrund.";
e=ctx.Halal.pruefe(v,produkt);
ok(e.sperren.some(b=>b.regel==="musik"), "erkennt Musik");

v=neuesVideo();
v.skript.beweis.text="Das heilt deine Rückenschmerzen garantiert zu 100%.";
e=ctx.Halal.pruefe(v,produkt);
ok(e.sperren.some(b=>b.regel==="heilversprechen"), "erkennt Heilversprechen");
ok(e.hinweise.some(b=>b.regel==="uebertreibung"), "erkennt Uebertreibung als Hinweis");

console.log("\n-- Waechter: Falschalarme --");
v=neuesVideo();
v.skript.hook.text="Werbung. Mein Personal-Trainer hat eine Manschette empfohlen.";
e=ctx.Halal.pruefe(v,produkt);
ok(!e.sperren.some(b=>b.regel==="personen"), "'Personal' loest 'Person' nicht aus");

v=neuesVideo();
v.shots=[{was:"Abaya auf der kopflosen Schneiderpuppe",bewegung:"hinein",einblendung:""}];
e=ctx.Halal.pruefe(v,produkt);
ok(!e.sperren.some(b=>b.regel==="personen"||b.regel==="frauen"), "kopflose Puppe ist erlaubt");

// Verneinungen: die richtige Formulierung darf nicht gesperrt werden
[["Eigene Hand am Produkt, kein Gesicht im Bild","personen"],
 ["Abaya auf dem Buegel, ohne Person","personen"],
 ["Der Stoff, nicht am Koerper gezeigt","amKoerper"],
 ["Ruhiger Raumton statt Musik","musik"]].forEach(([satz,regel])=>{
  const t=ctx.Halal.pruefeText(satz,"shot","x");
  ok(!t.some(b=>b.regel===regel&&b.stufe==="sperre"), "Verneinung erlaubt: \""+satz+"\"");
});

// ... aber ein echter Treffer hinter einer Verneinung wird gefunden
const gemischt=ctx.Halal.pruefeText("Kein Gesicht im Bild. Danach laeuft Musik dazu.","shot","x");
ok(gemischt.some(b=>b.regel==="musik"), "echter Treffer hinter einer Verneinung wird gefunden");

console.log("\n-- Waechter: Recht --");
v=neuesVideo(); v.stimme.erzeugt="2026-08-13T10:00:00Z";
ctx.Store.einstellungen.recht.kiOffenlegung=false;
e=ctx.Halal.pruefe(v,produkt);
ok(e.sperren.some(b=>b.regel==="ki"), "sperrt KI-Stimme ohne Offenlegung");
ctx.Store.einstellungen.recht.kiOffenlegung=true;

const ohneFreigabe={...produkt,freigabe:{erteilt:false,am:null,wie:""}};
e=ctx.Halal.pruefe(neuesVideo(),ohneFreigabe);
ok(e.sperren.some(b=>b.regel==="freigabe"), "sperrt Produkt ohne Seller-Freigabe");

console.log("\n-- Skript --");
const vs=ctx.Skript.vorschlag(produkt,0);
ok(vs.skript.hook.text.length>0, "Vorschlag erzeugt einen Hook");
ok(vs.skript.beweis.text.includes("vier Monaten"), "Platzhalter werden gefuellt");
ok(ctx.Skript.sekunden("Ein kurzer Satz mit sieben Wörtern hier.")>1, "Sekunden werden geschaetzt");

v=neuesVideo(); v.skript=vs.skript;
const achse=ctx.Skript.zeitachse(v);
ok(achse[0].von===0, "Zeitachse beginnt bei 0");
ok(achse[5].bis>achse[0].bis, "Zeitachse laeuft aufwaerts");
ok(Math.abs(achse[5].bis-ctx.Skript.gesamt(v))<0.05, "Gesamtlaenge stimmt mit der Achse ueberein");

console.log("\n-- Kennzeichnung im Hook --");
const kennz=ctx.Skript.HOOKS.filter(h=>h.kennzeichnet);
ok(kennz.length>0, "es gibt Hooks mit Kennzeichnung");
ok(kennz.every(h=>/\b(Werbung|Anzeige)\b/.test(h.text)), "alle tragen 'Werbung' oder 'Anzeige'");

// Ohne Einblendung muss der Hook die Kennzeichnung tragen
ctx.Store.einstellungen.recht.imBild=false;
v=neuesVideo(); v.skript.hook.text="Schau dir die Naht an.";
e=ctx.Halal.pruefe(v,produkt);
ok(e.sperren.some(b=>b.regel==="kennzeichnung"), "sperrt fehlende Kennzeichnung");
v.skript.hook.text=kennz[0].text;
e=ctx.Halal.pruefe(v,produkt);
ok(!e.sperren.some(b=>b.regel==="kennzeichnung"), "Kennzeichnungs-Hook erfuellt die Pflicht");
ctx.Store.einstellungen.recht.imBild=true;

console.log("\n-- Shots und Bauplan --");
v=neuesVideo(); v.skript=vs.skript;
v.shots=ctx.Shots.vorschlag(v,produkt);
ok(v.shots.length>0, "Einstellungen werden abgeleitet");
ok(v.shots[0].einblendung==="Werbung", "Kennzeichnung sitzt auf der ersten Einstellung");
ok(v.shots.every(s=>s.dauer>=1.4&&s.dauer<=3.1), "jede Einstellung zwischen 1,4 und 3,1 s");
const summe=ctx.Shots.gesamtdauer(v.shots);
ok(Math.abs(summe-ctx.Skript.gesamt(v))<1.5, "Shotdauer passt zur Skriptlaenge");
// Keine Vorlage darf gegen die Grenzen verstossen
let verstoss=0;
Object.values(ctx.Shots.VORLAGEN).forEach(liste=>liste.forEach(t=>{
  if(ctx.Halal.pruefeText(t.was,"shot","x").some(b=>b.stufe==="sperre")) {verstoss++; console.log("     -> "+t.was);}
}));
ok(verstoss===0, "keine Shot-Vorlage verstoesst gegen die Grenzen");

v.shots[0].bild="b1";
const plan=ctx.Shots.alsBauplan(v,produkt);
ok(plan.app==="suq", "Bauplan traegt die Kennung");
ok(plan.szenen[0].bild==="a.jpg", "Bauplan traegt den Dateinamen, nicht die interne Kennung");
ok(plan.abschnitte.length>0, "Bauplan traegt die Abschnitte fuer Untertitel");
ok(plan.kennzeichnung && plan.kennzeichnung.text==="Werbung", "Bauplan traegt die Kennzeichnung");

console.log("\n-- Rechtstexte --");
v.stimme.erzeugt="2026-08-13T10:00:00Z";
const b=ctx.Recht.beschreibung(v,produkt);
ok(b.startsWith("Werbung."), "Beschreibung beginnt mit der Kennzeichnung");
ok(b.includes("Provision"), "Provisionshinweis enthalten");
ok(b.includes("künstlicher Intelligenz"), "KI-Offenlegung enthalten");
ok(ctx.Recht.hashtags(produkt).startsWith("#werbung"), "Hashtags beginnen mit #werbung");
ok(ctx.Recht.schalter(v).some(s=>s.id==="ki"), "TikTok-Schalter fuer KI erscheint");

console.log(fehler? "\n"+fehler+" FEHLGESCHLAGEN\n" : "\nAlle Pruefungen bestanden.\n");
process.exit(fehler?1:0);
