import { describe, test, expect } from "vitest";
import {
  parseCurrencyBRLToFloat,
  parseCurrencyBRLToCents,
  formatCurrencyBRL,
  autocompleteCurrencyBRL,
} from "./currency";

describe("Testes Unitários para a utilidade de moeda (currency.ts)", () => {
  describe("parseCurrencyBRLToFloat", () => {
    test("Converte formato BRL padrão '1.234,56' para float 1234.56", () => {
      expect(parseCurrencyBRLToFloat("1.234,56")).toBe(1234.56);
    });

    test("Converte BRL simples sem milhar '10,50' para float 10.5", () => {
      expect(parseCurrencyBRLToFloat("10,50")).toBe(10.5);
    });

    test("Converte valor inteiro sem decimais '500' para 500", () => {
      expect(parseCurrencyBRLToFloat("500")).toBe(500);
    });

    test("Comportamento adversarial documentado: formato US '10.50' é interpretado como 1050 (remove o ponto)", () => {
      // Como o parser BRL assume que o ponto '.' é separador de milhar, '10.50' vira '1050' e depois 1050
      expect(parseCurrencyBRLToFloat("10.50")).toBe(1050);
    });

    test("Retorna 0 para string vazia ou inválida", () => {
      expect(parseCurrencyBRLToFloat("")).toBe(0);
      expect(parseCurrencyBRLToFloat("abc")).toBe(0);
    });
  });

  describe("parseCurrencyBRLToCents", () => {
    test("Converte '10,50' para 1050 centavos", () => {
      expect(parseCurrencyBRLToCents("10,50")).toBe(1050);
    });

    test("Converte '1.234,56' para 123456 centavos", () => {
      expect(parseCurrencyBRLToCents("1.234,56")).toBe(123456);
    });
  });

  describe("formatCurrencyBRL & autocompleteCurrencyBRL", () => {
    test("Formata entrada bruta para o padrão BRL", () => {
      expect(formatCurrencyBRL("1234,56")).toBe("1.234,56");
    });

    test("Autocompleta valor para 2 casas decimais", () => {
      expect(autocompleteCurrencyBRL("10,5")).toBe("10,50");
    });
  });
});
