# My Wallet — Roadmap

## Concluído
- Importação CSV com parser robusto + sugestões automáticas (tipo, categoria, conta, data)
- Configurações: não alterar tema ao abrir a tela (tema padrão claro)

## Em andamento
1. Cartão de crédito — compras parceladas
   - Tabela `card_purchases` + parcelas geradas por mês
   - Fatura calculada pelo ciclo de fechamento (remover campo "Usado" editável)
   - Lista de compras em aberto no cartão (loja, parcela x/N, juros)
2. Investimentos — módulo separado
   - Tabelas `investments` e `investment_transactions`
   - Separar patrimônio aplicado do saldo líquido (dashboard, consolidado, relatórios)
   - Tela com total investido, valor atual manual e rentabilidade (% e R$)
3. Orçamento
   - Drill-down dos lançamentos por categoria orçada
   - Alertas de 80% e 100% visíveis no dashboard

## Validação final
- Compra parcelada recalcula fatura
- Aporte de investimento atualiza rentabilidade
- Estouro de orçamento exibe alerta no dashboard
