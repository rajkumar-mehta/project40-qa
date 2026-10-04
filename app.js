const QA_SHOW_ALL_EXITS = false; // PRODUCTION: real date/unlock gating is ON.
const QA_DISABLE_SEQUENCE = false; // PRODUCTION: sequential progression is ON.
const QA_HOST = location.hostname.toLowerCase() === "qa.route4t.com";
// QA preview is deliberately hard-gated to the QA hostname. The same URL parameter
// on route4t.com does nothing. Preview uses isolated progress and sends no email.
const QA_PREVIEW_MODE = QA_HOST && new URLSearchParams(location.search).get("preview") === "1";
const MAX_ATTEMPTS = 3; // normal guesses
const MAX_TOTAL_ATTEMPTS = 4; // one optional bonus guess after the surrender warning
const FINAL_EXIT = 40;
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjykazrp";
// Environment-aware email subject label.
// QA custom domain and GitHub Pages fallback are labeled QA; Route4T.com is labeled PROD.
const EMAIL_ENV_LABEL = (
  QA_HOST || location.pathname.toLowerCase().startsWith("/project40-qa")
) ? "QA" : "PROD";

// v2.47: unlocks use trusted Route4T server time, never the phone wall clock.
// A server anchor advances with performance.now(), which is unaffected by manual
// Android/iPhone date changes. If the server cannot be reached, the last verified
// server instant is used as a frozen fail-closed fallback (future exits stay locked).
const TRUSTED_TIME_KEY="route4t_trusted_server_time_v1";
let trustedServerAnchorMs=null;
let trustedPerfAnchorMs=null;
let trustedTimeSyncPromise=null;

function readLastTrustedServerMs(){
 try{
  const n=Number(localStorage.getItem(TRUSTED_TIME_KEY));
  return Number.isFinite(n)&&n>0?n:null;
 }catch{return null}
}
function trustedNowMs(){
 if(Number.isFinite(trustedServerAnchorMs)&&Number.isFinite(trustedPerfAnchorMs)){
  return trustedServerAnchorMs+Math.max(0,performance.now()-trustedPerfAnchorMs);
 }
 return readLastTrustedServerMs();
}
function easternDateISO(ms){
 if(!Number.isFinite(ms)) return null;
 try{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(ms));
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
 }catch{return null}
}
function gameNowISO(){
 const ms=trustedNowMs();
 return new Date(Number.isFinite(ms)?ms:Date.now()).toISOString();
}
async function syncTrustedTime(){
 if(trustedTimeSyncPromise) return trustedTimeSyncPromise;
 trustedTimeSyncPromise=(async()=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),4500);
  try{
   const url=new URL("./index.html",window.location.href);
   url.searchParams.set("__route4t_time",`${Math.random().toString(36).slice(2)}-${performance.now().toFixed(0)}`);
   const res=await fetch(url.href,{method:"GET",cache:"no-store",credentials:"same-origin",signal:controller.signal,headers:{"Cache-Control":"no-cache"}});
   const header=res.headers.get("Date");
   const serverMs=Date.parse(header||"");
   if(!res.ok || !Number.isFinite(serverMs)) throw new Error("trusted time unavailable");
   trustedServerAnchorMs=serverMs;
   trustedPerfAnchorMs=performance.now();
   try{localStorage.setItem(TRUSTED_TIME_KEY,String(serverMs))}catch{}
   return true;
  }finally{clearTimeout(timer)}
 })().catch(()=>false).finally(()=>{trustedTimeSyncPromise=null});
 return trustedTimeSyncPromise;
}
function ensureTrustedTime(){
 return Number.isFinite(trustedNowMs())?Promise.resolve(true):syncTrustedTime();
}

// Same website, two isolated local progress profiles.
// Missing/unknown player defaults to Mika so route4t.com itself stays her game.
const _playerParam=(new URLSearchParams(window.location.search).get("player")||"").trim().toLowerCase();
const PLAYER=_playerParam==="raj"?"Raj":"Mika";
const IS_MIKA=PLAYER==="Mika";
const EMAIL_QUEUE_KEY=IS_MIKA?"route4t_email_queue_v1":"route4t_raj_email_queue_v1";
const EMAIL_SENT_PREFIX=IS_MIKA?"route4t_email_sent_v1_":"route4t_raj_email_sent_v1_";

const DAYS = [
 {
  "day": 0,
  "date": "2026-09-27",
  "displayDate": "September 27, 2026",
  "video": "https://youtube.com/shorts/yUn1u7CIYNc?feature=share",
  "relation": "Uncle, Aunty & Family",
  "wishFrom": "Mahendrabhai",
  "lines": [
   "Before you entered this world, your story had already begun. ",
   "40 years ago, where (city) was your mom physically present today, ie: 40 days before your birth?"
  ],
  "answerDisplay": "Ajman",
  "answers": [
   "ajman",
   "dubai"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 1,
  "date": "2026-09-28",
  "displayDate": "September 28, 2026",
  "video": "https://youtu.be/K4pBJcpQbfQ",
  "relation": "Cousin",
  "wishFrom": "Purvi & Kruti Family",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "1987",
  "answers": [
   "1987",
   "1988"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-8.jpeg"
 },
 {
  "day": 2,
  "date": "2026-09-29",
  "displayDate": "September 29, 2026",
  "video": "https://youtu.be/btRYOcFNmwo",
  "relation": "Friend",
  "wishFrom": "Kamalbhai & Krupali",
  "lines": [
   "Where (City) did you celebrate your 1st Bday in 1987"
  ],
  "answerDisplay": "Ajman",
  "answers": [
   "ajman"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 3,
  "date": "2026-09-30",
  "displayDate": "September 30, 2026",
  "video": "https://youtu.be/48vUVl99XqE",
  "relation": "Friend",
  "wishFrom": "Mihir & Unnati",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "1992",
  "answers": [
   "1992"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-1.jpeg"
 },
 {
  "day": 4,
  "date": "2026-10-01",
  "displayDate": "October 1, 2026",
  "video": "https://youtu.be/vAzVv0Oc8Zg",
  "relation": "Friend",
  "wishFrom": "Beenaben",
  "lines": [
   "Around 2003-2004, what was your favorite unhealthy morning drink for Breakfast ?"
  ],
  "answerDisplay": "Coke",
  "answers": [
   "coke",
   "pepsi"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 5,
  "date": "2026-10-02",
  "displayDate": "October 2, 2026",
  "video": "https://youtu.be/kja1pBH3b2Y",
  "relation": "Friend",
  "wishFrom": "Bharat Patel",
  "lines": [
   "Where (Country) was this picture taken ?"
  ],
  "answerDisplay": "Kuwait",
  "answers": [
   "kuwait"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-12.jpeg"
 },
 {
  "day": 6,
  "date": "2026-10-03",
  "displayDate": "October 3, 2026",
  "video": "https://youtu.be/zxKw6SfIT9M",
  "relation": "Friend",
  "wishFrom": "Vimalbhai & Pallaviben",
  "lines": [
   "What was the name of the Hindi Teacher in Bahrain you got into trouble with ?"
  ],
  "answerDisplay": "Mrs. Kaur",
  "answers": [
   "mrs. kaur",
   "mrs kaur",
   "ms kaur",
   "kaur"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 7,
  "date": "2026-10-04",
  "displayDate": "October 4, 2026",
  "video": "https://youtu.be/SQAlRaVT3Vs",
  "relation": "Friend",
  "wishFrom": "Rajat & Ami",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "1988",
  "answers": [
   "1988",
   "1987"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-10.jpeg"
 },
 {
  "day": 8,
  "date": "2026-10-05",
  "displayDate": "October 5, 2026",
  "video": "https://youtu.be/U55yQ0uvWhw",
  "relation": "Friend",
  "wishFrom": "Sanghvi Brothers",
  "lines": [
   "What was the School Bus Number, where Archana made you eat Lasan ki chutney"
  ],
  "answerDisplay": "3",
  "answers": [
   "3",
   "three"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 9,
  "date": "2026-10-06",
  "displayDate": "October 6, 2026",
  "video": "https://youtu.be/_c1vlWvXKes",
  "relation": "Friend",
  "wishFrom": "Rushabh, Palak, Arav & Rian",
  "lines": [
   "Who is carrying you in her arms?"
  ],
  "answerDisplay": "Dadima",
  "answers": [
   "dadima"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-13.jpeg"
 },
 {
  "day": 10,
  "date": "2026-10-07",
  "displayDate": "October 7, 2026",
  "video": "https://youtu.be/jexm_8zkQhc",
  "relation": "Friend",
  "wishFrom": "Chirag & Ashesh Family",
  "lines": [
   "What was the color of the Scooty, from where you and Archana fell in the middle of the road ?"
  ],
  "answerDisplay": "Red",
  "answers": [
   "red",
   "green",
   "purple",
   "blue"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 11,
  "date": "2026-10-08",
  "displayDate": "October 8, 2026",
  "video": "https://youtube.com/shorts/EJIS5RhjFUo?feature=share",
  "relation": "Friend",
  "wishFrom": "GariMan",
  "lines": [
   "Where (City) was this picture taken ?"
  ],
  "answerDisplay": "Ajman",
  "answers": [
   "ajman",
   "dubai",
   "rajkot",
   "bahrain"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-9.jpeg"
 },
 {
  "day": 12,
  "date": "2026-10-09",
  "displayDate": "October 9, 2026",
  "video": "https://youtube.com/shorts/rrS010BKXLc",
  "relation": "Friend",
  "wishFrom": "Finny",
  "lines": [
   "What was your favourite orange drink from Ajman"
  ],
  "answerDisplay": "Rani",
  "answers": [
   "rani"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 13,
  "date": "2026-10-10",
  "displayDate": "October 10, 2026",
  "video": "https://youtu.be/MIS5d7pivQ0",
  "relation": "Friend",
  "wishFrom": "LynKy",
  "lines": [
   "How old are you in this picture"
  ],
  "answerDisplay": "15",
  "answers": [
   "15",
   "fifteen"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-11.jpeg"
 },
 {
  "day": 14,
  "date": "2026-10-11",
  "displayDate": "October 11, 2026",
  "video": "https://youtu.be/b46etLzpx5c",
  "relation": "Friend",
  "wishFrom": "ShAmeet",
  "lines": [
   "Where (Country) was this picture taken ?"
  ],
  "answerDisplay": "Bahrain",
  "answers": [
   "bahrain"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-7.jpeg"
 },
 {
  "day": 15,
  "date": "2026-10-12",
  "displayDate": "October 12, 2026",
  "video": "https://youtube.com/shorts/wOAB3Q5k_qk?feature=share",
  "relation": "Friend",
  "wishFrom": "Jayshree",
  "lines": [
   "Where (City) was this picture taken ?"
  ],
  "answerDisplay": "Navsari",
  "answers": [
   "navsari",
   "nawsari"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Jagruti-1.jpeg"
 },
 {
  "day": 16,
  "date": "2026-10-13",
  "displayDate": "October 13, 2026",
  "video": "https://youtu.be/1MorLQh1csk",
  "relation": "Friend",
  "wishFrom": "Preet & Dimpy",
  "lines": [
   "What is the name of the baby in the middle ?"
  ],
  "answerDisplay": "Bhavika",
  "answers": [
   "bhavika"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-2.jpeg"
 },
 {
  "day": 17,
  "date": "2026-10-14",
  "displayDate": "October 14, 2026",
  "video": "https://youtu.be/I_UHWNkgzGI",
  "relation": "Friend",
  "wishFrom": "Mayuri",
  "lines": [
   "Where (City) was this picture taken ?"
  ],
  "answerDisplay": "Sedona",
  "answers": [
   "sedona"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-2.jpg"
 },
 {
  "day": 18,
  "date": "2026-10-15",
  "displayDate": "October 15, 2026",
  "video": "https://youtube.com/shorts/VhqYw6WyuIk?feature=share",
  "relation": "Friend",
  "wishFrom": "Meenu",
  "lines": [
   "Which festival is celebrated in this picture"
  ],
  "answerDisplay": "Rakhi",
  "answers": [
   "rakhi",
   "rakshabandhan"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-5.jpeg"
 },
 {
  "day": 19,
  "date": "2026-10-16",
  "displayDate": "October 16, 2026",
  "video": "https://youtu.be/Jre-U5hMtqg",
  "relation": "Friend",
  "wishFrom": "Leah & Shree",
  "lines": [
   "Where (State) was this picture taken ?"
  ],
  "answerDisplay": "Alaska",
  "answers": [
   "alaska"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-1.jpg"
 },
 {
  "day": 20,
  "date": "2026-10-17",
  "displayDate": "October 17, 2026",
  "video": "https://youtu.be/L5XfPm2tlOM",
  "relation": "Friend",
  "wishFrom": "Jagruti",
  "lines": [
   "Where (City) was this picture taken ? Its not Boston - HAHA"
  ],
  "answerDisplay": "San Francisco",
  "answers": [
   "san francisco"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-3.jpg"
 },
 {
  "day": 21,
  "date": "2026-10-18",
  "displayDate": "October 18, 2026",
  "video": "https://youtu.be/PrJZoyts7e0",
  "relation": "Friend",
  "wishFrom": "Divya & Pankaj",
  "lines": [
   "Where (City) was this picture taken ?"
  ],
  "answerDisplay": "Ajman",
  "answers": [
   "ajman",
   "dubai"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-3.jpeg"
 },
 {
  "day": 22,
  "date": "2026-10-19",
  "displayDate": "October 19, 2026",
  "video": "https://youtu.be/LkJNKFt4leM",
  "relation": "Friend",
  "wishFrom": "Rushiraj, Veer, Heer, Moulika & Pranali",
  "lines": [
   "Whose Birthday are you celebrating in this picture?"
  ],
  "answerDisplay": "Bhargav",
  "answers": [
   "bhargav"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-4.jpeg"
 },
 {
  "day": 23,
  "date": "2026-10-20",
  "displayDate": "October 20, 2026",
  "video": "https://www.youtube.com/watch?v=aq81_wqX7QI",
  "relation": "Cousin",
  "wishFrom": "Umang & Hiral Family",
  "lines": [
   "What was the name of the tutor whose house Bhavika ran away from ?"
  ],
  "answerDisplay": "Janet",
  "answers": [
   "janet",
   "janet aunty",
   "ms janet"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 24,
  "date": "2026-10-21",
  "displayDate": "October 21, 2026",
  "video": "https://youtu.be/26SCfqydB5c",
  "relation": "Cousin",
  "wishFrom": "Jetha Bapa Family",
  "lines": [
   "What was the subject of your Rangoli, for which you won the prize ?"
  ],
  "answerDisplay": "Ganesh",
  "answers": [
   "ganesh",
   "ganpati"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 25,
  "date": "2026-10-22",
  "displayDate": "October 22, 2026",
  "video": "https://youtu.be/GC6Eh0lCJ84",
  "relation": "Friend",
  "wishFrom": "Misri - Payal",
  "lines": [
   "Which year (yyyy) did you win Toastmasters in Bahrain ?"
  ],
  "answerDisplay": "2003",
  "answers": [
   "2003"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 26,
  "date": "2026-10-23",
  "displayDate": "October 23, 2026",
  "video": "https://youtu.be/phHyke6ATkM",
  "relation": "Cousin",
  "wishFrom": "Komal",
  "lines": [
   "What was the color of the dollhouse, where you and Bhavika played house ?"
  ],
  "answerDisplay": "Pink",
  "answers": [
   "pink"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 27,
  "date": "2026-10-24",
  "displayDate": "October 24, 2026",
  "video": "https://youtu.be/SgRSLdRFpfE",
  "relation": "Cousin",
  "wishFrom": "Vatsal Bhai & Sejal",
  "lines": [
   "What souvenir did Raj bring for you from Brazil ?"
  ],
  "answerDisplay": "Windchime",
  "answers": [
   "windchime"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 28,
  "date": "2026-10-25",
  "displayDate": "October 25, 2026",
  "video": "https://youtu.be/TtJjY6mlONw?si=ICLkMwLpJCyYmHmT",
  "relation": "Uncle-In-Law",
  "wishFrom": "Mayurbhai & Rajubhai Family",
  "lines": [
   "Which month and year (mm/yyyy) was this picture taken ?"
  ],
  "answerDisplay": "02/2016",
  "answers": [
   "02/2016"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Alap-6.jpeg"
 },
 {
  "day": 29,
  "date": "2026-10-26",
  "displayDate": "October 26, 2026",
  "video": "https://youtu.be/yT0IEMagJ_k",
  "relation": "Cousin",
  "wishFrom": "Pravin Bapa Family",
  "lines": [
   "What was the exact date (mm/dd/yyyy) when this picture was taken"
  ],
  "answerDisplay": "11/6/2015",
  "answers": [
   "11/6/2015"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-5.jpg"
 },
 {
  "day": 30,
  "date": "2026-10-27",
  "displayDate": "October 27, 2026",
  "video": "https://youtu.be/7Qai7Mav74c",
  "relation": "Niece",
  "wishFrom": "Jayanti Bapa Family",
  "lines": [
   "Where (City) did you celebrate your 30th Bday ?"
  ],
  "answerDisplay": "Surednranagar",
  "answers": [
   "surednranagar"
  ],
  "hint": "Think back carefully to the memory behind this question."
 },
 {
  "day": 31,
  "date": "2026-10-28",
  "displayDate": "October 28, 2026",
  "video": "https://youtube.com/shorts/54fL1VjiIyY?feature=share",
  "relation": "Cousin",
  "wishFrom": "Poona Bapuji Family",
  "lines": [
   "What was the exact date (mm/dd/yyyy) when this picture was taken ?"
  ],
  "answerDisplay": "11/06/2017",
  "answers": [
   "11/06/2017"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-6.jpg"
 },
 {
  "day": 32,
  "date": "2026-10-29",
  "displayDate": "October 29, 2026",
  "video": "https://youtu.be/sWUeLegdRrQ",
  "relation": "Cousin",
  "wishFrom": "Neha",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "2018",
  "answers": [
   "2018"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-7.jpg"
 },
 {
  "day": 33,
  "date": "2026-10-30",
  "displayDate": "October 30, 2026",
  "video": "https://youtu.be/5K1bO78drq0",
  "relation": "Sister-In-Law",
  "wishFrom": "Hetvi & Abhit",
  "lines": [
   "Exact date (mm/dd/yyyy) when this picture was taken ?"
  ],
  "answerDisplay": "01/05/2017",
  "answers": [
   "01/05/2017"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-12.jpg"
 },
 {
  "day": 34,
  "date": "2026-10-31",
  "displayDate": "October 31, 2026",
  "video": "https://youtu.be/A8tQixyaVbg",
  "relation": "Aunty & Family",
  "wishFrom": "Kaki, Gaurav, Avani, Dhamini",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "2020",
  "answers": [
   "2020"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-8.jpg"
 },
 {
  "day": 35,
  "date": "2026-11-01",
  "displayDate": "November 1, 2026",
  "video": "https://youtu.be/HRwHPGniiog",
  "relation": "Brother",
  "wishFrom": "Bhargav",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "2021",
  "answers": [
   "2021"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-9.jpg"
 },
 {
  "day": 36,
  "date": "2026-11-02",
  "displayDate": "November 2, 2026",
  "video": null,
  "relation": "Sister",
  "wishFrom": "Anjani",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "2022",
  "answers": [
   "2022"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-10.jpg"
 },
 {
  "day": 37,
  "date": "2026-11-03",
  "displayDate": "November 3, 2026",
  "video": "https://youtu.be/WX7MkZpFiIQ",
  "relation": "Sister",
  "wishFrom": "Bhavika",
  "lines": [
   "Where (Country) was this picture taken ?"
  ],
  "answerDisplay": "Singapore",
  "answers": [
   "singapore"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-4.jpg"
 },
 {
  "day": 38,
  "date": "2026-11-04",
  "displayDate": "November 4, 2026",
  "video": "https://youtu.be/i2IfDjN-tb0",
  "relation": "Dad",
  "wishFrom": "Suresh Chavda",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "2024",
  "answers": [
   "2024"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-11.jpg"
 },
 {
  "day": 39,
  "date": "2026-11-05",
  "displayDate": "November 5, 2026",
  "video": "https://youtube.com/shorts/ahWvAv5jIP0?feature=share",
  "relation": "Mom",
  "wishFrom": "Leela Chavda",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "2016",
  "answers": [
   "2016"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-13.jpg"
 },
 {
  "day": 40,
  "date": "2026-11-06",
  "displayDate": "November 6, 2026",
  "video": null,
  "relation": "Husband",
  "wishFrom": "Raj",
  "lines": [
   "Which year (yyyy) was this picture taken ?"
  ],
  "answerDisplay": "2019",
  "answers": [
   "2019"
  ],
  "hint": "Think back carefully to the memory behind this question.",
  "photo": "Raj-14.jpg",
  "unlockAt": "2026-11-06T00:01:00-05:00"
 }
];

// Runtime hardening: puzzle definitions are read-only once the app loads.
DAYS.forEach(d=>{
  if(Array.isArray(d.answers)) Object.freeze(d.answers);
  if(Array.isArray(d.lines)) Object.freeze(d.lines);
  Object.freeze(d);
});
Object.freeze(DAYS);

const WRONG_MESSAGES=[
 "Not quite 😏 Two guesses left.",
 "Still locked 🔒 One guess left.",
 "Nope 😂 The mystery wins this round."
];

const ANSWER_PLACEHOLDERS=[
 "3 GUESSES — ENTER YOUR ANSWER",
 "2 GUESSES LEFT — TRY AGAIN",
 "1 GUESS LEFT — MAKE IT COUNT",
 "BONUS 4TH GUESS — LAST CHANCE",
 ""
];

let currentDay=DAYS[0], attemptsUsed=0, bonusAttemptActive=false;
let wrongPopupAwaitingAck=false, wrongPopupSuppressClickUntil=0, wrongPopupReadyAt=0;
let wrongPopupLockedValue="";
let mobileWrongAckGuardUntil=0, wrongAckShieldTimer=0;
let mobileSuccessGuardUntil=0;
let confirmGiveUpReadyAt=0, confirmGiveUpUnlockTimer=0;
let celebrationCleanupTimer=0, celebrationRunId=0;

const $=id=>document.getElementById(id);

function isLikelyPhone(){
 const ua=navigator.userAgent||"";
 return /Android.*Mobile|iPhone|iPod|Windows Phone|Mobile Safari/i.test(ua) ||
   ((window.matchMedia?.("(pointer: coarse)").matches||false) &&
    Math.min(window.screen.width||9999,window.screen.height||9999)<=900);
}
function fitRevealAnswer(text){
 const el=$("answerReveal"); if(!el) return;
 el.style.whiteSpace="nowrap";
 el.style.overflow="hidden";
 el.style.textOverflow="clip";
 const start=isLikelyPhone()?22:28;
 el.style.fontSize=start+"px";
 requestAnimationFrame(()=>{
   let size=start;
   while(el.scrollWidth>el.clientWidth && size>12){
     size-=1;
     el.style.fontSize=size+"px";
   }
 });
}
function hidePhoneQr(){
 const phone=isLikelyPhone();
 ["video","finale"].forEach(id=>{
   const screen=$(id);
   if(!screen) return;
   const pending=screen.dataset.videoAvailable==="0";
   screen.querySelectorAll(".divider,.qr-wrap,.qr-wrap + .muted.small")
     .forEach(el=>el.style.display=(phone||pending)?"none":"");
 });
}
function hasVideo(day=currentDay){
 return !!(day && typeof day.video==="string" && /^https?:\/\//i.test(day.video));
}
function setVideoAvailability(screenId,buttonId,qrId){
 const screen=$(screenId), button=$(buttonId), qr=$(qrId);
 const available=hasVideo();
 if(screen) screen.dataset.videoAvailable=available?"1":"0";
 if(button) button.disabled=!available;
 if(qr){
   if(available) qr.src=`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(currentDay.video)}`;
   else qr.removeAttribute("src");
 }
 hidePhoneQr();
 return available;
}
function keyboardOffset(){
 const vv=window.visualViewport;
 return vv?Math.max(0,window.innerHeight-vv.height-vv.offsetTop):0;
}
function positionKeyboardUI(){
 const vv=window.visualViewport;
 document.documentElement.style.setProperty("--keyboard-offset",keyboardOffset()+"px");
 if(vv){
   document.documentElement.style.setProperty("--visual-top",vv.offsetTop+"px");
   document.documentElement.style.setProperty("--visual-height",vv.height+"px");
 }
 const p=$("wrongAnswerPopover");
 if(p && p.classList.contains("show") && isLikelyPhone()){
   requestAnimationFrame(()=>{
     const viewportTop=vv?vv.offsetTop:0;
     const viewportHeight=vv?vv.height:window.innerHeight;
     const safeGap=10;
     const maxH=Math.max(104,viewportHeight-(safeGap*2));
     p.style.maxHeight=maxH+"px";
     p.style.bottom="auto";
     const top=viewportTop+safeGap;
     const currentTop=parseFloat(p.style.top);
     if(!Number.isFinite(currentTop) || Math.abs(currentTop-top)>=2) p.style.top=top+"px";
   });
 }
}
function keepAnswerVisible(){
 if(!isLikelyPhone()) return;
 const input=$("answerInput"), vv=window.visualViewport;
 if(!input) return;
 if(!vv){input.scrollIntoView({block:"center",behavior:"smooth"});return}
 const r=input.getBoundingClientRect(), bottom=vv.offsetTop+vv.height-22;
 if(r.bottom>bottom || r.top<vv.offsetTop+12){
   input.scrollIntoView({block:"center",behavior:"smooth"});
 }
}
function refocusAnswer(adjust=true){
 const input=$("answerInput"); if(!input||input.disabled)return;
 requestAnimationFrame(()=>{
   try{input.focus({preventScroll:true})}catch{input.focus()}
   if(adjust){setTimeout(keepAnswerVisible,180);setTimeout(keepAnswerVisible,420)}
 });
}
function openConfirmGiveUpGuarded(){
 // Mobile Chrome can synthesize a follow-up click after the pointerup that
 // dismisses the surrender popup. If the confirm screen is already live, that
 // ghost click can hit WAIT or SAVE ME and make the screen appear to skip.
 // Keep both controls inert until the originating tap sequence is safely over.
 const tryAgain=$("tryAgainBtn"), saveMe=$("saveMeBtn");
 clearTimeout(confirmGiveUpUnlockTimer);
 confirmGiveUpReadyAt=Date.now()+550;
 if(tryAgain) tryAgain.disabled=true;
 if(saveMe) saveMe.disabled=true;
 show("confirmGiveUp");
 confirmGiveUpUnlockTimer=setTimeout(()=>{
   if($("confirmGiveUp")?.classList.contains("active")){
     if(tryAgain) tryAgain.disabled=false;
     if(saveMe) saveMe.disabled=false;
   }
 },560);
}
function armWrongAckShield(backdrop,ms=620){
 if(!isLikelyPhone()) { if(backdrop) backdrop.remove(); return; }
 clearTimeout(wrongAckShieldTimer);
 mobileWrongAckGuardUntil=Date.now()+ms;
 if(backdrop){
   backdrop.classList.add("show","ack-shield");
   backdrop.setAttribute("aria-hidden","true");
 }
 wrongAckShieldTimer=window.setTimeout(()=>{
   if(backdrop?.isConnected) backdrop.remove();
 },ms+40);
}

function acknowledgeWrongPopup(p){
 if(!p || !p.classList.contains("show")) return;
 wrongPopupAwaitingAck=false;
 wrongPopupLockedValue="";
 const backdrop=$("wrongAnswerBackdrop");
 if(p.dataset.mode==="surrender"){
   p.classList.remove("show");
   if(backdrop) backdrop.remove();
   openConfirmGiveUpGuarded();
   return;
 }
 const showSurrender=p.dataset.after==="surrender";
 p.classList.remove("show");
 p.setAttribute("aria-hidden","true");
 // v2.29: do not expose the puzzle/HOME controls to the tail end of the same
 // mobile tap that pressed OK. Keep an invisible modal shield briefly in place
 // and also arm a global capture guard for delayed/synthetic compatibility clicks.
 armWrongAckShield(backdrop,620);
 if(showSurrender){
   setTimeout(()=>{
     if(Date.now()>=mobileWrongAckGuardUntil) showSurrenderPopup();
   },660);
 }
}
function buildWrongPopup(){
 // v2.7: fresh modal + backdrop for every failed attempt. The backdrop blocks
 // ghost taps from landing on HOME or puzzle controls while the keyboard resizes.
 const old=$("wrongAnswerPopover"); if(old) old.remove();
 const oldBackdrop=$("wrongAnswerBackdrop"); if(oldBackdrop) oldBackdrop.remove();

 const backdrop=document.createElement("div");
 backdrop.id="wrongAnswerBackdrop";
 backdrop.className="wrong-answer-backdrop";
 backdrop.setAttribute("aria-hidden","true");

 const p=document.createElement("div");
 p.id="wrongAnswerPopover"; p.className="wrong-answer-popover";
 p.setAttribute("role","dialog"); p.setAttribute("aria-live","assertive"); p.setAttribute("aria-hidden","true");
 p.innerHTML='<div class="wap-message"></div><div class="wap-remaining"></div><button class="wap-ok" type="button">OK</button>';

 backdrop.appendChild(p);
 document.body.appendChild(backdrop);

 backdrop.addEventListener("pointerdown",e=>{ if(e.target===backdrop) e.preventDefault(); });
 backdrop.addEventListener("click",e=>{ if(e.target===backdrop){e.preventDefault();e.stopPropagation();} });

 const ok=p.querySelector(".wap-ok");
 ok.addEventListener("pointerdown",e=>{
   if(isLikelyPhone() && p.dataset.mode!=="surrender") e.preventDefault();
 });
 ok.addEventListener("pointerup",e=>{
   if(!isLikelyPhone()) return;
   e.preventDefault(); e.stopPropagation();
   if(Date.now()<wrongPopupReadyAt) return;
   wrongPopupSuppressClickUntil=Date.now()+350;
   acknowledgeWrongPopup(p);
 });
 ok.addEventListener("click",e=>{
   if(Date.now()<wrongPopupReadyAt || Date.now()<wrongPopupSuppressClickUntil){e.preventDefault();return;}
   acknowledgeWrongPopup(p);
 });
 return p;
}
function ensureWrongPopup(){
 return $("wrongAnswerPopover") || buildWrongPopup();
}
function revealFirstWrongPopupAfterViewportSettles(p){
 // v2.24: the first mobile error occurs while Android is still in its first
 // keyboard/scroll viewport session. Keep the proven v2.7 positioning model,
 // but wait for the visual viewport to stop moving before revealing attempt 1.
 const started=Date.now();
 let lastKey="", stableSamples=0;
 const sample=()=>{
   if(!p?.isConnected || !p.classList.contains("show")) return;
   const vv=window.visualViewport;
   const key=vv?`${Math.round(vv.offsetTop)}:${Math.round(vv.height)}:${Math.round(vv.width)}:${Math.round(window.scrollY)}`:`${window.innerHeight}:${Math.round(window.scrollY)}`;
   if(key===lastKey) stableSamples++; else { lastKey=key; stableSamples=0; }
   positionKeyboardUI();
   if(stableSamples>=2 || Date.now()-started>=650){
     requestAnimationFrame(()=>{
       positionKeyboardUI();
       requestAnimationFrame(()=>{
         if(!p.isConnected || !p.classList.contains("show")) return;
         p.style.visibility="visible";
         p.style.opacity="1";
       });
     });
     return;
   }
   setTimeout(sample,70);
 };
 // Normalize the answer field into the visible keyboard viewport first. This
 // is especially important for photo puzzles whose document height is larger.
 keepAnswerVisible();
 setTimeout(sample,70);
}
function showWrongPopup(message,remaining){
 if(!isLikelyPhone())return false;
 // Fresh DOM instance for EVERY attempt. The attempt cannot be submitted again
 // until this exact instance is acknowledged because wrongPopupAwaitingAck=true.
 const p=buildWrongPopup();
 wrongPopupAwaitingAck=true;
 wrongPopupLockedValue=$("answerInput")?.value??"";
 p.dataset.mode="wrong";
 p.dataset.attempt=String(MAX_ATTEMPTS-remaining);
 p.dataset.after=remaining===0?"surrender":"";
 p.querySelector(".wap-message").textContent=message;
 // The fixed attempt-specific sentence already carries the countdown. Keep the
 // second line empty so the mobile popup stays short and never repeats itself.
 p.querySelector(".wap-remaining").textContent="";
 p.querySelector(".wap-ok").textContent="OK";
 wrongPopupReadyAt=Date.now()+400;
 const backdrop=$("wrongAnswerBackdrop");
 if(backdrop){backdrop.classList.add("show");backdrop.setAttribute("aria-hidden","false");}
 p.classList.add("show");
 p.setAttribute("aria-hidden","false");
 // Keep the popup hidden until its final position is known. All three wrong-answer
 // attempts now share the same top-of-visible-viewport geometry. Attempt 1 retains
 // the extra quiet-period stabilization because it occurs during the initial keyboard session.
 p.style.visibility="hidden";
 p.style.opacity="0";
 const attemptNumber=MAX_ATTEMPTS-remaining;
 if(attemptNumber===1){
   revealFirstWrongPopupAfterViewportSettles(p);
 }else{
   positionKeyboardUI();
   requestAnimationFrame(()=>{positionKeyboardUI(); requestAnimationFrame(positionKeyboardUI);});
   setTimeout(positionKeyboardUI,80);
   setTimeout(()=>{
     positionKeyboardUI();
     requestAnimationFrame(()=>{
       if(!p.isConnected || !p.classList.contains("show")) return;
       p.style.visibility="visible";
       p.style.opacity="1";
     });
   },220);
 }
 return true;
}
function showSurrenderPopup(){
 if(!isLikelyPhone())return false;
 const p=buildWrongPopup();
 wrongPopupAwaitingAck=true;
 wrongPopupLockedValue=$("answerInput")?.value??"";
 p.dataset.mode="surrender";
 p.dataset.attempt="";
 p.dataset.after="";
 p.querySelector(".wap-message").textContent="I GIVE UP — I'M SO OLD… I'M ABOUT TO TURN 40! 😂";
 p.querySelector(".wap-remaining").textContent="The mystery wins this round.";
 p.querySelector(".wap-ok").textContent="I GIVE UP 😂";
 wrongPopupReadyAt=Date.now()+400;
 const backdrop=$("wrongAnswerBackdrop");
 if(backdrop){backdrop.classList.add("show");backdrop.setAttribute("aria-hidden","false");}
 p.classList.add("show");
 p.setAttribute("aria-hidden","false");
 // v2.14 is intentionally based on the stable v2.7 popup code. Keep the
 // same placement sequence, but conceal the modal during those first layout
 // passes so the user sees only the final stable position instead of flicker.
 p.style.visibility="hidden";
 p.style.opacity="0";
 positionKeyboardUI();
 requestAnimationFrame(()=>{positionKeyboardUI(); requestAnimationFrame(positionKeyboardUI);});
 setTimeout(positionKeyboardUI,80);
 setTimeout(()=>{
   positionKeyboardUI();
   requestAnimationFrame(()=>{
     if(!p.isConnected || !p.classList.contains("show")) return;
     p.style.visibility="visible";
     p.style.opacity="1";
   });
 },220);
 return true;
}

const screens=[...document.querySelectorAll(".screen")];

function todayISO(){
 return easternDateISO(trustedNowMs());
}
function visibilityNow(){
 const ms=trustedNowMs();
 return Number.isFinite(ms)?new Date(ms):null;
}
if(QA_PREVIEW_MODE){
 try{document.title=`QA PREVIEW · ${document.title}`}catch{}
}

function show(id){
 if(id!=="finale") stopBirthdayCelebration();
 screens.forEach(s=>s.classList.toggle("active",s.id===id));
 document.body.classList.toggle("home-active",id==="home");
 document.body.classList.toggle("welcome-active",id==="welcome");
 if(id!=="puzzle") document.body.classList.remove("answer-entry-active");
 if(id!=="home"){
   document.body.classList.remove("home-grid-scrolled","portrait-score-fixed");
   portraitScoreTop=0;
 }
 window.scrollTo({top:0,left:0,behavior:"auto"});
 setTimeout(()=>{
   hidePhoneQr();
   if(id==="home"){document.body.classList.remove("portrait-score-fixed");portraitScoreTop=0;measurePortraitScore();syncPortraitScoreFreeze();}
 },0);
}
function norm(v){return v.trim().toLowerCase().replace(/\s+/g," ")}
const RESULT_PREFIX=QA_PREVIEW_MODE
 ? "route4t_qa_preview_exit_"
 : (IS_MIKA?"route4t_2026_exit_":"route4t_2026_raj_exit_");
const BACKUP_KEY=QA_PREVIEW_MODE
 ? "route4t_qa_preview_progress_backup_v1"
 : (IS_MIKA?"route4t_2026_progress_backup_v1":"route4t_2026_raj_progress_backup_v1");
function key(day){return `${RESULT_PREFIX}${day}`}
function validResult(r){
 if(!r || typeof r!=="object") return false;
 if(r.outcome==="solved") return Number.isInteger(r.attempts)&&r.attempts>=1&&r.attempts<=MAX_TOTAL_ATTEMPTS;
 if(r.outcome==="gave-up") return r.attempts===MAX_ATTEMPTS||r.attempts===MAX_TOTAL_ATTEMPTS;
 if(r.outcome==="in-progress") return Number.isInteger(r.attemptsUsed)&&r.attemptsUsed>=0&&r.attemptsUsed<=MAX_TOTAL_ATTEMPTS;
 return false;
}
function readBackup(){try{const x=JSON.parse(localStorage.getItem(BACKUP_KEY)||"{}");return x&&typeof x==="object"?x:{}}catch{return {}}}
function writeBackup(all){try{localStorage.setItem(BACKUP_KEY,JSON.stringify(all))}catch{}}
function rawPrimary(day){try{const r=JSON.parse(localStorage.getItem(key(day))||"null");return validResult(r)?r:null}catch{return null}}
function getResult(day){
 const primary=rawPrimary(day);
 const backup=readBackup();
 const mirror=validResult(backup[day])?backup[day]:null;
 // Completed results are immutable: if the backup already has a final result, it wins.
 const chosen=(mirror&&(mirror.outcome==="solved"||mirror.outcome==="gave-up"))?mirror:(primary||mirror);
 if(chosen){
   try{if(JSON.stringify(primary)!==JSON.stringify(chosen)) localStorage.setItem(key(day),JSON.stringify(chosen))}catch{}
   if(JSON.stringify(mirror)!==JSON.stringify(chosen)){backup[day]=chosen;writeBackup(backup)}
 }
 return chosen||null;
}
function saveResult(day,result){
 if(!validResult(result)) return getResult(day);
 const existing=getResult(day);
 // Never overwrite an already completed EXIT through app code.
 if(existing&&(existing.outcome==="solved"||existing.outcome==="gave-up")) return existing;
 // Do not allow in-progress attempt counts to move backwards except via the explicit retry button.
 if(existing?.outcome==="in-progress"&&result.outcome==="in-progress"&&result.attemptsUsed<existing.attemptsUsed) return existing;
 try{localStorage.setItem(key(day),JSON.stringify(result))}catch{}
 const backup=readBackup(); backup[day]=result; writeBackup(backup);
 return result;
}
function saveInProgress(day,count,bonus=false){return saveResult(day,{outcome:"in-progress",attemptsUsed:count,bonusAttempt:!!bonus,updatedAt:gameNowISO()})}
function grantBonusAttempt(day){
 return saveResult(day,{outcome:"in-progress",attemptsUsed:MAX_ATTEMPTS,bonusAttempt:true,updatedAt:gameNowISO()});
}

function isFinalResult(r){return !!r&&(r.outcome==="solved"||r.outcome==="gave-up")}
function isDateEligible(d){
 if(QA_PREVIEW_MODE || QA_SHOW_ALL_EXITS) return true;
 const now=visibilityNow();
 if(!now) return false; // fail closed: never trust the phone clock
 if(d.unlockAt) return now.getTime()>=Date.parse(d.unlockAt);
 const today=todayISO();
 return !!today && d.date<=today;
}
function nextRequiredDay(){
 const eligible=DAYS.filter(isDateEligible).slice().sort((a,b)=>a.day-b.day);
 return eligible.find(d=>!isFinalResult(getResult(d.day)))||null;
}
function scoreSnapshot(){
 const s=computeStats();
 return `Mika ${s.solved} | Mystery ${s.flags} | Solved ${s.solved}/40 | White Flags ${s.flags} | First-Try ${s.firstTry} | Current Streak ${s.current} | Best Streak ${s.best}`;
}
function emailTime(){
 const ms=trustedNowMs();
 const d=new Date(Number.isFinite(ms)?ms:Date.now());
 try{return d.toLocaleString("en-US",{timeZone:"America/New_York",dateStyle:"medium",timeStyle:"short"})+" ET"}catch{return d.toString()}
}
function emailSentKey(id){return EMAIL_SENT_PREFIX+id}
function emailWasSent(id){try{return localStorage.getItem(emailSentKey(id))==="1"}catch{return false}}
function markEmailSent(id){try{localStorage.setItem(emailSentKey(id),"1")}catch{}}
function readEmailQueue(){try{const x=JSON.parse(localStorage.getItem(EMAIL_QUEUE_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return []}}
function writeEmailQueue(q){try{localStorage.setItem(EMAIL_QUEUE_KEY,JSON.stringify(q.slice(-60)))}catch{}}
function isFinalEmailItem(item){
 return !!item && typeof item.id==="string" && (/^solved-\d+$/.test(item.id)||/^surrender-\d+$/.test(item.id));
}
function queueEmail(item){
 if(!isFinalEmailItem(item) || emailWasSent(item.id)) return;
 const q=readEmailQueue().filter(isFinalEmailItem);
 if(!q.some(x=>x.id===item.id)){q.push(item);writeEmailQueue(q)}
}
async function deliverEmail(item){
 if(emailWasSent(item.id)) return true;
 try{
   const res=await fetch(FORMSPREE_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(item.fields),keepalive:true});
   if(res.ok){markEmailSent(item.id);return true}
 }catch{}
 return false;
}
function sendGameEmailOnce(id,fields){
 if(!IS_MIKA || QA_PREVIEW_MODE) return;
 if(emailWasSent(id)) return;
 const item={id,fields:{...fields,_subject:fields._subject||"Route 4T Game Alert"}};
 deliverEmail(item).then(ok=>{if(!ok) queueEmail(item)});
}
async function flushEmailQueue(){
 if(QA_PREVIEW_MODE) return;
 // Discard legacy OPEN/ANSWER queue entries from v2.46 so they cannot consume quota later.
 const q=readEmailQueue().filter(isFinalEmailItem);
 writeEmailQueue(q);
 if(!q.length)return;
 const keep=[];
 for(const item of q){if(!(await deliverEmail(item))) keep.push(item)}
 writeEmailQueue(keep);
}
// v2.47 quota protection: intermediate activity is intentionally silent.
function notifyExitOpened(day){}
function notifyAnswer(day,attempt,answer,result){}
function notifySolved(day,attempt){
 sendGameEmailOnce(`solved-${day.day}`,{
   _subject:`[${EMAIL_ENV_LABEL}] MIKA — Route 4T — EXIT ${day.day} SOLVED ✅`,event:"EXIT SOLVED",exit:day.day,date:day.displayDate,attempts:attempt,time:emailTime(),scoreboard:scoreSnapshot()
 });
}
function notifySurrender(day){
 sendGameEmailOnce(`surrender-${day.day}`,{
   _subject:`[${EMAIL_ENV_LABEL}] MIKA — Route 4T — EXIT ${day.day} WHITE FLAG 🏳️`,event:"EXIT SURRENDERED",exit:day.day,date:day.displayDate,time:emailTime(),scoreboard:scoreSnapshot()
 });
}
function showSequencePopup(required,requested){
 const old=$("sequenceGateBackdrop"); if(old)old.remove();
 const bd=document.createElement("div"); bd.id="sequenceGateBackdrop"; bd.className="sequence-gate-backdrop";
 const box=document.createElement("div"); box.className="sequence-gate-popup";
 box.innerHTML=`<div class="sequence-gate-icons">🚧 ⚠️</div><div class="sequence-gate-title">NOT SO FAST, MIKA !!</div><div class="sequence-gate-copy">Cant Skip Exit on Route-4T.<br><strong>Exit ${required.day} is your next exit.</strong></div><button type="button">Take me to Exit ${required.day}</button>`;
 bd.appendChild(box);document.body.appendChild(bd);
 const go=()=>{bd.remove();openDay(required.day)};
 box.querySelector("button").onclick=go;
 bd.addEventListener("click",e=>{if(e.target===bd)bd.remove()});
}
function renderQuestionInto(targetId,day){
 const target=$(targetId); if(!target)return;
 const lines=day.lines||[];
 const photoMarkup=day.photo?`<div class="question-media"><img class="puzzle-photo" src="photos/${encodeURIComponent(day.photo)}" alt="Memory clue for EXIT ${day.day}" loading="eager" decoding="async"></div>`:"";
 target.innerHTML=photoMarkup+lines.map(line=>line===""?`<div class="gap"></div>`:`<span class="line">${line}</span>`).join("");
}
function openReview(day,result){
 currentDay=day;
 $("reviewEyebrow").textContent=`EXIT ${day.day} · ${day.displayDate.toUpperCase()}`;
 const badge=document.querySelector("#review .review-badge");
 if(badge) badge.textContent=result.outcome==="solved"?"ALREADY SOLVED ✅":"MYSTERY WON 🏳️";
 renderQuestionInto("reviewQuestion",day);
 $("reviewAnswer").textContent=day.answerDisplay;
 $("reviewOutcome").textContent=result.outcome==="solved"
   ?`You already cleared this Exit in ${result.attempts} attempt${result.attempts===1?"":"s"}. Your score is locked.`
   :"You already completed this Exit. Your white flag and score are locked.";
 const gift=$("reviewGiftBtn");
 const isFinal=day.day===FINAL_EXIT;
 const available=hasVideo(day);
 gift.disabled=false;
 if(isFinal){
   // Completed EXIT 40 should still feel like the finale while letting Mika
   // reread the puzzle and answer. Keep the final-video placeholder visible
   // even before the video URL is supplied, and replay the celebration.
   gift.style.display="";
   gift.textContent=available?"VIEW YOUR BIRTHDAY SURPRISE 🎁":"FINAL VIDEO COMING SOON";
   gift.disabled=!available;
   gift.onclick=available?()=>openBirthdayFinale():null;
 }else{
   gift.textContent="VIEW YOUR GIFT 🎁";
   gift.style.display=available?"":"none";
   gift.onclick=available?()=>result.outcome==="solved"?openSurprise(true):openSurprise(false):null;
 }
 show("review");
 if(isFinal){
   const reviewRun=celebrationRunId;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
     if(reviewRun!==celebrationRunId || !$("review")?.classList.contains("active")) return;
     launchBirthdayCelebration("review");
   }));
 }
}
function isVisible(d){
 if(QA_SHOW_ALL_EXITS) return true;
 // Grandfather any exit already completed before v2.47 so Mika's score/history never changes.
 if(isFinalResult(getResult(d.day))) return true;
 return isDateEligible(d);
}
function wrongMessageForAttempt(attemptNumber){
 return WRONG_MESSAGES[Math.max(0,Math.min(WRONG_MESSAGES.length-1,attemptNumber-1))];
}
function syncAnswerPlaceholder(){
 const input=$("answerInput");
 if(!input) return;
 input.placeholder=ANSWER_PLACEHOLDERS[Math.max(0,Math.min(ANSWER_PLACEHOLDERS.length-1,attemptsUsed))];
}
function dateValue(iso){
 const [y,m,d]=iso.split("-").map(Number);
 return Date.UTC(y,m-1,d);
}
function visibleDays(){
 return DAYS
   .filter(d=>isVisible(d))
   .slice()
   .sort((a,b)=>dateValue(b.date)-dateValue(a.date)); // newest first, deterministic across browsers
}
function computeStats(){
 const ordered=DAYS.filter(d=>isVisible(d) && d.day!==FINAL_EXIT).slice().sort((a,b)=>dateValue(a.date)-dateValue(b.date)); // EXIT 40 finale is playable but intentionally excluded from scoreboard stats
 let solved=0,flags=0,firstTry=0,current=0,best=0;
 for(const d of ordered){
   const r=getResult(d.day);
   if(!r) continue; // missed day doesn't break streak
   if(r.outcome==="solved"){
     solved++; if(r.attempts===1) firstTry++;
     current++; best=Math.max(best,current);
   }else if(r.outcome==="gave-up"){
     flags++; current=0;
   }
 }
 return {solved,flags,firstTry,current,best};
}
function renderScore(){
 const s=computeStats();
 $("mikaScore").textContent=s.solved;
 $("mysteryScore").textContent=s.flags;
 $("solvedCount").textContent=`${s.solved}/40`;
 $("flagCount").textContent=s.flags;
 $("firstTryCount").textContent=s.firstTry;
 $("streakCount").textContent=s.current;
 $("bestStreakCount").textContent=s.best;
}

function syncMobileHomeChrome(){
 const grid=$("dayGrid");
 if(!grid) return;
 const mobile=window.matchMedia("(max-width: 620px)").matches;
 if(!mobile){
   document.body.classList.remove("home-grid-scrolled");
   return;
 }
 document.body.classList.toggle("home-grid-scrolled",grid.scrollTop>18);
}

let mobileHomeScrollBound=false;
function bindMobileHomeScroll(){
 if(mobileHomeScrollBound) return;
 const grid=$("dayGrid");
 if(!grid) return;
 grid.addEventListener("scroll",syncMobileHomeChrome,{passive:true});
 window.addEventListener("resize",syncMobileHomeChrome,{passive:true});
 window.addEventListener("orientationchange",()=>setTimeout(syncMobileHomeChrome,120),{passive:true});
 mobileHomeScrollBound=true;
}

let portraitScoreBound=false, portraitScoreTop=0;
function measurePortraitScore(){
 const stack=document.querySelector("#home .home-sticky-stack");
 if(!stack) return;
 const portrait=window.matchMedia("(max-width: 620px) and (orientation: portrait)").matches;
 if(!portrait || !document.body.classList.contains("home-active")){
   document.body.classList.remove("portrait-score-fixed");
   return;
 }
 if(!document.body.classList.contains("portrait-score-fixed")){
   portraitScoreTop=stack.getBoundingClientRect().top+window.scrollY;
 }
 const r=stack.getBoundingClientRect();
 document.documentElement.style.setProperty("--portrait-stack-left",r.left+"px");
 document.documentElement.style.setProperty("--portrait-stack-width",r.width+"px");
 document.documentElement.style.setProperty("--portrait-stack-space",(r.height+8)+"px");
 const score=document.querySelector("#home .score-card");
 if(score){
   const sr=score.getBoundingClientRect();
   document.documentElement.style.setProperty("--mobile-score-bottom",(8+sr.height)+"px");
 }
}
function syncPortraitScoreFreeze(){
 const portrait=window.matchMedia("(max-width: 620px) and (orientation: portrait)").matches;
 if(!portrait || !document.body.classList.contains("home-active")){
   document.body.classList.remove("portrait-score-fixed");
   return;
 }
 const topPad=7;
 if(!portraitScoreTop) measurePortraitScore();
 document.body.classList.toggle("portrait-score-fixed",window.scrollY>=Math.max(0,portraitScoreTop-topPad));
}
function bindPortraitScoreFreeze(){
 if(portraitScoreBound) return;
 window.addEventListener("scroll",syncPortraitScoreFreeze,{passive:true});
 window.addEventListener("resize",()=>{document.body.classList.remove("portrait-score-fixed");portraitScoreTop=0;requestAnimationFrame(()=>{measurePortraitScore();syncPortraitScoreFreeze();});},{passive:true});
 window.addEventListener("orientationchange",()=>setTimeout(()=>{document.body.classList.remove("portrait-score-fixed");portraitScoreTop=0;measurePortraitScore();syncPortraitScoreFreeze();},140),{passive:true});
 portraitScoreBound=true;
}

function lockIcon(open=false){
 const klass=open ? "state-icon solved-icon" : "state-icon unsolved-icon";
 const path=open
   ? `<path d="M8.4 10V7.3a3.6 3.6 0 0 1 6.7-1.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <rect x="6" y="10" width="12" height="10" rx="2.2" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="15" r="1.2" fill="currentColor"/>`
   : `<path d="M8.5 10V7.3a3.5 3.5 0 0 1 7 0V10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <rect x="6" y="10" width="12" height="10" rx="2.2" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="15" r="1.2" fill="currentColor"/>`;
 return `<svg class="${klass}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
}
function flagIcon(){
 return `<svg class="state-icon flag-icon" viewBox="0 0 24 24" aria-hidden="true">
   <path d="M7 21V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
   <path d="M8 4h9l-2.2 3L17 10H8z" fill="currentColor"/>
 </svg>`;
}

function stateMarkup(d){
 const r=getResult(d.day);
 if(r?.outcome==="solved"){
   return {icon:lockIcon(true),rowClass:"solved-state",state:`<span class="solved">${d.day===FINAL_EXIT?"🎉 HAPPY BIRTHDAY!":`MYSTERY SOLVED · ${r.attempts} ATTEMPT${r.attempts===1?"":"S"}`}</span>`};
 }
 if(r?.outcome==="gave-up"){
   return {icon:flagIcon(),rowClass:"flag-state",state:`<span class="flag">MYSTERY WON</span>`};
 }
 if(!isDateEligible(d)) return {icon:lockIcon(false),rowClass:"locked-state",state:`<span class="locked">LOCKED</span>`};
 const required=nextRequiredDay();
 if(!(QA_DISABLE_SEQUENCE||QA_PREVIEW_MODE) && required && d.day!==required.day){
   return {icon:lockIcon(false),rowClass:"locked-state sequence-locked",state:`<span class="locked">COMPLETE EXIT ${required.day} FIRST</span>`};
 }
 return {icon:lockIcon(true),rowClass:"ready-state",state:`<span class="ready">READY TO UNLOCK</span>`};
}
function renderGrid(){
 const grid=$("dayGrid");grid.innerHTML="";
 const vd=visibleDays();
 $("emptyState").classList.toggle("hidden",vd.length>0);
 vd.forEach((d,i)=>{
   const status=stateMarkup(d);
   const b=document.createElement("button");
   b.className="day-card entering";
   const todayChip=d.date===todayISO()?`<span class="today-chip">TODAY</span>`:"";
   b.dataset.secret=String(d.day);
   b.dataset.date=d.date;
   b.innerHTML=`<div class="route-tile-top"><svg class="us-route-shield" viewBox="0 0 64 72" role="img" aria-label="U.S. Route 4T" style="display:block;background:transparent!important;filter:none!important;opacity:1!important;color:#000!important"><path d="M32 3 C25 7 18 9 8 8 C9 15 8 21 5 27 C2 33 4 42 8 49 C13 58 22 65 32 70 C42 65 51 58 56 49 C60 42 62 33 59 27 C56 21 55 15 56 8 C46 9 39 7 32 3 Z" fill="#ffffff" stroke="#000000" style="fill:#ffffff!important;fill-opacity:1!important;stroke:#000000!important;stroke-opacity:1!important;opacity:1!important" stroke-width="3.2" stroke-linejoin="round"/><text x="32" y="44" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="900" fill="#000000" style="fill:#000000!important;color:#000000!important;fill-opacity:1!important;opacity:1!important">4T</text></svg><div class="exit-number-lockup"><span class="exit-sign-label">EXIT</span><span class="exit-sign-number">${d.day}</span></div></div><div class="date">${d.displayDate} ${todayChip}</div><div class="state-row ${status.rowClass}">${status.icon}<div class="state">${status.state}</div><span class="state-chevron" aria-hidden="true">›</span></div>`;
   b.onclick=()=>openDay(d.day);
   grid.appendChild(b);
 });
 renderScore();
 bindMobileHomeScroll();
 bindPortraitScoreFreeze();
 requestAnimationFrame(()=>{measurePortraitScore();syncPortraitScoreFreeze();syncMobileHomeChrome();});
}
function renderQuestion(day){renderQuestionInto("puzzleText",day)}
function resetPuzzle(){
 attemptsUsed=0;
 bonusAttemptActive=false;
 wrongPopupAwaitingAck=false;
 wrongPopupLockedValue="";
 $("answerInput").value="";$("answerInput").disabled=false;
 syncAnswerPlaceholder();
 $("feedback").textContent="";$("attempts").textContent="";
 $("giveUpBtn").classList.add("hidden");$("submitBtn").disabled=false;
 const popup=$("wrongAnswerPopover"); if(popup) popup.remove(); const backdrop=$("wrongAnswerBackdrop"); if(backdrop) backdrop.remove();
}
function openDay(n){
 const requested=DAYS.find(d=>d.day===n);
 if(!requested || !isVisible(requested)) return;
 const existing=getResult(requested.day);
 if(isFinalResult(existing)){openReview(requested,existing);return;}
 if(!isDateEligible(requested)) return;
 const required=nextRequiredDay();
 if(!(QA_DISABLE_SEQUENCE||QA_PREVIEW_MODE) && required && requested.day!==required.day){showSequencePopup(required,requested);return;}
 currentDay=requested;
 resetPuzzle();
 if(existing?.outcome==="in-progress"){
   attemptsUsed=Math.max(0,Math.min(MAX_TOTAL_ATTEMPTS,existing.attemptsUsed||0));
   bonusAttemptActive=!!existing.bonusAttempt;
   syncAnswerPlaceholder();
   if(attemptsUsed>=MAX_TOTAL_ATTEMPTS){completeSurrender(MAX_TOTAL_ATTEMPTS);return;}
   if(attemptsUsed>=MAX_ATTEMPTS && !bonusAttemptActive){openConfirmGiveUpGuarded();return;}
 }
 $("dayEyebrow").textContent=`EXIT ${currentDay.day} · ${currentDay.displayDate.toUpperCase()}`;
 renderQuestion(currentDay);
 show("puzzle");
 notifyExitOpened(currentDay);
}
function check(){
 if(wrongPopupAwaitingAck) return;
 const input=$("answerInput"), raw=(input.value||"").trim(), value=norm(raw);
 if(!value)return;
 if(currentDay.answers.includes(value)){
   const tries=attemptsUsed+1;
   saveResult(currentDay.day,{outcome:"solved",attempts:tries,completedAt:gameNowISO()});
   notifyAnswer(currentDay,tries,raw,"correct");
   notifySolved(currentDay,tries);
   input.value="";
   if(isLikelyPhone()) mobileSuccessGuardUntil=Date.now()+850;
   if(currentDay.day===FINAL_EXIT) openBirthdayFinale(); else openSurprise(true);
   return;
 }
 attemptsUsed++;
 saveInProgress(currentDay.day,attemptsUsed,bonusAttemptActive);
 notifyAnswer(currentDay,attemptsUsed,raw,"wrong");
 input.value="";
 if(bonusAttemptActive && attemptsUsed>=MAX_TOTAL_ATTEMPTS){
   input.disabled=true;
   $("submitBtn").disabled=true;
   completeSurrender(MAX_TOTAL_ATTEMPTS);
   return;
 }
 const remaining=MAX_ATTEMPTS-attemptsUsed;
 const wrongMessage=wrongMessageForAttempt(attemptsUsed);
 syncAnswerPlaceholder();
 $("feedback").textContent=isLikelyPhone()?"":wrongMessage;$("feedback").className="feedback bad";
 $("attempts").textContent=isLikelyPhone()?"":(remaining>0?`${remaining} attempt${remaining===1?"":"s"} remaining`:"Three attempts used.");
 if(remaining===0){
   $("submitBtn").disabled=true;
   if(isLikelyPhone()){$("giveUpBtn").classList.add("hidden");showWrongPopup(wrongMessage,0)}
   else{input.disabled=true;$("giveUpBtn").classList.remove("hidden")}
 }else if(!showWrongPopup(wrongMessage,remaining)) refocusAnswer(false);
}
const submitButton=$("submitBtn");
let suppressSubmitClickUntil=0;
submitButton.addEventListener("pointerdown",e=>{
  const input=$("answerInput");
  if(isLikelyPhone() && document.activeElement===input && e.pointerType!=="mouse"){
    // Prevent focus moving from the input to the button. We execute the submit
    // on pointerup instead so the soft keyboard remains continuously open.
    e.preventDefault();
    submitButton.dataset.keepFocusTap="1";
  }
});
submitButton.addEventListener("pointerup",e=>{
  if(submitButton.dataset.keepFocusTap==="1"){
    delete submitButton.dataset.keepFocusTap;
    e.preventDefault();
    suppressSubmitClickUntil=Date.now()+500;
    if(!submitButton.disabled) check();
  }
});
submitButton.onclick=()=>{
  if(Date.now()<suppressSubmitClickUntil) return;
  check();
};
$("answerInput").addEventListener("beforeinput",e=>{
 if(wrongPopupAwaitingAck){e.preventDefault();e.stopPropagation();}
});
$("answerInput").addEventListener("input",e=>{
 if(!wrongPopupAwaitingAck) return;
 // Some Android IMEs (including SwiftKey composition paths) can commit text
 // even when beforeinput was cancelled. Keep the focused field alive/keyboard
 // open, but make its value logically immutable until OK is acknowledged.
 if(e.currentTarget.value!==wrongPopupLockedValue){
   e.currentTarget.value=wrongPopupLockedValue;
   try{e.currentTarget.setSelectionRange(wrongPopupLockedValue.length,wrongPopupLockedValue.length)}catch{}
 }
});
$("answerInput").addEventListener("compositionend",e=>{
 if(wrongPopupAwaitingAck && e.currentTarget.value!==wrongPopupLockedValue){
   e.currentTarget.value=wrongPopupLockedValue;
 }
});
$("answerInput").addEventListener("paste",e=>{
 if(wrongPopupAwaitingAck){e.preventDefault();e.stopPropagation();}
});
$("answerInput").addEventListener("drop",e=>{
 if(wrongPopupAwaitingAck){e.preventDefault();e.stopPropagation();}
});
$("answerInput").addEventListener("keydown",e=>{
 if(wrongPopupAwaitingAck){e.preventDefault();e.stopPropagation();return;}
 if(e.key==="Enter"&&!$("submitBtn").disabled)check();
});
$("answerInput").addEventListener("focus",()=>{
  if(isLikelyPhone()){
    document.body.classList.add("answer-entry-active");
    setTimeout(keepAnswerVisible,180);setTimeout(keepAnswerVisible,420);
  }
});
$("answerInput").addEventListener("blur",()=>{
  setTimeout(()=>{
    if(document.activeElement!==$("answerInput")) document.body.classList.remove("answer-entry-active");
  },80);
});
if(window.visualViewport){
 window.visualViewport.addEventListener("resize",positionKeyboardUI,{passive:true});
 window.visualViewport.addEventListener("scroll",positionKeyboardUI,{passive:true});
}
window.addEventListener("resize",hidePhoneQr,{passive:true});
window.addEventListener("orientationchange",()=>setTimeout(hidePhoneQr,120),{passive:true});
hidePhoneQr();
$("scrollCue").onclick=()=>$("answerArea").scrollIntoView({behavior:"smooth",block:"start"});
function completeSurrender(attemptCount=MAX_ATTEMPTS){
 saveResult(currentDay.day,{outcome:"gave-up",attempts:attemptCount,completedAt:gameNowISO()});
 notifySurrender(currentDay);
 $("answerReveal").textContent=currentDay.answerDisplay;
 fitRevealAnswer(currentDay.answerDisplay);
 show("surrender");
}
$("giveUpBtn").onclick=()=>show("confirmGiveUp");
$("tryAgainBtn").onclick=e=>{
 if(Date.now()<confirmGiveUpReadyAt){e.preventDefault();e.stopPropagation();return;}
 grantBonusAttempt(currentDay.day);
 resetPuzzle();
 attemptsUsed=MAX_ATTEMPTS;
 bonusAttemptActive=true;
 syncAnswerPlaceholder();
 $("attempts").textContent=isLikelyPhone()?"":"BONUS 4TH ATTEMPT — LAST CHANCE";
 show("puzzle");
};
$("saveMeBtn").onclick=e=>{
 if(Date.now()<confirmGiveUpReadyAt){e.preventDefault();e.stopPropagation();return;}
 completeSurrender(MAX_ATTEMPTS);
};
function birthdayWishText(day=currentDay){
 const from=(day?.wishFrom||"").trim();
 return from?`A special birthday message from ${from} 🎉`:"A special birthday message for you 🎉";
}
function renderBirthdayWish(target,day=currentDay){
 const el=typeof target==="string"?$(target):target;
 if(!el) return;
 const from=(day?.wishFrom||"").trim();
 el.textContent="";
 if(!from){
   el.textContent="A special birthday message for you 🎉";
   return;
 }
 el.append(document.createTextNode("A special birthday message from "));
 const name=document.createElement("span");
 name.className="gift-from-name";
 name.textContent=from;
 el.append(name,document.createTextNode(" 🎉"));
}
function openSurprise(solved=true){
 $("solvedHeading").style.display=solved?"":"none";
 $("solvedSubheading").style.display=solved?"":"none";
 const options=[
   {heading:"OPEN TODAY'S SURPRISE",button:"GRAB YOUR GIFT"},
   {heading:"ENJOY TODAY'S GIFT",button:"REVEAL YOUR SURPRISE"}
 ];
 const pick=options[Math.floor(Math.random()*options.length)];
 $("giftHeading").textContent=pick.heading;
 renderBirthdayWish("giftFrom");
 const available=setVideoAvailability("video","watchBtn","qrImage");
 $("watchBtn").textContent=available?pick.button:"VIDEO COMING SOON";
 $("videoEyebrow").textContent=`EXIT ${currentDay.day} UNLOCKED`;
 show("video");
}

function stopBirthdayCelebration(){
 clearTimeout(celebrationCleanupTimer);
 celebrationCleanupTimer=0;
 celebrationRunId++;
 const layer=$("celebrationLayer");
 if(layer) layer.innerHTML="";
}
function launchBirthdayCelebration(screenId="finale"){
 const layer=$("celebrationLayer");
 if(!layer || !$(screenId)?.classList.contains("active")) return;

 clearTimeout(celebrationCleanupTimer);
 const runId=++celebrationRunId;
 if(layer.parentElement!==document.body) document.body.appendChild(layer);
 layer.innerHTML="";

 const reduced=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const phone=window.matchMedia && window.matchMedia("(max-width: 620px)").matches;
 layer.classList.toggle("reduced-motion",!!reduced);

 // Keep the celebration tied to the visible viewport, not the document height.
 // This makes mobile rendering independent of page scroll and hidden QR content.
 const vv=window.visualViewport;
 const viewportHeight=Math.max(320,Math.round(vv?.height||window.innerHeight||720));
 const viewportWidth=Math.max(280,Math.round(vv?.width||window.innerWidth||390));
 layer.style.width=`${viewportWidth}px`;
 layer.style.height=`${viewportHeight}px`;
 layer.style.setProperty("--balloon-origin-y",`${viewportHeight+8}px`);
 layer.style.setProperty("--celebration-fall",`${viewportHeight+90}px`);
 const riseDistance=viewportHeight+150;
 layer.style.setProperty("--celebration-rise-mid",`${Math.round(-riseDistance*.52)}px`);
 layer.style.setProperty("--celebration-rise-end",`${-riseDistance}px`);

 // Full but still lightweight on phones. Reduced-motion keeps the effect gentler.
 const confettiCount=reduced?28:(phone?88:112);
 const balloonCount=reduced?6:(phone?12:15);
 const confettiChars=["✦","◆","●","★","♥","✧"];
 const confettiColors=["#ff6680","#ffd166","#b8a8ff","#78c7ff","#ff9ed2","#8ee3c0"];

 for(let i=0;i<confettiCount;i++){
   const piece=document.createElement("span");
   piece.className="confetti-piece";
   piece.textContent=confettiChars[Math.floor(Math.random()*confettiChars.length)];
   piece.style.left=`${Math.random()*100}%`;
   piece.style.animationDelay=reduced?`${Math.random()*.7}s`:`${Math.random()*1.25}s`;
   piece.style.animationDuration=reduced?`${6.2+Math.random()*1.5}s`:`${3.6+Math.random()*2.2}s`;
   piece.style.fontSize=`${9+Math.random()*12}px`;
   piece.style.setProperty("--drift",`${-85+Math.random()*170}px`);
   piece.style.setProperty("--confetti-color",confettiColors[Math.floor(Math.random()*confettiColors.length)]);
   layer.appendChild(piece);
 }

 for(let i=0;i<balloonCount;i++){
   const balloon=document.createElement("span");
   balloon.className="birthday-balloon";
   balloon.textContent="🎈";
   balloon.style.left=`${3+Math.random()*94}%`;
   balloon.style.fontSize=`${phone?34+Math.random()*24:40+Math.random()*28}px`;
   balloon.style.animationDelay=reduced?`${.3+i*.32}s`:`${.15+i*.20}s`;
   balloon.style.animationDuration=reduced?`${8.4+Math.random()*1.4}s`:`${5.8+Math.random()*1.8}s`;
   layer.appendChild(balloon);
 }

 celebrationCleanupTimer=window.setTimeout(()=>{
   if(runId===celebrationRunId && layer) layer.innerHTML="";
 },reduced?11000:10000);
}
function openBirthdayFinale(){
 renderBirthdayWish("birthdayGiftFrom");
 const available=setVideoAvailability("finale","birthdaySurpriseBtn","birthdayQrImage");
 $("birthdaySurpriseBtn").textContent=available?"OPEN YOUR BIRTHDAY SURPRISE":"FINAL VIDEO COMING SOON";
 show("finale");
 // Two frames lets the finale layout settle before the fixed celebration layer starts.
 // If anything has navigated away in the meantime, do not launch over another screen.
 const finaleRun=celebrationRunId;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(finaleRun!==celebrationRunId || !$("finale")?.classList.contains("active")) return;
   launchBirthdayCelebration("finale");
 }));
}

$("surrenderSurpriseBtn").onclick=()=>currentDay.day===FINAL_EXIT?openBirthdayFinale():openSurprise(false);
function youtubeVideoId(url){
 try{
   const u=new URL(url);
   if(u.hostname==="youtu.be") return u.pathname.split("/").filter(Boolean)[0]||"";
   const parts=u.pathname.split("/").filter(Boolean);
   if(parts[0]==="shorts" || parts[0]==="embed") return parts[1]||"";
   return u.searchParams.get("v")||"";
 }catch{return ""}
}
function openYouTubePreferred(url){
 if(!url) return;
 const isAndroid=/Android/i.test(navigator.userAgent||"");
 if(isAndroid){
   const id=youtubeVideoId(url);
   const fallback=id?`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`:url;
   const target=id?`www.youtube.com/watch?v=${encodeURIComponent(id)}`:url.replace(/^https?:\/\//i,"");
   // Samsung Internet/Chrome: explicitly request the installed YouTube package.
   // Android handles the browser fallback if the app is unavailable or app-links are disabled.
   window.location.href=`intent://${target}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
   return;
 }
 window.open(url,"_blank","noopener,noreferrer");
}
$("watchBtn").onclick=()=>{if(hasVideo()) openYouTubePreferred(currentDay.video)};
$("birthdaySurpriseBtn").onclick=()=>{if(hasVideo()) openYouTubePreferred(currentDay.video)};
document.querySelectorAll("[data-home]").forEach(b=>b.onclick=e=>{
 if(wrongPopupAwaitingAck || (isLikelyPhone() && (Date.now()<mobileSuccessGuardUntil || Date.now()<mobileWrongAckGuardUntil))){
   e.preventDefault();e.stopPropagation();return;
 }
 renderGrid();show("home");
});
// Capture the delayed click generated by the same mobile tap that submitted a
// correct answer. This guard exists only for the short success-transition window.
document.addEventListener("click",e=>{
 if(isLikelyPhone() && (Date.now()<mobileSuccessGuardUntil || Date.now()<mobileWrongAckGuardUntil)){
   e.preventDefault();e.stopImmediatePropagation();
 }
},true);
// Samsung Internet and several Android keyboards can finish a pointer sequence
// after the popup DOM has already been hidden. Swallow that tail while the
// acknowledgement shield is armed so it cannot activate HOME or SUBMIT.
["pointerdown","pointerup","touchend"].forEach(type=>{
 document.addEventListener(type,e=>{
   if(isLikelyPhone() && Date.now()<mobileWrongAckGuardUntil){
     e.preventDefault();e.stopImmediatePropagation();
   }
 },{capture:true,passive:false});
});
function playHonkSound(){
 return new Promise(resolve=>{
   try{
     const audio=new Audio("car-horn.mp3");
     audio.preload="auto";
     audio.volume=1;
     let settled=false;
     const finish=()=>{if(settled)return;settled=true;resolve()};
     audio.addEventListener("ended",finish,{once:true});
     audio.addEventListener("error",finish,{once:true});
     const p=audio.play();
     if(p&&typeof p.catch==="function") p.catch(finish);
     setTimeout(finish,1450);
   }catch{resolve()}
 });
}
function enterRoute4T(){
 const button=$("enterRouteMobile");
 if(button?.dataset.busy==="1") return;
 if(button){
   button.dataset.busy="1";
   button.setAttribute("aria-busy","true");
   button.classList.remove("honked");
   // Force a restartable visual press animation without invoking Samsung's disabled-button skin.
   void button.offsetWidth;
   button.classList.add("honked");
   setTimeout(()=>button?.classList.remove("honked"),360);
 }
 const p=playHonkSound();
 const timeCheck=syncTrustedTime();
 // Keep the sign visible long enough to hear the uploaded double honk. The time
 // check runs in parallel; if it fails, rendering safely uses only the last verified time.
 Promise.allSettled([p,timeCheck]).finally(()=>{
   renderGrid();
   show("home");
   if(button){
     delete button.dataset.busy;
     button.removeAttribute("aria-busy");
     button.classList.remove("honked");
   }
 });
}
const enterRouteMobile=$("enterRouteMobile");
if(enterRouteMobile) enterRouteMobile.onclick=enterRoute4T;

document.body.classList.add("welcome-active");
show("welcome");

// Start trusted-time verification immediately so it normally finishes before HONK.
syncTrustedTime().catch(()=>{});
flushEmailQueue().catch(()=>{});
window.addEventListener("online",()=>{
 syncTrustedTime().then(()=>{if(document.body.classList.contains("home-active")) renderGrid()}).catch(()=>{});
 flushEmailQueue().catch(()=>{});
});
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState!=="visible") return;
 syncTrustedTime().then(()=>{if(document.body.classList.contains("home-active")) renderGrid()}).catch(()=>{});
});

// Ask the browser not to evict Route 4T progress under storage pressure.
if(navigator.storage?.persist) navigator.storage.persist().catch(()=>{});

if("serviceWorker" in navigator){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js?v=302").catch(()=>{}));
}

function syncDesktopFrame(){
 if(window.innerWidth<=620)return;
 const score=document.querySelector("#home .score-card");
 if(!score)return;
 const top=parseFloat(getComputedStyle(score).top)||10;
 document.documentElement.style.setProperty("--score-frame-bottom",(top+score.offsetHeight)+"px");
}
window.addEventListener("resize",syncDesktopFrame,{passive:true});
requestAnimationFrame(syncDesktopFrame);


function syncMobileStickyFrame(){
  if(window.innerWidth>620) return;
  const score=document.querySelector("#home .score-card");
  if(!score) return;
  const safeTop=8;
  const bottom=safeTop+score.offsetHeight;
  document.documentElement.style.setProperty("--mobile-score-bottom", bottom+"px");
}
window.addEventListener("resize",syncMobileStickyFrame,{passive:true});
window.addEventListener("orientationchange",()=>setTimeout(syncMobileStickyFrame,150),{passive:true});
requestAnimationFrame(syncMobileStickyFrame);
setTimeout(syncMobileStickyFrame,250);
