import { MouseEvent, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useLayoutUi() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const impersonatedTenantId = localStorage.getItem('controlmax_impersonated_tenant');

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA installation response: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else {
      // Fallback instructions for iOS Safari and other browsers
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isiOS) {
        alert("Para instalar no iPhone/iPad:\n1. Toque no botão Compartilhar (no rodapé do Safari)\n2. Role para baixo e selecione 'Adicionar à Tela de Início' 📲");
      } else {
        alert("Para instalar no seu Navegador:\n1. Clique no ícone de menu (⋮) do navegador\n2. Selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial' 📲");
      }
    }
  };

  const handleDropdownClick = (event: MouseEvent, menuId: string) => {
    event.stopPropagation();
    setActiveDropdown((current) => (current === menuId ? null : menuId));
  };

  const handleExitImpersonation = () => {
    localStorage.removeItem('controlmax_impersonated_tenant');
    window.location.href = '/#/superadmin';
  };

  return {
    activeDropdown,
    setActiveDropdown,
    showInstallBanner,
    setShowInstallBanner,
    handleInstallClick,
    handleDropdownClick,
    impersonatedTenantId,
    handleExitImpersonation,
  };
}
