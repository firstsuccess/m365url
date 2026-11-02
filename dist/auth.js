import {guid} from './parser.js';
export const defaults=Object.freeze({clientId:'37c7505c-d9a8-4bad-b60e-93ec3575fc9c',tenantId:'9c9e5e5f-2563-4959-9cfd-54536047f126',mode:'multi',redirectUri:'https://m365url.mnoda1979.chatgpt.site/',platform:'SPA'});
export function validate(s,locationUrl=location.href){
 if(!guid(s.clientId))throw Error('client');if(s.mode==='single'&&!guid(s.tenantId))throw Error('tenant');
 if(!['multi','single'].includes(s.mode)||!['SPA','Web'].includes(s.platform))throw Error('settings');
 const u=new URL(s.redirectUri),current=new URL(locationUrl);
 if(u.origin!==current.origin||u.pathname!=='/'||u.search||u.hash||u.username||u.password||!(u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname))))throw Error('redirect');
 return {...s,authority:'https://login.microsoftonline.com/'+(s.mode==='single'?s.tenantId:'organizations')};
}
export async function withToken(settings,scopes,status,work){
 const s=validate(settings);if(s.platform!=='SPA')throw Error('web');if(!globalThis.msal)throw Error('msal');
 const app=new msal.PublicClientApplication({auth:{clientId:s.clientId,authority:s.authority,redirectUri:s.redirectUri,navigateToLoginRequestUrl:false},cache:{cacheLocation:'memoryStorage',temporaryCacheLocation:'memoryStorage',storeAuthStateInCookie:false,cacheMigrationEnabled:false},system:{loggerOptions:{loggerCallback:()=>{},piiLoggingEnabled:false}}});
 let response=null,token=null;
 try{await app.initialize();status('sso');try{response=await app.ssoSilent({scopes,redirectUri:s.redirectUri});}catch{status('signin');response=await app.loginPopup({scopes,prompt:'select_account'});}try{response=await app.acquireTokenSilent({scopes,account:response.account});}catch{response=await app.acquireTokenPopup({scopes,account:response.account});}token=response.accessToken;status('loading');return await work(token);}finally{token=null;response=null;await app.clearCache();}
}
