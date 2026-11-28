#!/usr/bin/env python3
"""Sobe a versão do jogo em todos os lugares de uma vez: VERSAO e VERSAO_DATA (js/02-core.js) e o ?v= de cada
arquivo nosso que o index.html carrega (css/ e js/). O ?v= faz o celular buscar todos os arquivos da versão nova juntos:
sem ele, logo depois de publicar, o aparelho podia juntar arquivos novos com velhos guardados e o jogo travava.
Uso: python3 ferramentas/subir-versao.py 1.28 [28/11/2026]   (sem data, usa a de hoje)
Depois, escreva a linha da versão no CHANGELOG.md."""
import re, sys, os, datetime
raiz=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if len(sys.argv)<2 or not re.fullmatch(r'\d+\.\d+(\.\d+)?',sys.argv[1]): sys.exit(__doc__)
v=sys.argv[1]; data=sys.argv[2] if len(sys.argv)>2 else datetime.date.today().strftime('%d/%m/%Y')
p=os.path.join(raiz,'js/02-core.js'); s=open(p,encoding='utf-8').read()
s,n=re.subn(r"const VERSAO='[^']*', VERSAO_DATA='[^']*';",f"const VERSAO='{v}', VERSAO_DATA='{data}';",s)
if n!=1: sys.exit('Não achei VERSAO/VERSAO_DATA no js/02-core.js')
open(p,'w',encoding='utf-8').write(s)
p=os.path.join(raiz,'index.html'); s=open(p,encoding='utf-8').read()
s,n=re.subn(r'((?:src|href)="(?:js|css)/[^"?#]+)(?:\?v=[^"#]*)?"',lambda m:f'{m.group(1)}?v={v}"',s)
open(p,'w',encoding='utf-8').write(s)
print(f'Versão {v} · {data}: js/02-core.js e {n} arquivo(s) no index.html. Falta a linha no CHANGELOG.md.')
