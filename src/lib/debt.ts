/**
 * Qarz hisoblash — sof funksiyalar (UI va testda ishlatiladi).
 * SQL tarafdagi formula bilan bir xil bo'lishi shart (migration 013).
 */

/** Bitta sotuvdagi qarz (to'lanmagan qism). Manfiy bo'lmaydi. */
export function saleDebt(totalRevenue: number, paidAmount: number): number {
  return Math.max(0, totalRevenue - paidAmount);
}

/**
 * Mijozning joriy qarz balansi.
 * balance = Σ(sotuv: total_revenue − paid_amount) − Σ(to'lovlar)
 * Musbat = mijoz qarzdor; 0 = qarz yo'q.
 */
export function computeCustomerBalance(
  sales: ReadonlyArray<{ total_revenue: number; paid_amount: number }>,
  payments: ReadonlyArray<{ amount: number }>
): number {
  const debt = sales.reduce((sum, s) => sum + (s.total_revenue - s.paid_amount), 0);
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  return debt - paid;
}

/** Checkout: jami va to'langan summadan qolgan (qarzga yoziladigan) summa. */
export function remainingDebt(total: number, paid: number): number {
  return Math.max(0, total - paid);
}
