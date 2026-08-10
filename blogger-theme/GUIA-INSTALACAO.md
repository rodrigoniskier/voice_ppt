# Guia de instalação — novo layout do blog

Dois arquivos foram preparados:

- **`theme.xml`** — o tema completo para instalar no Blogger.
- Este guia — passo a passo para instalar, configurar o AdSense e rotular os posts.

O layout separa **Teologia Reformada** e **Medicina e Saúde** em duas colunas na
home, tem cabeçalho fixo com busca e alternância claro/escuro, e traz o AdSense
já embutido em **todas as publicações** automaticamente (você não precisa editar
post por post).

---

## 1. Faça backup do tema atual (importante)

Antes de qualquer coisa, evite perder o tema que está no ar:

1. No painel do Blogger, vá em **Tema**.
2. Clique no ícone de seta ao lado de "Personalizar" → **Fazer backup/restaurar**.
3. Clique em **Fazer download do tema** e guarde o arquivo `.xml` em um local seguro.

Se algo não ficar como esperado depois, você restaura esse backup pelo mesmo menu.

---

## 2. Instale o novo tema

1. Ainda em **Tema**, clique na seta → **Editar HTML**.
2. Clique em qualquer ponto do editor e pressione **Ctrl+A** (ou Cmd+A no Mac) para
   selecionar todo o conteúdo atual, depois **Delete**.
3. Abra o arquivo `theme.xml` que preparei, copie **todo** o conteúdo e cole no
   editor do Blogger.
4. Clique em **Salvar**.
5. Use o botão **Visualizar** (ícone de olho) antes de sair da tela, para conferir
   se carregou corretamente.

Se o Blogger acusar erro de XML ao salvar, normalmente é porque algum trecho foi
cortado na cópia — copie o arquivo novamente do início ao fim, sem editar nada
manualmente antes de colar.

---

## 3. Rotule os posts com as labels exatas

O menu, a separação de temas na home e os links do rodapé dependem de os posts
usarem **exatamente** estes dois nomes de label (maiúsculas/acentos incluídos):

- `Teologia Reformada`
- `Medicina e Saúde`

**Para os posts existentes** (mais rápido em lote):

1. Vá em **Postagens**, no menu lateral do Blogger.
2. Marque a caixinha de cada post de um mesmo tema (ou use "selecionar todos" numa
   página de resultados filtrada).
3. Clique no ícone de **rótulos/labels** na barra que aparece no topo.
4. Digite a label exata e confirme.
5. Repita para o outro tema.

**Para posts futuros:** basta aplicar a label correspondente na tela de edição do
post, no campo "Labels", antes de publicar.

Enquanto um tema ainda não tiver nenhum post rotulado, a respectiva coluna na home
mostra "Em breve, os primeiros artigos deste tema." em vez de ficar quebrada.

---

## 4. Crie as unidades de anúncio no AdSense

O tema já vem com o **Auto ads** ativado para o seu ID (`ca-pub-5545124844713333`),
que funciona assim que a conta estiver aprovada — nenhuma ação extra necessária
para isso.

Além do Auto ads, o layout reserva **4 espaços fixos e bem espaçados** (topo,
dentro do artigo, lateral e rodapé) para anúncios manuais, o que dá mais controle
sobre onde o anúncio aparece e evita que ele "flutue" para um lugar ruim. Para
ativá-los:

1. Acesse [adsense.google.com](https://adsense.google.com) → **Anúncios** →
   **Por unidade de anúncio** → **Anúncio de display**.
2. Crie **4 unidades**, uma para cada posição abaixo, com formato **Responsivo**:

   | Posição | Nome sugerido | Onde aparece |
   |---|---|---|
   | Topo | `Blog - Topo` | Home (abaixo do destaque) e páginas de tema/busca |
   | Artigo | `Blog - Artigo` | Início de cada post e no meio de posts longos |
   | Lateral | `Blog - Lateral` | Barra lateral de posts e páginas de tema |
   | Rodapé | `Blog - Rodapé` | Home, fim de cada post e rodapé do site |

3. Cada unidade criada tem um **ID do slot** (um número, ex. `1234567890`).
4. No editor do Blogger (**Tema → Editar HTML**), use **Ctrl+F** para buscar cada
   um destes textos e substituí-lo pelo ID real da unidade correspondente:

   - `SUBSTITUA_PELO_SLOT_TOPO` (aparece 2×)
   - `SUBSTITUA_PELO_SLOT_ARTIGO` (aparece 2×)
   - `SUBSTITUA_PELO_SLOT_LATERAL` (aparece 1×)
   - `SUBSTITUA_PELO_SLOT_RODAPE` (aparece 3×)

5. Salve o tema novamente.

Até você trocar esses placeholders, os espaços aparecem visualmente reservados
mas sem anúncio real dentro — nada quebra, só fica em branco.

> Novas contas e novas unidades do AdSense podem levar algumas horas a até 48h
> para começar a exibir anúncios de verdade.

---

## 5. Ative o ads.txt (evita perda de receita)

1. No Blogger, vá em **Configurações → Monetização**.
2. Ative **"Personalizar ads.txt"**.
3. Cole a linha abaixo (ela é gerada a partir do seu ID de editor):

   ```
   google.com, pub-5545124844713333, DIRECT, f08c47fec0942fa0
   ```

4. Salve.

Sem isso, parte da receita de anúncios pode não ser contabilizada corretamente.

---

## 6. Ajustes finais de conteúdo

O tema tem alguns pontos com texto de exemplo que valem uma revisão rápida,
buscando por eles no editor de HTML:

- **`contato@example.com`** — troque pelo seu e-mail de contato real (aparece no
  rodapé).
- **`RN`** — as iniciais no logotipo do cabeçalho; troque se quiser outro texto
  ou sigla.
- Frase de bio no rodapé e na caixa de autor de cada post ("Rodrigo Niskier
  escreve sobre teologia reformada e medicina…") — ajuste ao seu gosto.
- **Descrição do blog**: em **Configurações → Básico → Descrição**, escreva uma
  frase curta — ela aparece como legenda ao lado do seu nome no cabeçalho.

---

## 7. O que é só demonstração vs. o que é real

A prévia publicada (link enviado na conversa) é uma página estática separada,
feita só para você aprovar a direção visual antes de eu montar o tema de verdade
— o botão "Página inicial/Artigo" ali é exclusivo da prévia e não existe no
Blogger.

Já o alternador de tema claro/escuro, a barra de progresso de leitura, o botão
"voltar ao topo", a busca, o menu mobile e o carregamento das duas colunas de
artigos por tema **são reais** e já estão no `theme.xml` — funcionam assim que
você instalar o tema e tiver posts publicados com as labels corretas.

---

## 8. Verificação rápida depois de publicar

- [ ] Home carrega com destaque + duas colunas (Teologia Reformada / Medicina e Saúde)
- [ ] Menu do topo leva às páginas de cada tema
- [ ] Um post abre com título, imagem (se houver), corpo, marcadores e comentários
- [ ] Anúncios aparecem nos 4 espaços reservados (pode levar algumas horas após configurar os slots)
- [ ] Layout funciona bem no celular (teste pelo próprio celular ou reduzindo a janela do navegador)
- [ ] Alternância de tema claro/escuro funciona e mantém a escolha ao recarregar

---

Qualquer erro ao salvar o HTML no Blogger, me avise com a mensagem exata que
aparecer — dá para identificar rápido pelo texto do erro.
