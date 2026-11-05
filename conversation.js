fetch('conversation-data.json').then(r=>{if(!r.ok)throw Error('载入失败');return r.json()}).then(D=>{
 const $=s=>document.querySelector(s),messages=$('#messages');
 function textWithLinks(node,text){
  // 只创建HTTP(S)链接；所有原始发言使用文本节点，避免执行对话中的HTML或代码。
  const re=/https?:\/\/[^\s<>\[\]()]+/g;let start=0;
  for(const m of text.matchAll(re)){node.append(document.createTextNode(text.slice(start,m.index)));const a=document.createElement('a');a.textContent=m[0];a.href=m[0];a.target='_blank';a.rel='noopener noreferrer';node.append(a);start=m.index+m[0].length;}
  node.append(document.createTextNode(text.slice(start)));
 }
 function render(){
  const q=$('#search').value.trim().toLocaleLowerCase(),role=$('#role').value;
  const rows=D.messages.filter(m=>(role==='all'||m.role===role)&&(!q||m.text.toLocaleLowerCase().includes(q)));
  messages.replaceChildren();for(const m of rows){
   const box=document.createElement('article');box.className='message '+m.role;box.id='msg-'+m.index;
   const meta=document.createElement('div');meta.className='meta';const name=document.createElement('strong');name.textContent=m.role==='user'?'用户':'助手';meta.append(name);
   const time=document.createElement('span');time.textContent=m.at?new Date(m.at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'';meta.append(time);
   const anchor=document.createElement('a');anchor.href='#msg-'+m.index;anchor.textContent='#'+m.index;meta.append(anchor);
   const body=document.createElement('div');body.className='text';textWithLinks(body,m.text);box.append(meta,body);messages.append(box);
  }
  $('#count').textContent=`显示${rows.length} / ${D.messages.length}条 · 用户${D.user_messages} · 助手${D.assistant_messages}`;$('#empty').hidden=rows.length>0;
 }
 $('#search').addEventListener('input',render);$('#role').addEventListener('change',render);
 $('#exported').textContent='整理时间：'+new Date(D.exported_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});render();
 if(location.hash){requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView());}
}).catch(e=>{document.querySelector('#count').textContent='暂时无法加载对话：'+e.message});
