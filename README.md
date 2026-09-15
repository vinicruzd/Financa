# Livro-Caixa

Controle financeiro pessoal simples, no estilo de um livro-caixa: lance receitas e despesas, defina um orçamento por categoria e acompanhe o saldo do mês. Tudo roda no navegador, sem servidor ou build — só HTML, CSS e JavaScript puro.

## Como usar

Basta abrir o `index.html` no navegador. Não precisa instalar nada.

- **Lançar:** preencha data, descrição, categoria e valor no topo, escolha "Despesa" ou "Receita" e clique em **Lançar**.
- **Categorias suas:** clique no botão **+** ao lado do campo Categoria para criar uma categoria nova na hora (ex.: Gasolina, Faculdade, Estacionamento, Seguro). Não existe lista fixa — você define o que faz sentido para você.
- **Excluir lançamento:** clique no ✕ ao lado da linha.
- **Mês:** use o seletor de mês no topo para navegar entre meses.
- **Categorias e orçamento:** clique em "Categorias e orçamento" para definir um valor mensal por categoria, criar novas categorias ou excluir as que não usa mais (os lançamentos já feitos continuam no histórico mesmo se a categoria for excluída depois).
- **Gráficos:** um gráfico de rosca mostra as despesas do mês por categoria, e um gráfico de barras compara receitas x despesas nos últimos 6 meses.
- **Backup:** "Exportar CSV" baixa todos os lançamentos; "Importar CSV" lê um arquivo no mesmo formato de volta (categorias novas encontradas no CSV são criadas automaticamente).

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
