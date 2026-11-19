import type { Currency } from "./expenses";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
  paidBy: string;
  spentOn: string;
  note: string;
  shareUserIds: string[];
};

export type ExpenseInput = {
  title: string;
  amount: string;
  currency: Currency;
  paidBy: string;
  spentOn: string;
  note: string;
  shareUserIds: string[];
};

// 낸 사람·나눌 사람으로 고를 수 있는 사람. 위(페이지)에서 멤버 목록으로 만들어 넘긴다.
export type ExpensePerson = { userId: string; nickname: string };
