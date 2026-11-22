# Lista os textos do jogo (em português) que ainda não estão no dicionário japonês js/22-ja.js.
# Uso, na pasta do jogo:  python3 ferramentas/textos-sem-traducao.py
# Cada texto aparece como chave do dicionário: pedaço de texto entre tags HTML, com {} no lugar de ${...}.
# Acrescente em js/22-ja.js:  "texto em português":"日本語",  (use {} na mesma ordem, ou {1},{2}… para trocar a ordem; null = não traduzir).
# A lista pode trazer pedaços de código (nome de classe, chave interna): ignore ou ponha null.
import re, glob, json, sys, html
import os
os_root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PT=re.compile(r'[A-Za-zÀ-ú]{2,}')
def is_pt(s):
    t=re.sub(r'\s+',' ',re.sub(r'\{\w*\}','',s))
    if not PT.search(t): return False
    if re.fullmatch(r'[\w\-.#: ,()\[\]=>{}\'"/+*%!|&?]+',t) and not re.search(r'[A-Za-zÀ-ú]{3,} [A-Za-zÀ-ú]{2,}|[ãõçéêáíóúâô]',t):
        # código provável (sem espaço entre palavras e sem acento)
        if not re.fullmatch(r'[A-ZÀ-Ú][a-zà-ú]+[!?.]?',t.strip()): return False
    return True
EXPRS=[]
def tmpl_parts(body):
    # troca ${...} (com chaves aninhadas) por \x00 e devolve
    out=''; i=0; n=len(body)
    while i<n:
        if body.startswith('${',i):
            d=0; j=i+2; depth=1
            while j<n and depth:
                if body[j]=='{': depth+=1
                elif body[j]=='}': depth-=1
                j+=1
            EXPRS.append(body[i+2:j-1]); out+='\x00'; i=j
        else: out+=body[i]; i+=1
    return out
segs={}
def add(seg,src):
    seg=html.unescape(seg)
    seg=re.sub(r'\s+',' ',seg).strip()
    seg=seg.replace('\x00','{}')
    seg=re.sub(r'^(\{\} ?)+|( ?\{\})+$',lambda m:m.group(0),seg)
    if len(seg)<2 or not is_pt(seg): return
    segs.setdefault(seg,set()).add(src)
def split_html(s,src):
    for part in re.split(r'<[^<>]*>',s): add(part,src)
def scan(s,src):
    for m in re.finditer(r"`((?:[^`\\]|\\.)*)`|'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"",s):
        body=m.group(1) if m.group(1) is not None else (m.group(2) if m.group(2) is not None else m.group(3))
        if m.group(1) is not None:
            EXPRS.clear(); body=tmpl_parts(body)
            for ex in list(EXPRS): scan(ex,src)
        body=body.replace("\\'","'").replace('\\"','"').replace('\\n','\n')
        for a in re.findall(r'(?:placeholder|aria-label|title)="([^"]+)"',body): add(a,src)
        split_html(body,src)
for f in ['index.html']+[x for x in sorted(glob.glob(os_root+'/js/*.js')) if not re.search(r'/2[23]-',x)]:
    f=f if f.startswith('/') else os_root+'/'+f
    s=open(f).read(); src=f.split('/')[-1]
    if f.endswith('.html'):
        s=re.sub(r'<script[\s\S]*?</script>','',s); s=re.sub(r'<style[\s\S]*?</style>','',s)
        for a in re.findall(r'(?:placeholder|aria-label|title)="([^"]+)"',s): add(a,src)
        split_html(s,src); continue
    s=re.sub(r'^\s*//.*$','',s,flags=re.M)
    scan(s,src)
ja=set()
for l in open(os_root+'/js/22-ja.js'):
    l=l.strip().rstrip(',')
    if l.startswith('"'):
        try: ja.add(json.loads('{'+l+'}').popitem()[0])
        except Exception: pass
falta=[k for k in sorted(segs) if k not in ja]
for k in falta: print(json.dumps(k,ensure_ascii=False)+':null,', ' //', ', '.join(sorted(segs[k])))
print(f'{len(falta)} texto(s) sem tradução', file=sys.stderr)
