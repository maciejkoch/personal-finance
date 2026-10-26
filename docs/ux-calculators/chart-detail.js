// Presentation-only enhancement shared by the mobile and desktop mockups.
function decorate(product, key) {
  const mobile = product.classList.contains('osz-mobile');
  product.setAttribute('aria-label', mobile ? 'Telefon — układ obok wyniku' : 'Desktop — układ obok wyniku');
  const secondary = product.querySelector('.osz-secondary');
  product.querySelector('.osz-workspace').after(secondary);
  const jumps = document.createElement('div');
  jumps.className = 'osz-jumps';
  jumps.innerHTML = '<button type="button" data-jump-result>Zobacz wynik ↓</button>';
  product.querySelector('.osz-intro').after(jumps);
  jumps.querySelector('button').addEventListener('click', () => product.querySelector('.osz-result').scrollIntoView({block:'start'}));
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'osz-back';
  back.textContent = 'Zmień założenia ↑';
  back.addEventListener('click', () => product.querySelector('form').scrollIntoView({block:'start'}));
  product.querySelector('.osz-result-top').append(back);
  const tax = product.querySelector('[data-tax]').closest('details');
  if (mobile) tax.open = false;
  const chart = product.querySelector('.osz-chart');
  if (key !== 'bonds') {
    const old = chart.querySelector('svg');
    const plot = document.createElement('div');
    plot.className = 'osz-live-plot';
    old.replaceWith(plot);
    const samples = key === 'regular' ? [0,6140,12592.96] : [0,5219,10704.77];
    drawPlot(plot, [
      {name:'Wartość brutto',values:samples,color:'var(--osz-orange)'},
      {name:'Wniesione środki',values:key==='regular'?[0,6000,12000]:[0,5100.36,10200.72],color:'var(--osz-blue)',dash:'6 4'}
    ], 2, 0, 15000);
    return;
  }
  const series = [
    {name:'TOS',values:[10000,10356,10728,11116],color:'var(--osz-orange)'},
    {name:'COI',values:[10000,10385,10698,11012],color:'var(--osz-blue)',dash:'7 3'},
    {name:'EDO',values:[10000,10210,10555,10924],color:'var(--osz-green)',dash:'2 3'},
    {name:'ROR',values:[10000,10251,10506,10765],color:'var(--osz-purple)',dash:'9 3 2 3'},
    {name:'DOR',values:[10000,10269,10542,10820],color:'var(--osz-pink)',dash:'4 3'}
  ];
  chart.querySelector('.osz-bars').innerHTML=series.map(s=>`<div class="osz-bar-row"><span class="osz-series-name"><i style="background:${s.color}"></i>${s.name}</span><div class="osz-track"><div class="osz-fill" style="width:${s.values[3]/12000*100}%;background:${s.color}"></div></div><span>${money(s.values[3])}</span></div>`).join('');
  chart.querySelector('.osz-hint').textContent='Dane ilustracyjne do oceny wykresu · nie jest to aktualny ranking.';
  const inflation=document.createElement('p');
  inflation.className='osz-inflation';
  inflation.innerHTML='Próg zachowania siły nabywczej <strong>10 927,27 zł</strong><br><span class="osz-hint">Przy założonej inflacji 3% rocznie.</span>';
  product.querySelector('.osz-key').append(inflation);
  const details=document.createElement('details');
  details.className='osz-group osz-history';
  details.open=true;
  details.innerHTML='<summary>Przebieg inwestycji<small>Wartość po podatku i opłatach w kolejnych latach</small></summary><div class="osz-group-body"><fieldset class="osz-series-controls"><legend>Serie na wykresie</legend>'+series.map((s,i)=>`<label><input type="checkbox" checked data-series="${i}"><i style="background:${s.color}"></i>${s.name}</label>`).join('')+'</fieldset><div class="osz-live-plot"></div><p class="osz-hint">Dane ilustracyjne · wybierz rok pod wykresem, aby odczytać wartości. Linie mają różne kolory i wzory.</p><p class="osz-point-value" role="status">TOS · koniec 3. roku · 11 116,00 zł</p></div>';
  secondary.prepend(details);
  const plot=details.querySelector('.osz-live-plot');
  const renderPlot=()=>drawPlot(plot,series.filter((_,i)=>details.querySelector(`[data-series="${i}"]`).checked),3,10000,12000,details.querySelector('.osz-point-value'));
  renderPlot();
  details.querySelectorAll('input').forEach(input=>input.addEventListener('change',renderPlot));
  details.addEventListener('toggle',()=>{if(details.open)renderPlot();});
}
function money(value){return value.toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' zł';}
function drawPlot(target,series,years,min,max,output){
  if(target._resize)target._resize.disconnect();
  const paint=()=>{
    const width=Math.max(220,Math.round(target.getBoundingClientRect().width||320));
    const height=240,left=48,right=16,top=20,bottom=36;
    const x=i=>left+(width-left-right)*i/years;
    const y=v=>top+(height-top-bottom)*(1-(v-min)/(max-min));
    const rows=[min,(min+max)/2,max];
    const ticks=Array.from({length:years+1},(_,i)=>i);
    target.innerHTML=`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Poglądowy wykres: ${series.map(s=>s.name).join(', ')||'brak wybranych serii'}. Wartości w tysiącach złotych."><title>Wartość inwestycji w kolejnych latach — dane ilustracyjne</title>${rows.map(v=>`<path class="osz-grid-line" d="M${left} ${y(v)}H${width-right}"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end">${v/1000} tys.</text>`).join('')}${ticks.map(i=>`<text x="${x(i)}" y="${height-12}" text-anchor="${i===0?'start':i===years?'end':'middle'}">${i===0?'Start':i===1?'1 rok':i+' lata'}</text>`).join('')}${series.map(s=>`<path fill="none" stroke="${s.color}" stroke-width="2.5" stroke-dasharray="${s.dash||''}" d="${s.values.map((v,i)=>(i?'L':'M')+x(i)+' '+y(v)).join(' ')}"/>`).join('')}</svg>`;
    const control=document.createElement('label');
    control.className='osz-chart-readout';
    control.innerHTML='Odczyt dla roku <select aria-label="Rok odczytu wykresu" class="osz-picker">'+ticks.slice(1).map(i=>`<option value="${i}">${i}</option>`).join('')+'</select>';
    const select=control.querySelector('select');
    select.value=String(target._year||years);
    const status=output||document.createElement('p');
    status.className='osz-point-value';status.setAttribute('role','status');
    const update=()=>{target._year=Number(select.value);status.textContent=series.length?series.map(s=>s.name+': '+money(s.values[target._year])).join(' · '):'Wybierz co najmniej jedną serię.';};
    select.addEventListener('change',update);
    target.append(control);
    if(!output)target.append(status);
    update();
  };
  paint();
  if(typeof ResizeObserver!=='undefined'){target._resize=new ResizeObserver(paint);target._resize.observe(target);}
}
