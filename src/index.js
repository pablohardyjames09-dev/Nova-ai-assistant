
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NOVA AI - Your AI Assistant</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#0b1020;color:#f5f5f5;font-family:Arial,sans-serif}
header{padding:22px;text-align:center;background:#121a30;border-bottom:1px solid #263451}
.logo{font-size:28px;font-weight:bold;color:#9c8cff}
header p{color:#aab5ce;font-size:13px}
main{max-width:750px;margin:auto;padding:20px}
.hero{text-align:center;padding:25px 5px}
.hero h1{font-size:32px;margin-bottom:8px}
.hero p{color:#aab5ce}
.tools{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:20px 0}
.tool{background:#151e35;border:1px solid #293858;padding:14px;border-radius:12px;color:white;cursor:pointer}
.tool:active{background:#293858}
#chat{background:#111a2e;border:1px solid #293858;border-radius:14px;padding:15px;min-height:230px}
.message{padding:12px;margin:10px 0;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere}
.user{background:#34305d;margin-left:25px}
.bot{background:#1b2941;margin-right:25px}
form{display:flex;gap:8px;margin-top:12px}
input{min-width:0;flex:1;padding:15px;border-radius:10px;border:1px solid #394969;background:#151e35;color:white;font-size:16px}
button{padding:13px 17px;background:#7964ed;color:white;border:0;border-radius:10px;font-weight:bold}
button:disabled{opacity:.5}
footer{text-align:center;color:#8190ad;font-size:12px;padding:25px}
</style>
</head>
<body>
<header>
<div class="logo">✦ NOVA AI</div>
<p>Your all-in-one AI assistant</p>
</header>
<main>
<section class="hero">
<h1>What can I help you with?</h1>
<p>Ask questions, learn, write and create with AI.</p>
</section>
<div class="tools">
<button class="tool" data-prompt="Give me 5 creative business ideas I can start with little money.">💼 Business ideas</button>
<button class="tool" data-prompt="Help me write a professional social media caption.">✍️ Writing assistant</button>
<button class="tool" data-prompt="Explain this topic in simple words and give me examples: ">📚 Study helper</button>
<button class="tool" data-prompt="Give me creative social media content ideas.">📱 Content ideas</button>
<button class="tool" data-prompt="Help me understand and write code for: ">💻 Coding helper</button>
<button class="tool" data-prompt="Create a simple marketing plan for: ">📈 Marketing</button>
</div>
<div id="chat" aria-live="polite">
<div class="message bot">Hello! I'm NOVA AI. What would you like help with today?</div>
</div>
<form id="form">
<input id="prompt" placeholder="Ask NOVA anything..." autocomplete="off" required>
<button id="send">Send</button>
</form>
</main>
<footer>Powered by AI · NOVA AI</footer>
<script>
const chat=document.getElementById('chat');
const input=document.getElementById('prompt');
const form=document.getElementById('form');
const send=document.getElementById('send');
let messages=[];
function show(text,who){
 const div=document.createElement('div');
 div.className='message '+who;
 div.textContent=text;
 chat.appendChild(div);
 chat.scrollTop=chat.scrollHeight;
}
async function ask(text){
 if(!text.trim())return;
 show(text,'user');
 messages.push({role:'user',parts:[{text}]});
 input.value='';
 send.disabled=true;
 show('Thinking...','bot');
 const loading=chat.lastElementChild;
 try{
  const response=await fetch('/api/chat',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({messages})
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'Request failed');
  const answer=data.reply||'I could not generate an answer.';
  loading.textContent=answer;
  messages.push({role:'model',parts:[{text:answer}]});
 }catch(error){
  loading.textContent='Sorry, something went wrong: '+error.message;
  messages.pop();
 }
 send.disabled=false;
 input.focus();
}
form.addEventListener('submit',e=>{
 e.preventDefault();
 ask(input.value);
});
document.querySelectorAll('.tool').forEach(button=>{
 button.addEventListener('click',()=>{
  input.value=button.dataset.prompt;
  input.focus();
 });
});
</script>
</body>
</html>`;

export default {
 async fetch(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/chat" && request.method === "POST") {
   try {
    if (!env.GEMINI_API_KEY) {
     return Response.json({error:"AI key is not configured yet."},{status:500});
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length) {
     return Response.json({error:"Please enter a message."},{status:400});
    }

    const result = await fetch(
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
     encodeURIComponent(env.GEMINI_API_KEY),
     {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
       systemInstruction:{
        parts:[{text:"You are NOVA AI, a friendly and helpful all-in-one assistant. Give clear, useful answers in simple language."}]
       },
       contents:messages
      })
     }
    );

    const data = await result.json();

    if (!result.ok) {
     return Response.json({error:data.error?.message || "AI service error"},{status:502});
    }

    const reply=data.candidates?.[0]?.content?.parts
      ?.map(part=>part.text || "").join("") || "No answer returned.";

    return Response.json({reply});
   } catch(error) {
    return Response.json({error:"Could not process your request."},{status:500});
   }
  }

  if (url.pathname === "/api/chat") {
   return new Response("Method not allowed",{status:405});
  }

  return new Response(HTML,{
   headers:{"Content-Type":"text/html;charset=UTF-8"}
  });
 }
};
