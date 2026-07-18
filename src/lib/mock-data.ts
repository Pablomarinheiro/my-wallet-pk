export const currency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

export type TxType = "income" | "expense" | "transfer";
export type Transaction = {
  id: string;
  description: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  account: string;
  amount: number;
  type: TxType;
  date: string;
  status: "confirmed" | "pending";
};

export type Account = {
  id: string;
  name: string;
  bank: string;
  type: "Conta Corrente" | "Carteira" | "Dinheiro" | "Investimento";
  balance: number;
  color: string;
};

export type Card = {
  id: string;
  name: string;
  brand: "Visa" | "Mastercard" | "Elo";
  limit: number;
  used: number;
  closing: string;
  due: string;
  color: string;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
};

export type Budget = {
  id: string;
  category: string;
  icon: string;
  limit: number;
  spent: number;
  color: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
};

export const accounts: Account[] = [
  { id: "a1", name: "Conta Nubank", bank: "Nubank", type: "Conta Corrente", balance: 8420.5, color: "#8B5CF6" },
  { id: "a2", name: "Itaú Salário", bank: "Itaú", type: "Conta Corrente", balance: 12980.0, color: "#F97316" },
  { id: "a3", name: "Carteira", bank: "—", type: "Carteira", balance: 320.0, color: "#22C55E" },
  { id: "a4", name: "Investimentos XP", bank: "XP", type: "Investimento", balance: 45820.75, color: "#0EA5E9" },
];

export const cards: Card[] = [
  { id: "c1", name: "Nubank Ultravioleta", brand: "Mastercard", limit: 15000, used: 4820.5, closing: "28", due: "05", color: "#111827" },
  { id: "c2", name: "Itaú Click", brand: "Visa", limit: 8000, used: 2340.0, closing: "15", due: "22", color: "#F97316" },
  { id: "c3", name: "Inter Black", brand: "Mastercard", limit: 12000, used: 980.0, closing: "10", due: "18", color: "#EA580C" },
];

export const goals: Goal[] = [
  { id: "g1", name: "Reserva de Emergência", target: 30000, current: 18500, deadline: "2026-12-31", color: "#2563EB" },
  { id: "g2", name: "Viagem Japão", target: 25000, current: 8200, deadline: "2027-03-01", color: "#F59E0B" },
  { id: "g3", name: "Novo MacBook", target: 18000, current: 12400, deadline: "2026-09-30", color: "#22C55E" },
  { id: "g4", name: "Curso de Inglês", target: 6000, current: 5200, deadline: "2026-08-15", color: "#8B5CF6" },
];

export const budgets: Budget[] = [
  { id: "b1", category: "Alimentação", icon: "utensils", limit: 1500, spent: 1180, color: "#F59E0B" },
  { id: "b2", category: "Transporte", icon: "car", limit: 800, spent: 640, color: "#2563EB" },
  { id: "b3", category: "Lazer", icon: "gamepad-2", limit: 600, spent: 720, color: "#EF4444" },
  { id: "b4", category: "Mercado", icon: "shopping-cart", limit: 1200, spent: 890, color: "#22C55E" },
  { id: "b5", category: "Saúde", icon: "heart-pulse", limit: 500, spent: 220, color: "#EC4899" },
  { id: "b6", category: "Educação", icon: "graduation-cap", limit: 900, spent: 900, color: "#8B5CF6" },
];

export const categories: Category[] = [
  { id: "cat1", name: "Salário", icon: "briefcase", color: "#22C55E", type: "income" },
  { id: "cat2", name: "Freelance", icon: "laptop", color: "#0EA5E9", type: "income" },
  { id: "cat3", name: "Investimentos", icon: "trending-up", color: "#8B5CF6", type: "income" },
  { id: "cat4", name: "Alimentação", icon: "utensils", color: "#F59E0B", type: "expense" },
  { id: "cat5", name: "Transporte", icon: "car", color: "#2563EB", type: "expense" },
  { id: "cat6", name: "Mercado", icon: "shopping-cart", color: "#22C55E", type: "expense" },
  { id: "cat7", name: "Lazer", icon: "gamepad-2", color: "#EF4444", type: "expense" },
  { id: "cat8", name: "Saúde", icon: "heart-pulse", color: "#EC4899", type: "expense" },
  { id: "cat9", name: "Educação", icon: "graduation-cap", color: "#8B5CF6", type: "expense" },
  { id: "cat10", name: "Moradia", icon: "home", color: "#0F172A", type: "expense" },
];

export const transactions: Transaction[] = [
  { id: "t1", description: "Salário Empresa X", category: "Salário", categoryIcon: "briefcase", categoryColor: "#22C55E", account: "Itaú Salário", amount: 8500, type: "income", date: "2026-07-05", status: "confirmed" },
  { id: "t2", description: "Freelance Design", category: "Freelance", categoryIcon: "laptop", categoryColor: "#0EA5E9", account: "Conta Nubank", amount: 2400, type: "income", date: "2026-07-10", status: "confirmed" },
  { id: "t3", description: "Mercado Extra", category: "Mercado", categoryIcon: "shopping-cart", categoryColor: "#22C55E", account: "Nubank Ultravioleta", amount: 420.5, type: "expense", date: "2026-07-14", status: "confirmed" },
  { id: "t4", description: "Uber - Semana", category: "Transporte", categoryIcon: "car", categoryColor: "#2563EB", account: "Nubank Ultravioleta", amount: 189.9, type: "expense", date: "2026-07-15", status: "confirmed" },
  { id: "t5", description: "Netflix", category: "Lazer", categoryIcon: "gamepad-2", categoryColor: "#EF4444", account: "Itaú Click", amount: 55.9, type: "expense", date: "2026-07-12", status: "confirmed" },
  { id: "t6", description: "Restaurante Sushi Kai", category: "Alimentação", categoryIcon: "utensils", categoryColor: "#F59E0B", account: "Nubank Ultravioleta", amount: 178.0, type: "expense", date: "2026-07-16", status: "confirmed" },
  { id: "t7", description: "Aluguel", category: "Moradia", categoryIcon: "home", categoryColor: "#0F172A", account: "Itaú Salário", amount: 2400, type: "expense", date: "2026-07-05", status: "confirmed" },
  { id: "t8", description: "Farmácia São João", category: "Saúde", categoryIcon: "heart-pulse", categoryColor: "#EC4899", account: "Conta Nubank", amount: 89.4, type: "expense", date: "2026-07-11", status: "confirmed" },
  { id: "t9", description: "Rendimento CDB", category: "Investimentos", categoryIcon: "trending-up", categoryColor: "#8B5CF6", account: "Investimentos XP", amount: 640.2, type: "income", date: "2026-07-01", status: "confirmed" },
  { id: "t10", description: "Curso Online", category: "Educação", categoryIcon: "graduation-cap", categoryColor: "#8B5CF6", account: "Itaú Click", amount: 299.0, type: "expense", date: "2026-07-08", status: "pending" },
];

export const cashflow = [
  { month: "Jan", income: 9200, expense: 6100 },
  { month: "Fev", income: 8800, expense: 5800 },
  { month: "Mar", income: 10200, expense: 7200 },
  { month: "Abr", income: 9500, expense: 6400 },
  { month: "Mai", income: 11000, expense: 7900 },
  { month: "Jun", income: 10400, expense: 6800 },
  { month: "Jul", income: 11540, expense: 7220 },
];

export const categoryPie = [
  { name: "Moradia", value: 2400, color: "#0F172A" },
  { name: "Alimentação", value: 1180, color: "#F59E0B" },
  { name: "Transporte", value: 640, color: "#2563EB" },
  { name: "Mercado", value: 890, color: "#22C55E" },
  { name: "Lazer", value: 720, color: "#EF4444" },
  { name: "Saúde", value: 220, color: "#EC4899" },
  { name: "Educação", value: 900, color: "#8B5CF6" },
];

export const totals = {
  balance: accounts.reduce((s, a) => s + a.balance, 0),
  income: 11540,
  expense: 7220,
  savings: 4320,
};
