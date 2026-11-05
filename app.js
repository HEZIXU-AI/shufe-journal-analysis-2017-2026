/* 仅展示实际采集数据，不在浏览器端访问知网。 */
fetch('topic_analysis.json').then(r=>r.ok?r.json():null).then(T=>{
 if(!T)return;const panel=document.createElement('div');panel.className='panel';
 const heading=document.createElement('h3');heading.textContent='关键词的探索性聚类';panel.append(heading);
 const method=document.createElement('p');method.className='caption';method.textContent=`${T.eligible_papers}篇研究论文中，${T.clustered_papers}篇包含保留的高频关键词并进入聚类；${T.excluded_no_retained_keyword}篇未强行归类。采用TF-IDF与球面K均值，比较3—8类后选择${T.chosen_k}类，余弦轮廓系数为${T.silhouette_cosine.toFixed(3)}。聚类名称取中心关键词，仅作探索性描述。`;panel.append(method);
 const grid=document.createElement('div');grid.className='two';
 for(const group of T.groups){const card=document.createElement('div');card.className='prose';const h=document.createElement('h4');h.textContent=`${group.label} · ${group.documents}篇`;card.append(h);
 const keywords=document.createElement('p');keywords.className='caption';keywords.textContent=group.keywords.map(k=>k.term).join('、');card.append(keywords);
 const ul=document.createElement('ul');for(const paper of group.representative_papers.slice(0,3)){const li=document.createElement('li'),a=document.createElement('a');a.href=paper.source_url;a.target='_blank';a.rel='noopener';a.textContent=`${paper.year} · ${paper.title}`;li.append(a);ul.append(li);}card.append(ul);grid.append(card);}
 panel.append(grid);const link=document.createElement('a');link.href='topic_analysis.json';link.download='topic_analysis.json';link.textContent='下载聚类方法、参数比较和逐篇分组';panel.append(link);document.querySelector('#themes').append(panel);
}).catch(()=>{});
fetch('official_bulk_metadata.json').then(r=>r.ok?r.json():null).then(data=>{
 if(!data)return;const box=document.createElement('div');box.className='notice';
 const text=document.createElement('p');text.textContent=`另存知网官方批量基础题录${data.unique_metadata_records}条，包含594条论文候选和19条导读/主持人语；不等于逐篇访问了相同数量的详情页。`;
 box.append(text);const link=document.createElement('a');link.href='official_bulk_metadata.json';link.download='official_bulk_metadata.json';link.textContent='下载单独保存的官方基础题录（JSON）';box.append(link);
 document.querySelector('.downloads').after(box);
}).catch(()=>{});
fetch('report-data.json').then(r=>{if(!r.ok)throw Error('数据文件暂不可用');return r.json()}).then(start).catch(e=>{document.querySelector('#run-status').textContent='报告数据尚未准备完成：'+e.message});
function start(D){
 const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const n=v=>v==null?'—':Number(v).toLocaleString('zh-CN');
 const docs=D.documents,fmt=x=>x?new Date(x).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未记录';
 if(D.source_coverage){
  const p=document.createElement('p');p.className='body-note';p.textContent=`数据来源核对：保存${D.source_coverage.official_metadata_records}条知网官方批量题录及列表统计，保留${D.source_coverage.detail_snapshots_preserved}篇实际详情快照。已有详情优先；其余被引数采用列表明确数字。62篇可比数值全部一致；列表空白仍按缺失处理。官网没有可验证参考文献表时，不把脚注数量或知网节点数代替完整参考文献总量。`;
  document.querySelector('#method .section-top').after(p);
 }
 {
  const research=docs.filter(r=>r.kind==='paper');const frequency=new Map;
  research.forEach(r=>[...new Set(r.keywords||[])].forEach(k=>frequency.set(k,(frequency.get(k)||0)+1)));
  const words=[...frequency].sort((a,b)=>b[1]-a[1]).slice(0,4);
  const cited=docs.map(r=>r.cited_by_count).filter(v=>typeof v==='number').sort((a,b)=>a-b);
  const sum=cited.reduce((s,v)=>s+v,0),mean=sum/Math.max(1,cited.length),median=cited.length?(cited[Math.floor((cited.length-1)/2)]+cited[Math.ceil((cited.length-1)/2)])/2:0;
  const topShare=sum?cited.slice(-10).reduce((s,v)=>s+v,0)/sum*100:0;
  const refs=docs.map(r=>r.reference_count).filter(v=>typeof v==='number');
  const section=document.createElement('section');section.id='findings';const heading=document.createElement('h2');heading.textContent='数据中的主要发现';section.append(heading);
  const list=document.createElement('ol');list.className='prose';
  const findings=[`研究主题：${research.length}篇研究论文中，高频关键词为${words.map(([k,v])=>`${k}（${v}篇）`).join('、')}。词频表示出现范围，不代表研究质量。`,
  `传播分布：${cited.length}篇取得明确被引数，均值${mean.toFixed(1)}、中位数${median}；被引最高的10篇合计占有效记录总被引的${topShare.toFixed(1)}%。另有${docs.length-cited.length}篇未取得明确数值，保留为空。`,
  `参考文献：目前已核对${refs.length}篇完整参考文献表，${docs.length-refs.length}篇尚未取得可靠总数。统计排除缺失值；知网节点计数另存，未混入完整参考文献总数。`];
  findings.forEach(value=>{const li=document.createElement('li');li.textContent=value;list.append(li)});section.append(list);$('#metrics').after(section);
 }
 if(D.reference_coverage_audits?.length){
  const note=document.createElement('p');note.className='body-note';
  note.textContent='提交和分析采用论文完整参考文献表总数，允许期刊官网补核；知网节点数单独保存。已发现2017年样本的知网节点为18，而期刊官网参考文献表为29条；两个来源分别保留，不互相覆盖。';
  const a=document.createElement('a');a.href=D.reference_coverage_audits[0].source_url;a.textContent=' 查看官网核查来源';a.target='_blank';a.rel='noopener';note.append(a);$('#impact .section-top').after(note);
 }
 const state=$('#run-status');state.textContent=D.complete?`范围与来源核查结束，共${docs.length}条论文候选；${D.completion_audit.cited_gaps}条被引数、${D.completion_audit.reference_gaps}条完整参考文献数尚未可靠取得，CSV保留空白。2026年仅覆盖实际目录快照已公开内容。`:`采集尚未完成：已保存${D.issues_saved}/${D.issues_total}期目录、${docs.length}篇基础记录。当前页面为进度与核对稿，不能当作全量分析结论。`;state.classList.toggle('complete',D.complete);
 $('#capture-date').textContent=`目录核查：${D.directory_date||'进行中'} · 导出：${fmt(D.exported_at)}`;$('#footer-date').textContent=fmt(D.exported_at);
 $('#metrics').innerHTML=[['分析记录',docs.length],['已核查正式期次',D.issues_saved],['原始目录条目',D.entries.length],['目录及导读条目',D.entries.filter(e=>e.kind!=='paper').length]].map(([label,value])=>`<div class="metric"><strong>${n(value)}</strong><span>${label}</span></div>`).join('');
 const years=Array.from({length:10},(_,i)=>2017+i);
 const options='<option value="all">全部年份</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join('');$('#theme-year').innerHTML=options;$('#paper-year').innerHTML=options;$('#scatter-year').innerHTML=options;
 const annual=years.map(year=>({year,candidate:D.entries.filter(e=>e.year===year&&e.kind==='paper').length,saved:docs.filter(r=>r.year===year&&r.kind!=='nonpaper').length}));
 const max=Math.max(1,...annual.map(r=>Math.max(r.candidate,r.saved)));
 $('#annual-chart').innerHTML=annual.map(r=>`<div class="year-col"><div class="year-bar" style="height:${Math.max(r.candidate,r.saved)/max*190}px" title="${r.year}：候选${r.candidate}，详情${r.saved}"><span class="bar-value">${r.candidate||r.saved}</span><div class="saved-bar" style="height:${r.saved/Math.max(1,r.candidate,r.saved)*100}%"></div></div><span class="year-label">${r.year}${r.year===2026?'*':''}</span></div>`).join('');
 const y26=D.issues.filter(i=>i.year===2026&&i.status==='complete').map(i=>i.issue).sort();
 $('#coverage-note').textContent=`2026年实际已核查期次：${y26.length?y26.join('、'):'尚未完成'}。网络首发另行核查，不推定未来期次已经出版。${D.cutoff_note}`;
 const list=v=>Array.isArray(v)?v:typeof v==='string'?v.split(/[;；]/).filter(Boolean):[];
 const keywords=r=>[...new Set(list(r.keywords).map(k=>k.trim()).filter(Boolean))];
 const aggregate=(rows,key,clean=x=>x)=>{const m=new Map;rows.forEach(r=>[...new Set(list(r[key]).map(clean).filter(Boolean))].forEach(x=>m.set(x,(m.get(x)||0)+1)));return [...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'zh-CN'))};
 function bars(target,items,take=12){const a=items.slice(0,take),max=Math.max(1,...a.map(x=>x[1]));$(target).innerHTML=a.length?a.map(([label,value])=>`<div class="bar-row"><span class="bar-name" title="${esc(label)}">${esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${value/max*100}%"></div></div><span class="bar-number">${value}</span></div>`).join(''):'<p class="empty">尚无可分析的已采字段</p>'}
 function themes(){const year=$('#theme-year').value;const rows=docs.filter(r=>(year==='all'||String(r.year)===year)&&r.kind!=='nonpaper');bars('#keyword-chart',aggregate(rows,'keywords'));const pairs=new Map;rows.forEach(r=>{const k=keywords(r).sort();for(let i=0;i<k.length;i++)for(let j=i+1;j<k.length;j++){const s=k[i]+' × '+k[j];pairs.set(s,(pairs.get(s)||0)+1)}});$('#cooccur').innerHTML=[...pairs].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([pair,count])=>`<div class="pair"><span>${esc(pair)}</span><strong>${count}篇</strong></div>`).join('')||'<p class="empty">尚无共现数据</p>'}
 themes();$('#theme-year').onchange=themes;
 bars('#author-chart',aggregate(docs,'authors',x=>x.replace(/[\d,，\s]+$/,'').trim()),10);bars('#institution-chart',aggregate(docs,'affiliations',x=>x.replace(/^\d+[.、]\s*/,'').trim()),10);
 const vals=k=>docs.map(r=>r[k]).filter(v=>typeof v==='number'&&Number.isFinite(v)).sort((a,b)=>a-b);
 function stats(k){const a=vals(k);if(!a.length)return {n:0};const med=a.length%2?a[Math.floor(a.length/2)]:(a[a.length/2-1]+a[a.length/2])/2;return {n:a.length,mean:a.reduce((s,v)=>s+v,0)/a.length,median:med,max:a.at(-1)}}
 const distribution=[['被引用量','cited_by_count'],['参考文献总量','reference_count'],['被下载量','download_count']].map(([label,key])=>{const s=stats(key);return `<tr><td>${label}</td><td>${s.n}</td><td>${s.n?s.mean.toFixed(1):'—'}</td><td>${s.n?s.median:'—'}</td><td>${s.n?s.max:'—'}</td></tr>`}).join('');$('#distribution').innerHTML=`<div class="table-scroll"><table><thead><tr><th>指标</th><th>有效篇数</th><th>均值</th><th>中位数</th><th>最大值</th></tr></thead><tbody>${distribution}</tbody></table></div>`;
 $('#correlation').textContent=D.correlation?`被引量与参考文献总量的Spearman秩相关为${D.correlation.rho.toFixed(3)}，基于两项均有效的${D.correlation.n}篇。该描述未控制发表年份，不能解释为因果关系。`:'有效配对数不足20篇，暂不展示总体相关系数。';
 function scatter(){const year=$('#scatter-year').value,log=$('#log-scale').checked;const rows=docs.filter(r=>r.reference_count!=null&&r.cited_by_count!=null&&(year==='all'||String(r.year)===year));const xmax=Math.max(1,...rows.map(r=>r.reference_count)),ymax=Math.max(1,...rows.map(r=>r.cited_by_count));const trans=v=>log?Math.log10(1+v):v;const w=1040,h=360,p={l:68,r:25,t:22,b:52};const x=v=>p.l+v/xmax*(w-p.l-p.r),y=v=>h-p.b-trans(v)/trans(ymax)*(h-p.t-p.b);let svg=`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto" role="img" aria-label="${rows.length}篇论文的参考文献量与被引量"><rect width="${w}" height="${h}" fill="white"/>`;for(let i=0;i<=5;i++){const xv=xmax*i/5,yv=log?10**(trans(ymax)*i/5)-1:ymax*i/5;svg+=`<path d="M ${p.l} ${y(yv)} H ${w-p.r}" stroke="#e5ecef"/><text x="${p.l-10}" y="${y(yv)+4}" text-anchor="end" font-size="11" fill="#637889">${Math.round(yv)}</text><text x="${x(xv)}" y="${h-p.b+22}" text-anchor="middle" font-size="11" fill="#637889">${Math.round(xv)}</text>`}svg+=rows.map(r=>`<circle cx="${x(r.reference_count)}" cy="${y(r.cited_by_count)}" r="4" fill="#138077" fill-opacity=".45"><title>${esc(r.title)}｜${r.year}｜参考文献${r.reference_count}｜被引${r.cited_by_count}</title></circle>`).join('');svg+=`<text x="${w/2}" y="${h-5}" text-anchor="middle" fill="#637889" font-size="12">引用的参考文献总量（篇）</text><text x="15" y="15" fill="#637889" font-size="12">被引用量${log?'（log10(1+x)刻度）':''}</text></svg>`;$('#scatter').innerHTML=svg;$('#scatter-note').textContent=`有效配对${rows.length}篇。缺失任一数值的记录不进入散点图，明确的0仍保留。可以按年份查看，减少不同发表时长对直观比较的影响。`;}
 scatter();$('#scatter-year').onchange=scatter;$('#log-scale').onchange=scatter;
 const fundShown=docs.filter(r=>r.fund&&String(r.fund).trim()).length;$('#fund-summary').innerHTML=`<div class="metric"><strong>${fundShown} <small>/ ${docs.length}</small></strong><span>页面显示基金信息的已采论文</span></div><p>其余${docs.length-fundShown}篇：页面未显示或尚未取得，具体状态见完整数据。</p>`;
 const row=r=>`<tr><td><a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.title)}</a><small>${esc(list(r.authors).join('；'))}</small>${r.citation_difference?'<small class="badge">被引统计与节点读数不同，采用上方指标</small>':''}</td><td>${n(r.year)}</td><td>${n(r.cited_by_count)}</td><td>${n(r.reference_count)}</td><td>${n(r.download_count)}</td></tr>`;
 $('#top-cited').innerHTML=docs.filter(r=>r.cited_by_count!=null).sort((a,b)=>b.cited_by_count-a.cited_by_count).slice(0,10).map(row).join('');
 let page=0;const pageSize=15;
 function table(){const q=$('#search').value.trim().toLowerCase(),year=$('#paper-year').value;const filtered=docs.filter(r=>(year==='all'||String(r.year)===year)&&[r.title,...list(r.authors),...list(r.affiliations)].join(' ').toLowerCase().includes(q));page=Math.min(page,Math.max(0,Math.ceil(filtered.length/pageSize)-1));$('#paper-table').innerHTML=filtered.slice(page*pageSize,(page+1)*pageSize).map(row).join('')||'<tr><td colspan="5">没有匹配记录</td></tr>';$('#result-count').textContent=`${filtered.length}篇`;$('#page-number').textContent=`${page+1} / ${Math.max(1,Math.ceil(filtered.length/pageSize))}`;$('#previous').disabled=page===0;$('#next').disabled=(page+1)*pageSize>=filtered.length;}
 $('#search').oninput=()=>{page=0;table()};$('#paper-year').onchange=()=>{page=0;table()};$('#previous').onclick=()=>{page--;table()};$('#next').onclick=()=>{page++;table()};table();
 $('#field-completeness').innerHTML=[['标题','title'],['作者','authors'],['作者单位','affiliations'],['摘要','abstract'],['关键词','keywords'],['被引用量','cited_by_count'],['参考文献总量','reference_count'],['被下载量','download_count']].map(([label,k])=>{const count=docs.filter(r=>r[k]!=null&&(!Array.isArray(r[k])||r[k].length)&&r[k]!=='').length;return `<div class="field-row"><span>${label}</span><strong>${count} / ${docs.length}</strong></div>`}).join('');
 const conflicts=docs.filter(r=>r.citation_difference);$('#conflict-note').innerHTML=`<p class="caption">${conflicts.length}篇的两处读数存在差异。统一优先采用上方被引统计，原始读数完整保留。</p>`+conflicts.slice(0,6).map(r=>`<div class="pair"><span>${esc(r.title)}</span><strong>${r.cited_by_header_count} / ${r.citation_network_count}</strong></div>`).join('');
 const special=D.entries.filter(e=>e.kind!=='paper');$('#nonpaper-list').innerHTML=special.length?`<div class="table-scroll"><table><thead><tr><th>标题</th><th>年期</th><th>处理</th></tr></thead><tbody>${special.map(e=>`<tr><td><a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a></td><td>${e.year??'首发'}-${esc(e.issue)}</td><td>${esc(e.note)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">已采目录中尚未发现此类条目，不能据此断言全部范围内不存在。</p>';
 $('#issue-audit').innerHTML='<div class="audit">'+years.map(year=>`<div class="audit-year"><b>${year}</b>${D.issues.filter(i=>i.year===year).map(i=>`<span>${esc(i.issue)}期：${i.status==='complete'?i.entry_count+'条':'待采'}</span>`).join('')}</div>`).join('')+'</div>';
 $('#csv-download').href=D.submission_file;$('#csv-download').textContent=D.complete?'下载三列提交CSV':'下载部分三列CSV（未完成）';$('#analysis-download').href='analysis-data.json';
 const gaps=document.createElement('p');gaps.className='body-note';gaps.innerHTML='完整参考文献数缺失的记录可能集中在采用脚注的论文，完整配对分析存在选择偏差，不能推广到所有论文。<a href="unresolved-reference-counts.json" download>下载逐篇缺失原因与来源</a> · <a href="statistics-source-audit.json" download>下载被引统计交叉核对记录</a> · <a href="final-validation.json" download>下载最终文件校验结果</a>';
 $('#method .downloads').before(gaps);
 window.reportData=D;window.dispatchEvent(new CustomEvent('report-ready',{detail:D}));
}
