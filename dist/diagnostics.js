// Show identifiers only: authentication messages can contain account or URL data.
export function diagnostic(error,stage){
 const raw=error?.errorCode||error?.message;
 const code=typeof raw==='string'&&/^[a-zA-Z0-9_.-]{1,100}$/.test(raw)?raw:'unknown';
 const details=[`${stage}: ${code}`];
 if(Number.isInteger(error?.status))details.push(`HTTP ${error.status}`);
 if(typeof error?.operation==='string'&&/^[a-z-]{1,40}$/.test(error.operation))details.push(`operation: ${error.operation}`);
 const aad=typeof error?.message==='string'?error.message.match(/\bAADSTS\d+\b/)?.[0]:null;
 if(aad)details.push(aad);
 for(const key of ['requestId','correlationId'])if(typeof error?.[key]==='string'&&/^[0-9a-f-]{36}$/i.test(error[key]))details.push(`${key}: ${error[key]}`);
 return details.join(' | ');
}
