// Read-only layout regression on local public QA. Does not edit dish data.
window.checkDishAllergenSpacing=()=>{
 if(location.origin!=='http://127.0.0.1:8794')throw Error('Only local QA');
 const a=document.querySelector('[data-dish-id="carta-poh-pia-sod"] .inch-dishAllergens');
 if(!a)throw Error('Pilot not available');
 const widths=[...a.children].map(i=>i.getBoundingClientRect().width);
 const width=a.getBoundingClientRect().width;
 if(a.lang==='es'&&a.children.length===3&&width>=160)throw Error('Los tres iconos siguen demasiado separados');
 for(const li of a.children){const img=li.querySelector('img'),text=li.querySelector('span');if(getComputedStyle(img).width!=='28px'||getComputedStyle(text).fontSize!=='10px')throw Error('No reducir dibujos ni texto');if(li.scrollWidth>li.clientWidth+1)throw Error('Etiqueta desbordada');}
 if(document.documentElement.scrollWidth>innerWidth)throw Error('Desbordamiento horizontal');
 return {passed:true,viewport:innerWidth,lang:a.lang,width,widths};
};
