// Read-only local QA. Call after resizing viewport and selecting a language.
window.checkAllergenLegend = async () => {
 const check=(condition,message)=>{if(!condition)throw Error(message);};
 check(location.origin==='http://127.0.0.1:4177','Solo vista local aislada');
 const legend=document.querySelector('.inch-allergenLegend');
 check(!!legend,'Leyenda presente');
 legend.scrollIntoView({block:'center'});
 const grid=legend.querySelector('ul');
 check(getComputedStyle(grid).display==='grid','Leyenda debe usar cuadrícula responsive');
 const gridStyle=getComputedStyle(grid);
 const mobile=innerWidth<=760;
 if(mobile) check(gridStyle.gridTemplateColumns.split(' ').every(track=>parseFloat(track)<=68),'Columnas móviles compactas, sin estiramiento');
 check(parseFloat(gridStyle.rowGap)===(mobile?11:22),'Separación vertical adaptada');
 check(parseFloat(gridStyle.columnGap)===(mobile?6:12),'Separación horizontal adaptada');
 const items=[...grid.children];
 check(parseFloat(getComputedStyle(items[0]).gap)===(mobile?4:8),'Separación dibujo-nombre adaptada');
 check(parseFloat(getComputedStyle(items[0].querySelector('img')).width)===(mobile?41.25:55),'Dibujos móviles un 25 por ciento menores');
 check(items.length===14,'Todos los alérgenos presentes');
 await Promise.all(items.map(async item=>{
  const image=item.querySelector('img');
  await image.decode();
  check(image.naturalWidth>0,'Dibujo cargado');
  const ir=image.getBoundingClientRect(), label=item.querySelector('span').getBoundingClientRect();
  check(label.top>=ir.bottom,'Nombre debajo del dibujo');
  check(label.left>=0&&label.right<=innerWidth,'Etiqueta sin desbordar');
  check(item.scrollWidth<=item.clientWidth,'Nombre no recortado');
 }));
 check(document.documentElement.scrollWidth<=innerWidth,'Página sin desbordamiento horizontal');
 const expected={es:['Lácteos','Con gluten','Pescado','Moluscos','Crustáceos','Sésamo','Cacahuetes','Huevos','Sulfitos','Mostaza','Con soja','Altramuces','Apio','Frutos secos'],en:['Milk','With gluten','Fish','Molluscs','Crustaceans','Sesame','Peanuts','Eggs','Sulphites','Mustard','With soya','Lupins','Celery','Nuts'],de:['Milch','Mit Gluten','Fisch','Weichtiere','Krebstiere','Sesam','Erdnüsse','Eier','Sulfite','Senf','Mit Soja','Lupinen','Sellerie','Schalenfrüchte']};
 const labels=items.map(item=>item.querySelector('span').textContent);
 check(JSON.stringify(labels)===JSON.stringify(expected[legend.lang]),'Nombres del idioma seleccionado');
 return {passed:true,width:innerWidth,language:legend.lang,icons:items.length,columns:getComputedStyle(grid).gridTemplateColumns,labels};
};
