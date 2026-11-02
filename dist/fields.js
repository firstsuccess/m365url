const shared=new Set(['Site Address','Site URL','Site Name','Team URL','Channel URL','Channel Name','Folder URL','Folder Name']);
export function tabFields(result,tab){
 const fields=result.fields.filter(f=>f.section===tab||(['teams','files'].includes(tab)&&shared.has(f.key)));
 return fields.filter((f,i)=>!fields.some((other,j)=>other.key===f.key&&(other.source==='graph'&&f.source!=='graph'||other.source===f.source&&j<i)));
}
