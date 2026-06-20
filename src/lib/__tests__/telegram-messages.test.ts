import { describe, it, expect } from "vitest";
import {
  dueStatus,
  formatDate,
  formatChatDebts,
  formatReminder,
  formatLinkedMessage,
  formatOwnerSummary,
  ownerLinkedText,
  formatFeedback,
  type ChatDebt,
} from "@/lib/telegram/messages";

const TODAY = new Date("2026-06-20T12:00:00");

describe("dueStatus", () => {
  it("null → none", () => {
    expect(dueStatus(null, TODAY)).toBe("none");
    expect(dueStatus(undefined, TODAY)).toBe("none");
  });
  it("kelajak → upcoming", () => {
    expect(dueStatus("2026-06-25", TODAY)).toBe("upcoming");
  });
  it("bugun → today", () => {
    expect(dueStatus("2026-06-20", TODAY)).toBe("today");
  });
  it("o'tgan → overdue", () => {
    expect(dueStatus("2026-06-15", TODAY)).toBe("overdue");
  });
});

describe("formatDate", () => {
  it("ISO → DD.MM.YYYY", () => {
    expect(formatDate("2026-06-20")).toBe("20.06.2026");
  });
  it("bo'sh → ''", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("")).toBe("");
  });
});

describe("formatChatDebts", () => {
  it("qarz yo'q → tabrik", () => {
    expect(formatChatDebts([], TODAY)).toContain("qarz yo'q");
  });

  it("bitta do'kon — nom + summa", () => {
    const debts: ChatDebt[] = [
      { shop_name: "Akmal Market", balance: 50000, due_date: null },
    ];
    const text = formatChatDebts(debts, TODAY);
    expect(text).toContain("Akmal Market");
    expect(text).toContain("so'm");
    // bitta do'kon → "Jami" qatori yo'q
    expect(text).not.toContain("Jami:");
  });

  it("bir nechta do'kon — Jami qatori bor", () => {
    const debts: ChatDebt[] = [
      { shop_name: "A", balance: 30000, due_date: "2026-06-15" },
      { shop_name: "B", balance: 20000, due_date: null },
    ];
    const text = formatChatDebts(debts, TODAY);
    expect(text).toContain("Jami:");
    // muddati o'tgan do'kon belgilanadi
    expect(text).toContain("muddati o'tgan");
  });
});

describe("formatReminder", () => {
  it("overdue → muddat o'tgani ta'kidlanadi", () => {
    const text = formatReminder("Akmal Market", 50000, "2026-06-15", TODAY);
    expect(text).toContain("muddati o'tdi");
    expect(text).toContain("Akmal Market");
    expect(text).toContain("so'm");
    expect(text).toContain("15.06.2026");
  });

  it("muddatsiz → muddat satri yo'q", () => {
    const text = formatReminder("Do'kon", 10000, null, TODAY);
    expect(text).not.toContain("Muddat:");
  });
});

describe("formatOwnerSummary", () => {
  it("xulosa raqamlari + do'kon nomi", () => {
    const text = formatOwnerSummary({
      shop_name: "Akmal Market",
      total_debt: 250000,
      debtor_count: 4,
      overdue_count: 2,
      reminders_today: 3,
    });
    expect(text).toContain("Akmal Market");
    expect(text).toContain("so'm");
    expect(text).toContain("4 ta");
    expect(text).toContain("2 ta");
    expect(text).toContain("3 ta");
  });
});

describe("formatFeedback", () => {
  it("kategoriya + xabar + do'kon/email", () => {
    const text = formatFeedback("bug", "Skaner ishlamayapti", {
      shopName: "Akmal Market",
      email: "a@b.uz",
    });
    expect(text).toContain("Xato");
    expect(text).toContain("Skaner ishlamayapti");
    expect(text).toContain("Akmal Market");
    expect(text).toContain("a@b.uz");
  });

  it("ixtiyoriy maydonlarsiz — faqat kategoriya + xabar", () => {
    const text = formatFeedback("suggestion", "Yaxshi bo'lardi");
    expect(text).toContain("Taklif");
    expect(text).toContain("Yaxshi bo'lardi");
  });
});

describe("ownerLinkedText", () => {
  it("do'kon nomi bilan tasdiq", () => {
    expect(ownerLinkedText("Do'kon X")).toContain("Do'kon X");
    expect(ownerLinkedText("Do'kon X")).toContain("ega");
  });
});

describe("formatLinkedMessage", () => {
  it("qarzsiz → ulandingiz + qarz yo'q", () => {
    expect(formatLinkedMessage([], TODAY)).toContain("Ulandingiz");
  });
  it("qarz bilan → ulandingiz + ro'yxat", () => {
    const text = formatLinkedMessage(
      [{ shop_name: "X", balance: 1000, due_date: null }],
      TODAY
    );
    expect(text).toContain("Ulandingiz");
    expect(text).toContain("X");
  });
});
