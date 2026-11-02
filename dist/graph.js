import {shareToken,guid,decode} from './parser.js';
function operation(url){const p=url.pathname;return p.includes('/shares/')?'shared-item':p.endsWith('/root')?'drive-root':/\/drives\/[^/]+$/.test(p)?'drive-info':p.includes('/drives/')?'drive-item':p.endsWith('/drives')?'site-drives':p.includes('/sites/')?'site-info':p.includes('/channels/')?'channel-info':p.includes('/teams/')?'team-info':'graph';}
async function graphError(response,url){
 const error=Error(String(response.status));error.status=response.status;
 error.operation=operation(url);
 let body;try{body=await response.json();}catch{}
 error.errorCode=body?.error?.code;
 error.requestId=response.headers.get('request-id')||body?.error?.innerError?.['request-id'];
 return error;
}
export async function getGraph(path,token,fetcher=fetch){
 const url=new URL(path,'https://graph.microsoft.com/v1.0/');if(url.origin!=='https://graph.microsoft.com'||!url.pathname.startsWith('/v1.0/'))throw Error('graph');
 for(let attempt=0;attempt<3;attempt++){const r=await fetcher(url,{headers:{Authorization:`Bearer ${token}`,...(url.pathname.startsWith('/v1.0/shares/')?{Prefer:'redeemSharingLinkIfNecessary'}:{})},redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000)});if(r.status===429&&attempt<2){const raw=r.headers.get('Retry-After');const delay=/^\d+$/.test(raw||'')?Number(raw)*1000:Date.parse(raw)-Date.now();if(!Number.isFinite(delay)||delay>60000)throw await graphError(r,url);await new Promise(resolve=>setTimeout(resolve,Math.max(1000,delay)));continue;}if(!r.ok)throw await graphError(r,url);return r.json();}throw Error('429');
}
export function graphPaths(item,root,drive){
 const out={};if(!item.webUrl||!root.webUrl)return out;const u=new URL(item.webUrl),r=new URL(root.webUrl),p=decode(u.pathname),rp=decode(r.pathname).replace(/\/$/,'');
 if(u.origin!==r.origin||!(p===rp||p.startsWith(rp+'/')))return out;
 out['Library Root URL']=root.webUrl;out['Library Name']=drive.name;out['Server Relative Path']=p;out['Full File URL']=item.webUrl;out['Library Relative Path']=p.slice(rp.length)||'/';out['Drive Relative Path']=out['Library Relative Path'];out['Folder Path']=item.folder?out['Library Relative Path']:out['Library Relative Path'].slice(0,out['Library Relative Path'].lastIndexOf('/'))||'/';
 const site=p.match(/^\/(sites|teams|personal)\/[^/]+/);if(site){out['Site URL']=u.origin+site[0];out['Site Relative Path']=p.slice(site[0].length);}return out;
}
export function useShares(result,url){const u=new URL(url);return /^\/:[a-z]:\//i.test(u.pathname)||u.pathname.includes('/_layouts/')||!result.fields.some(f=>f.key==='Full File URL');}
export function plan(result){const val=k=>result.fields.find(f=>f.key===k)?.value;const team=val('Group ID');if(team&&guid(team)&&result.fields.some(f=>f.section==='teams'))return {kind:'teams',team,scopes:['Team.ReadBasic.All','Channel.ReadBasic.All']};const candidate=[...result.urls].reverse().find(s=>{const u=new URL(s);return /(^|\.)sharepoint\.com$/.test(u.hostname);});if(candidate)return {kind:'files',url:candidate,scopes:useShares(result,candidate)?['Files.ReadWrite']:['Sites.Read.All']};return null;}
export async function enrich(result,token,task,fetcher=fetch){
 const add=(section,key,value)=>{if(value!==undefined&&value!==null)result.fields.push({section,key,value:String(value),source:'graph',status:'confirmed'});};const get=p=>getGraph(p,token,fetcher);const E=encodeURIComponent;
 if(task.kind==='teams'){const team=await get('teams/'+E(task.team));add('teams','Graph Team ID',team.id);add('teams','Group ID',team.id);add('teams','Team Name',team.displayName);const channel=result.fields.find(f=>f.key==='Channel ID')?.value;if(channel){const c=await get('teams/'+E(team.id)+'/channels/'+E(channel));add('teams','Channel ID',c.id);add('teams','Channel Name',c.displayName);add('teams','Channel Type',c.membershipType);}return;}
 const u=new URL(task.url),direct=result.fields.find(f=>f.key==='Full File URL');let item;
 if(useShares(result,task.url))item=await get('shares/'+shareToken(task.url)+'/driveItem');
 else {const siteUrl=result.fields.find(f=>f.key==='Site URL')?.value;if(!siteUrl)throw Error('unsupported');const site=new URL(siteUrl);const s=await get('sites/'+site.hostname+(site.pathname==='/'?'':':'+site.pathname));add('files','Site ID',s.id);let next='sites/'+E(s.id)+'/drives',drives=[];while(next){const page=await get(next);drives.push(...page.value);next=page['@odata.nextLink'];if(drives.length>1000)throw Error('limit');}const path=decode(new URL(direct.value).pathname);const d=drives.filter(d=>{const v=new URL(d.webUrl);return v.origin===u.origin&&path.startsWith(decode(v.pathname).replace(/\/$/,'')+'/');}).sort((a,b)=>b.webUrl.length-a.webUrl.length)[0];if(!d)throw Error('404');const relative=path.slice(decode(new URL(d.webUrl).pathname).replace(/\/$/,'').length);item=await get('drives/'+E(d.id)+'/root:'+relative.split('/').map(E).join('/'));}
 const driveId=item.parentReference?.driveId;if(!driveId||!item.id)throw Error('unsupported');
 add('files','Drive ID',driveId);add('files','DriveItem ID',item.id);add('files',item.folder?'Folder Name':'File Name',item.name);add('files','Item Type',item.folder?'Folder':'File');for(const [k,v]of Object.entries(item.sharepointIds||{}))add('files',({listId:'List ID',listItemId:'ListItem ID',listItemUniqueId:'ListItem Unique ID',siteId:'Site collection ID',webId:'Web ID'})[k]||k,v);const drive=await get('drives/'+E(driveId)),root=await get('drives/'+E(driveId)+'/root');for(const [k,v]of Object.entries(graphPaths(item,root,drive)))add('paths',k,v);
}
