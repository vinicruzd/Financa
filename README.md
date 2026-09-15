# Livro-Caixa

Controle financeiro pessoal simples, no estilo de um livro-caixa: lance receitas e despesas, defina um orçamento por categoria e acompanhe o saldo do mês. Tudo roda no navegador, sem servidor ou build — só HTML, CSS e JavaScript puro.

## Como usar

Basta abrir o `index.html` no navegador. Não precisa instalar nada.

- **Lançar:** preencha data, descrição, categoria e valor no topo, escolha "Despesa" ou "Receita" e clique em **Lançar**.
- **Excluir:** clique no ✕ ao lado do lançamento.
- **Mês:** use o seletor de mês no topo para navegar entre meses.
- **Orçamento:** clique em "Editar orçamentos" para definir um valor mensal por categoria; a barra de progresso fica amarela perto do limite e vermelha ao estourar.
- **Backup:** "Exportar CSV" baixa todos os lançamentos; "Importar CSV" lê um arquivo no mesmo formato de volta.

Os dados ficam salvos no `localStorage` do navegador (por aparelho/navegador, não sincroniza entre dispositivos).

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e suba estes arquivos (`index.html`, `styles.css`, `script.js`, `README.md`):

   ```bash
   git init
   git add .
   git commit -m "Livro-Caixa: controle financeiro pessoal"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/livro-caixa.git
   git push -u origin main
   ```

2. No repositório, vá em **Settings → Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/ (root)`.
4. Salve. Em alguns minutos o site fica disponível em:
   `https://SEU-USUARIO.github.io/livro-caixa/`

Qualquer novo `git push` na branch `main` atualiza o site automaticamente.

## Estrutura

```
index.html    → estrutura da página
styles.css    → estilo (tema "ledger" em tons de papel, verde e vermelho)
script.js     → lógica: lançamentos, orçamento, gráfico, CSV
```

## Personalizar categorias

As categorias ficam no topo de `script.js`, na constante `CATEGORIES`. Edite essa lista para adicionar, remover ou renomear categorias.
