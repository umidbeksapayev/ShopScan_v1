import { QueryClient } from "@tanstack/react-query";

// Brauzer uchun bitta QueryClient instansiyasini saqlash (HMR/qayta render'da qayta yaratilmasin)
let browserQueryClient: QueryClient | undefined = undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 daqiqa
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: har safar yangi client
    return makeQueryClient();
  }
  // Brauzer: mavjudini qayta ishlatish
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
