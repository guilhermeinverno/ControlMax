import { confirmBoxHandler } from "./boxRoutes";

/**
 * Re-exporta a implementação única oficial de confirmação de caixa de boxRoutes.ts
 * para manter 100% de compatibilidade com testes legados e evitar duplicidade de código.
 */
export const handleConfirmBox = confirmBoxHandler;
