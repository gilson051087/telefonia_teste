import { isValidCpfCnpj, maskCpfCnpj } from "./sales";

describe("sales utils", () => {
  test("maskCpfCnpj aplica mascara de CPF e CNPJ", () => {
    expect(maskCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(maskCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  test("isValidCpfCnpj valida CPF e CNPJ", () => {
    expect(isValidCpfCnpj("529.982.247-25")).toBe(true);
    expect(isValidCpfCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCpfCnpj("11.222.333/0001-00")).toBe(false);
  });
});
