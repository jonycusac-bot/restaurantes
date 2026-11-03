export type InchApp='carta'|'admin';
export const appNames={carta:'INCH Carta',admin:'INCH Admin'} as const;
export const appIconFiles=(['carta','admin'] as const).flatMap(app=>[32,180,192,512].map(size=>`app-${app}-${size}.png`));
export function appHead(app:InchApp){
 return `<link rel="icon" type="image/png" sizes="32x32" href="/inch/app-${app}-32.png"><link rel="apple-touch-icon" sizes="180x180" href="/inch/app-${app}-180.png"><meta name="apple-mobile-web-app-title" content="${appNames[app]}"><meta name="apple-mobile-web-app-capable" content="yes"><link rel="manifest" href="/inch/app-${app}.webmanifest">`;
}
export function appManifest(app:InchApp){
 return {id:app==='admin'?'/admin':'/',name:appNames[app],short_name:appNames[app],lang:'es',start_url:app==='admin'?'/admin':'/',scope:app==='admin'?'/admin':'/',display:'standalone',background_color:'#f5f0e6',theme_color:app==='admin'?'#20221e':'#f5f0e6',icons:[192,512].map(size=>({src:`/inch/app-${app}-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any'}))};
}
