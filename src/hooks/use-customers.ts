"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCustomersWithBalance,
  listCustomers,
  createCustomer,
  getCustomer,
  getCustomerSales,
  getCustomerPayments,
  recordPayment,
  type CreateCustomerInput,
  type RecordPaymentInput,
} from "@/lib/customers";

/** Balansli ro'yxat (Mijozlar sahifasi — manage_debt kerak). */
export function useCustomers(shopId: string | undefined) {
  return useQuery({
    queryKey: ["customers", shopId],
    queryFn: () => listCustomersWithBalance(shopId!),
    enabled: !!shopId,
  });
}

/** Balanssiz ro'yxat (checkout pickeri — har a'zo uchun). */
export function useCustomerOptions(shopId: string | undefined) {
  return useQuery({
    queryKey: ["customers", "options", shopId],
    queryFn: () => listCustomers(shopId!),
    enabled: !!shopId,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

export function useCustomerSales(customerId: string) {
  return useQuery({
    queryKey: ["customers", "sales", customerId],
    queryFn: () => getCustomerSales(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerPayments(customerId: string) {
  return useQuery({
    queryKey: ["customers", "payments", customerId],
    queryFn: () => getCustomerPayments(customerId),
    enabled: !!customerId,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPayment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
