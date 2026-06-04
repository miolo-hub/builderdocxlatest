/** Default 5 milestone installments: first due in 15 days, then every 3 months. */
export function buildMilestoneInstallments(
  finalPrice: number,
  bookingDate: string,
  count = 5
): { dueDate: string; amount: number; milestone: string }[] {
  const base = Math.floor(finalPrice / count);
  const remainder = finalPrice - base * count;
  const start = new Date(bookingDate);
  const installments: { dueDate: string; amount: number; milestone: string }[] = [];

  for (let i = 0; i < count; i++) {
    const due = new Date(start);
    if (i === 0) {
      due.setDate(due.getDate() + 15);
    } else {
      due.setMonth(due.getMonth() + i * 3);
    }
    const amount = i === count - 1 ? base + remainder : base;
    installments.push({
      dueDate: due.toISOString().slice(0, 10),
      amount,
      milestone: i === 0 ? "Booking" : `Milestone ${i + 1}`,
    });
  }
  return installments;
}
