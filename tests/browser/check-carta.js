// Read-only browser acceptance: execute this file, then await window.checkCartaOriginal().
// Deliberately restricted to the isolated local Worker/D1 preview.
window.checkCartaOriginal=async()=>{
 const check=(ok,message)=>{if(!ok)throw Error(message)};
 check(location.origin==='http://127.0.0.1:8794','Solo QA local');
 const pause=()=>new Promise(resolve=>setTimeout(resolve,60));
 document.querySelector('button[aria-label="Español"]').click();await pause();
 document.getElementById('inch-tab-carta').click();await pause();
 const menu=await(await fetch('/api/admin/menu')).json();
 const euro=value=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(value).replace(/\s/g,'');
 const categories=[['entrantes','Entrantes'],['ensaladas','Ensaladas'],['sopas','Sopas'],['salteados','Salteados'],['curry','Curry'],['arroces','Arroces'],['noodles','Tallarines'],['infantil','Menú infantil']];
 const report=[];
 for(const [id,label] of categories){
  [...document.querySelectorAll('.inch-filters button')].find(button=>button.textContent===label).click();
  for(let i=0;i<30&&!document.getElementById('inch-'+id);i++)await pause();
  check(document.getElementById('inch-'+id),'Categoría '+id);
  const actual=[...document.querySelectorAll('[data-dish-id]')];
  const expected=menu.dishes.filter(dish=>dish.categoryId===id&&!dish.hidden);
  check(JSON.stringify(actual.map(element=>element.dataset.dishId))===JSON.stringify(expected.map(dish=>dish.id)),'Orden y opciones '+id);
  for(const dish of expected){
   const element=actual.find(element=>element.dataset.dishId===dish.id);
   const value=element.querySelector('.inch-variantPrice')??element.querySelector('.inch-price');
   check(value&&value.textContent.replace(/\s/g,'').replace(/^\+/, '')===euro(dish.price),'Precio visible '+dish.name);
   if(['carta-salteados-arroz-vapor','carta-salteados-arroz-frito','carta-curry-arroz-frito'].includes(dish.id))check(value.textContent.trim().startsWith('+'),'Suplemento explícito '+dish.name);
  }
  for(const image of document.querySelectorAll('.inch-dishFigure img')){
   image.loading='eager';for(let i=0;i<30&&!image.complete;i++)await pause();check(image.naturalWidth>0,'Foto conservada '+image.src);
  }
  check(document.documentElement.scrollWidth<=innerWidth,'Sin desbordamiento '+id);
  report.push({category:id,prices:expected.length,cards:document.querySelectorAll('.inch-dishList > li').length});
 }
 check(!(window.__qaErrors??[]).length,'Errores JS '+(window.__qaErrors??[]).join('|'));
 return window.__qaCatalogResult={passed:true,width:innerWidth,totalPrices:report.reduce((total,category)=>total+category.prices,0),categories:report,errors:window.__qaErrors??[],readOnly:true};
};

window.checkCartaSearchAndLanguages=async()=>{
 const check=(ok,message)=>{if(!ok)throw Error(message)};
 check(location.origin==='http://127.0.0.1:8794','Solo QA local');
 const pause=()=>new Promise(resolve=>setTimeout(resolve,100));
 document.querySelector('button[lang="es"]').click();document.getElementById('inch-tab-carta').click();await pause();
 [...document.querySelectorAll('.inch-filters button')].find(button=>button.textContent==='Tallarines').click();await pause();
 const input=document.querySelector('.inch-search input');
 Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'langostinos');input.dispatchEvent(new Event('input',{bubbles:true}));await pause();
 const matches=[...document.querySelectorAll('.inch-variant > div > span')].map(element=>element.textContent);
 check(matches.length===4&&matches.every(label=>label.toLowerCase().includes('langostinos')),'Búsqueda de variantes');
 const languages=[];
 for(const [language,caption] of [['en','Sample photo · King prawns'],['de','Beispielfoto · Riesengarnelen']]){
  document.querySelector('button[lang="'+language+'"]').click();await pause();
  check(document.querySelectorAll('.inch-variant').length===19,'Conservar opciones en '+language);
  check(document.querySelector('.inch-dishFigure figcaption')?.textContent===caption,'Traducir la variante fotografiada en '+language);
  check(document.documentElement.scrollWidth<=innerWidth,'Sin desbordamiento '+language);
  languages.push(language);
 }
 document.querySelector('button[lang="es"]').click();await pause();
 return {passed:true,width:innerWidth,searchMatches:matches,languages,photoCaptionTranslated:true,readOnly:true};
};
