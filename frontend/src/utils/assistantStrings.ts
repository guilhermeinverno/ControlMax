export const ASSISTANT_STRINGS = {
  pt: {
    title: 'Assistente de Voz IA ControlMax',
    sub: 'Controle por voz em tela cheia • Toque e fale',
    placeholder: 'Digite sua dúvida, comando ou transação...',
    idle: 'Pronto para ajudar. Toque no microfone ou digite.',
    recording: 'Ouvindo atentamente...',
    thinking: 'Sintetizando inteligência artificial...',
    playing: 'Falando...',
    error: 'Ocorreu um erro na comunicação de voz.',
    noMic: 'Acesso ao microfone recusado ou indisponível.',
    welcome: 'Olá! Sou o Assistente Oficial do ControlMax. Pergunte-me sobre suas vendas, rotas, cobradores ou caixa!',
  },
  es: {
    title: 'Asistente de Voz IA ControlMax',
    sub: 'Control por voz en pantalla completa • Toque y hable',
    placeholder: 'Escriba su duda, comando o transacción...',
    idle: 'Listo para ayudar. Toque el micrófono o escriba.',
    recording: 'Escuchando atentamente...',
    thinking: 'Sintetizando inteligencia artificial...',
    playing: 'Hablando...',
    error: 'Ocurrió un error en la comunicación de voz.',
    noMic: 'Acceso al micrófono denegado o no disponible.',
    welcome: '¡Hola! Soy el Asistente Oficial de ControlMax. ¡Pregúnteme sobre sus ventas, rutas, cobradores o caja!',
  },
} as const;

export type AssistantLanguage = keyof typeof ASSISTANT_STRINGS;

export function assistantStrings(language: AssistantLanguage) {
  return ASSISTANT_STRINGS[language];
}

export function assistantAbortErrorMessage(language: AssistantLanguage): string {
  if (language === 'pt') {
    return 'A solicitação ao assistente expirou. Verifique se o backend está rodando e tente novamente.';
  }
  return 'La solicitud al asistente expiró. Verifique que el backend esté en ejecución e intente de nuevo.';
}

export const ASSISTANT_FETCH_TIMEOUT_MS = 60_000;
