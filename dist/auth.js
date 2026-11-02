import {guid} from './parser.js';
export const defaults=Object.freeze({clientId:'37c7505c-d9a8-4bad-b60e-93ec3575fc9c',tenantId:'9c9e5e5f-2563-4959-9cfd-54536047f126',mode:'multi',redirectUri:'https://m365url.mnoda1979.chatgpt.site/',platform:'SPA'});
export function validate(s,locationUrl=location.href){
 if(!guid(s.clientId))throw Error('client');if(s.mode==='single'&&!guid(s.tenantId))throw Error('tenant');
 if(!['multi','single'].includes(s.mode)||!['SPA','Web'].includes(s.platform))throw Error('settings');
 const u=new URL(s.redirectUri),current=new URL(locationUrl);
 if(u.origin!==current.origin||u.pathname!=='/'||u.search||u.hash||u.username||u.password||!(u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname))))throw Error('redirect');
 return {...s,authority:'https://login.microsoftonline.com/'+(s.mode==='single'?s.tenantId:'organizations')};
}
let prepared=null;
export function prepareAuth(settings){
 const s=validate(settings);if(s.platform!=='SPA')throw Error('web');if(!globalThis.msal)throw Error('msal');
 const key=JSON.stringify([s.clientId,s.authority,s.redirectUri]);
 if(prepared?.key===key&&prepared.ctor===msal.PublicClientApplication)return prepared;
 const app=new msal.PublicClientApplication({auth:{clientId:s.clientId,authority:s.authority,redirectUri:s.redirectUri,navigateToLoginRequestUrl:false},cache:{cacheLocation:'memoryStorage',temporaryCacheLocation:'memoryStorage',storeAuthStateInCookie:false,cacheMigrationEnabled:false},system:{asyncPopups:false,loggerOptions:{loggerCallback:()=>{},piiLoggingEnabled:false}}});
 const entry={key,app,ctor:msal.PublicClientApplication,ready:false,promise:null};
 entry.promise=app.initialize().then(()=>{entry.ready=true;});prepared=entry;return entry;
}
export async function withToken(settings,scopes,status,work){
 const entry=prepareAuth(settings),app=entry.app;
 let response=null,token=null;
 // Initialization runs before the click. Do not wait for silent network requests
 // before opening the popup: browsers can expire the click's user activation.
 try{if(!entry.ready)await entry.promise;status('signin');response=await app.loginPopup({scopes,prompt:'select_account'});token=response.accessToken;if(!token)throw Error('token_missing');status('loading');return await work(token);}finally{token=null;response=null;await app.clearCache();}
}
