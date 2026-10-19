import {organizarLinhas,extrairCartaoCnpj} from './cartao-cnpj.mjs';
export async function importarCartaoPdf(arquivo,{signal}={}) {
  if(!arquivo||!/^.+\.pdf$/i.test(arquivo.name))throw Error('Selecione um arquivo PDF do cartão CNPJ.');
  if(!arquivo.size||arquivo.size>10*1024*1024)throw Error('O PDF deve ter até 10 MB e não pode estar vazio.');
  const bytes=await arquivo.arrayBuffer();
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('O arquivo selecionado não é um PDF válido.');
  if(signal?.aborted)throw Error('Leitura do PDF cancelada.');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
  let pdfjs;
  try { pdfjs=await import('./vendor/pdfjs/pdf.mjs'); }
  catch { throw Error('Não foi possível carregar a biblioteca PDF. Carregue a extensão completa e tente novamente.'); }
  if(signal?.aborted)throw Error('Leitura do PDF cancelada.');
  // workerPort evita o wrapper de CDN em URLs chrome-extension://.
  const worker=new Worker(new URL('./vendor/pdfjs/pdf.worker.mjs',import.meta.url),{type:'module'});
  const tarefa=pdfjs.getDocument({data:new Uint8Array(bytes),worker:new pdfjs.PDFWorker({port:worker}),isEvalSupported:false,disableFontFace:true,
    standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,
    cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,stopAtErrors:true});
  let protegido=false; tarefa.onPassword=()=>{protegido=true;void tarefa.destroy();};
  const cancelar=()=>{void tarefa.destroy();};
  signal?.addEventListener('abort',cancelar,{once:true});
  let demorou=false;
  const timer=setTimeout(()=>{demorou=true;cancelar();},30000);
  try {
    const documento=await tarefa.promise;
    if(documento.numPages>20)throw Error('O cartão deve ter até 20 páginas. Anexe somente o comprovante do CNPJ.');
    const linhas=[];
    for(let pagina=1;pagina<=documento.numPages;pagina++) {
      if(signal?.aborted)throw Error('Leitura do PDF cancelada.');
      const folha=await documento.getPage(pagina),viewport=folha.getViewport({scale:1});
      const conteudo=await folha.getTextContent();
      const itens=conteudo.items.filter(i=>typeof i.str==='string').map(i=>{
        const pos=pdfjs.Util.transform(viewport.transform,i.transform);
        return {texto:i.str,x:pos[4],y:pos[5],largura:i.width*viewport.scale};
      });
      linhas.push(...organizarLinhas(itens,pagina));folha.cleanup();
    }
    const empresa=extrairCartaoCnpj(linhas);
    return {...empresa,documento:{nome:arquivo.name,tamanho:arquivo.size,paginas:documento.numPages,sha256:hash}};
  } catch(erro) {
    if(signal?.aborted)throw Error('Leitura do PDF cancelada.');
    if(demorou)throw Error('A leitura do PDF demorou demais. Anexe uma cópia menor do cartão.');
    if(protegido)throw Error('O PDF está protegido por senha. Anexe uma cópia sem proteção.');
    if(['InvalidPDFException','UnknownErrorException','PasswordException'].includes(erro.name))throw Error('Não foi possível abrir o PDF. Anexe o cartão completo e sem senha.');
    throw erro;
  } finally {
    clearTimeout(timer);signal?.removeEventListener('abort',cancelar);await tarefa.destroy();worker.terminate();
  }
}
