// Executada em MAIN para usar somente a API pública da grade Wijmo.
export async function abrirEmpresaCenti(pedido) {
  let aberturaAcionada = false;
  const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  const visivel = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const falhar = m => {throw Error(m);};
  const unico = (lista,m) => {if (lista.length !== 1) falhar(m);return lista[0];};
  try {
    if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) falhar('Abra a Centi de Caetité.');
    if (!/^\d{14}$/.test(pedido?.cnpj) || !/^[1-9]\d*$/.test(pedido?.idEmpresa)) falhar('Resultado da pesquisa inválido.');
    const grades = [...document.querySelectorAll('.wj-flexgrid')].filter(visivel).filter(g => [...g.querySelectorAll('.wj-colheaders .wj-cell')].some(e => normal(e.textContent) === 'CPF/CNPJ'));
    const grade = unico(grades,'Há mais de uma grade de empresa ou a pesquisa foi fechada.');
    const controle = globalThis.wijmo?.Control?.getControl?.(grade);
    if (!controle?.select || !controle.getCellData) falhar('A API pública Wijmo não está disponível para conferir a empresa.');
    const colunas = Array.from(controle.columns || []);
    const idCol = unico(colunas.map((c,i)=>({c,i})).filter(({c})=>normal(c.header)==='ID'),'Coluna ID da empresa não identificada.').i;
    const cnpjCol = unico(colunas.map((c,i)=>({c,i})).filter(({c})=>normal(c.header)==='CPF/CNPJ'),'Coluna CPF/CNPJ não identificada.').i;
    const coincide = i => String(controle.getCellData(i,idCol,true)).trim() === pedido.idEmpresa
      && String(controle.getCellData(i,cnpjCol,true)).replace(/\D/g,'') === pedido.cnpj;
    const linha = unico(Array.from(controle.rows || [],(_,i)=>i).filter(coincide),'O resultado exato da empresa não é único.');
    controle.select(linha,idCol);controle.scrollIntoView?.(linha,idCol);
    if (controle.selection?.row !== linha || !coincide(linha)) falhar('A grade não manteve a seleção da empresa correta.');
    const titulos = [...grade.querySelectorAll('.wj-colheaders .wj-cell')].map(e=>normal(e.textContent));
    const cId=titulos.indexOf('ID'), cCnpj=titulos.indexOf('CPF/CNPJ');
    const celulas = unico([...grade.querySelectorAll('.wj-cells > .wj-row')].filter(visivel).map(l=>[...l.children].filter(e=>e.matches('.wj-cell')))
      .filter(c=>c[cId]?.textContent.trim()===pedido.idEmpresa && c[cCnpj]?.textContent.replace(/\D/g,'')===pedido.cnpj),'A linha da empresa mudou após a seleção.');
    const celula = celulas[cId], r = celula.getBoundingClientRect();
    const alvo = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    if (!(alvo===celula || celula.contains(alvo))) falhar('A linha da empresa está coberta.');
    const aberto = () => [...document.querySelectorAll('a,span,div')].filter(visivel).some(e=>normal(e.textContent) === `ATIVIDADE ECONOMICA - ${pedido.idEmpresa}`);
    aberturaAcionada = true;
    for (const detail of [1,2]) {
      if (aberto()) break;
      if (!coincide(linha) || controle.selection?.row!==linha || !alvo.isConnected) falhar('O resultado mudou durante a abertura da empresa.');
      for (const tipo of ['mousedown','mouseup','click']) {
        if (aberto()) break;
        alvo.dispatchEvent(new MouseEvent(tipo,{bubbles:true,cancelable:true,view:window,detail,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));
      }
    }
    if (!aberto()) alvo.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true,view:window,detail:2,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));
    const limite=Date.now()+8000;
    while(Date.now()<limite){
      if(aberto()) return {ok:true,aberturaAcionada,empresaConferida:true,idEmpresa:pedido.idEmpresa,cnpj:pedido.cnpj};
      await new Promise(r=>setTimeout(r,100));
    }
    falhar('O cadastro aberto não confirmou o ID da empresa pesquisada.');
  } catch(e){return {ok:false,aberturaAcionada,mensagem:e.message};}
}
