export const decode = s => { try { return decodeURIComponent(s); } catch { return s; } };
export const guid = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || '');
export function analyze(input) {
 const result={input,fields:[],urls:[],warnings:[]}, seen=new Set();
 const add=(section,key,value,source='url')=>{if(value!==undefined&&value!==null&&value!==''&&!result.fields.some(f=>f.key===key&&f.value===String(value)))result.fields.push({section,key,value:String(value),source,status:source==='graph'?'confirmed':'unverified'});};
 function visit(raw,depth=0){
  if(depth>5||seen.size>=24){result.warnings.push('depth');return;} if(seen.has(raw))return; seen.add(raw);
  let u;try{u=new URL(raw);}catch{return;} if(!['https:','http:'].includes(u.protocol))return;
  result.urls.push(u.href); const h=u.hostname.toLowerCase(),p=decode(u.pathname),q=u.searchParams;
  add('basic','Scheme',u.protocol);add('basic','Hostname',h);add('basic','Path',p);add('basic','Fragment',u.hash);
  for(const [k,v]of q){add('basic',`Query: ${k}`,v);if(/^https?:\/\//i.test(v))visit(v,depth+1);else if(/^https?%3a/i.test(v))visit(decode(v),depth+1);if(k==='context'){try{const c=JSON.parse(v);add('teams','Tenant ID',c.tid);add('teams','Group ID',guid(c.groupId)?c.groupId:undefined);}catch{}}}
  for(const [k,label]of Object.entries({teamId:'URL Team identifier',groupId:'Group ID',tenantId:'Tenant ID',channelId:'Channel ID',chatId:'Chat ID',messageId:'Message ID',meetingId:'Meeting ID',siteId:'Site ID',webId:'Web ID',listId:'List ID',driveId:'Drive ID',itemId:'DriveItem ID'}))add(['siteId','webId','listId','driveId','itemId'].includes(k)?'files':'teams',label,q.get(k));
  const teams=['teams.microsoft.com','teams.cloud.microsoft'].includes(h);
  if(teams){add('basic','Service','Microsoft Teams');const m=p.match(/\/l\/(team|channel|message|chat|meetup-join)\/([^/]+)(?:\/([^/]+))?/);if(m){const kind=m[1],id=m[2];add('teams',kind==='team'?'URL Team identifier':kind==='chat'?'Chat ID':kind==='meetup-join'?'Meeting Thread ID':'Channel ID',id);if(kind==='message')add('teams','Message ID',m[3]);if(kind==='channel')add('teams','Channel Name',m[3]);}for(const [k,label]of Object.entries({groupId:'Group ID',tenantId:'Tenant ID',teamName:'Team Name',channelId:'Channel ID',chatId:'Chat ID',messageId:'Message ID',meetingId:'Meeting ID'}))add('teams',label,q.get(k));}
  const sp=/(^|\.)sharepoint\.com$/.test(h),personal=['1drv.ms','onedrive.live.com'].includes(h);
  if(sp||personal){add('basic','Service',sp?(h.includes('-my.')?'OneDrive for Business':'SharePoint Online'):'OneDrive Personal');add('files','Tenant Hostname',h);add('files','Sharing URL',u.href);
   const site=p.replace(/^\/:[a-z]:\/r(?=\/)/i,'').match(/^\/(?:sites|teams|personal)\/[^/]+/);const sitePath=site?.[0]||(!personal?'/':null);if(sitePath){add('files','Site Path',sitePath);add('files','Site URL',u.origin+(sitePath==='/'?'':sitePath));add('files','Site Name',sitePath.split('/').pop());}
   let path=q.get('id')||q.get('RootFolder'); // URLSearchParams has already decoded once.
   if(!path&&!/^\/:/.test(p)&&!p.includes('/_layouts/')&&!/\/Forms\/AllItems\.aspx$/i.test(p)&&!personal)path=p;
   if(/^\/:[a-z]:\/r\//i.test(p))path=p.replace(/^\/:[a-z]:\/r/i,'');
   if(path?.startsWith('/')){add('paths','Server Relative Path',path);const full=new URL(u.origin);full.pathname=path.split('/').map(encodeURIComponent).join('/');add('paths','Full File URL',full.href);if(sitePath&&(sitePath==='/'||path.startsWith(sitePath+'/'))){const rel=path.slice(sitePath==='/'?0:sitePath.length);add('paths','Site Relative Path',rel);const parts=rel.replace(/^\//,'').split('/');if(parts.length>1&&!['_layouts','SitePages','Lists'].includes(parts[0])){add('files','Library URL segment',parts[0]);add('paths','Library Relative Path','/'+parts.slice(1).join('/'));} }const name=path.split('/').pop();add('files','Path leaf (file or folder)',name);if(name?.includes('.'))add('files','File Extension',name.split('.').pop());add('paths','Parent Folder',path.slice(0,path.lastIndexOf('/')));}
   for(const [k,label]of Object.entries({sourcedoc:'ListItem Unique ID',list:'List ID',listId:'List ID',driveId:'Drive ID',itemId:'DriveItem ID',resid:'Personal Resource ID',cid:'Personal CID'}))add('files',label,q.get(k));
  }else if(!teams){const service=/(office|microsoft|live)\.com$/.test(h)?'Microsoft 365':'Unknown';add('basic','Service',service);}
 }
 if(input.length>32768)throw new Error('length');let u;try{u=new URL(input.trim());}catch{throw new Error('url');}if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error('url');visit(u.href);return result;
}
export function shareToken(url){const bytes=new TextEncoder().encode(url);return 'u!'+btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
