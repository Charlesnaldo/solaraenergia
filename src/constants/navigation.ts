import { Instagram, Linkedin, Facebook } from "lucide-react";

export const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Como Funciona', href: '#faq' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Usinas', href: '#usinas' },
  { label: 'Contato', href: '#contato' },
];

export const SOCIAL_LINKS = [
  { Icon: Instagram, href: 'https://instagram.com/solara', label: 'Instagram' },
  { Icon: Linkedin, href: 'https://linkedin.com/company/solara', label: 'Linkedin' },
  { Icon: Facebook, href: '#', label: 'Facebook' },
];

export const LEGAL_LINKS = [
  { label: 'Termos de Uso', href: '/termos-de-uso' },
  { label: 'Políticas de Privacidade', href: '/privacidade' },
  { label: 'Cookies', href: '/cookies' },
];

export const HEADER_MENU_ITEMS = [
  { name: 'Início', href: '/#inicio' },
  { name: 'Nossas Usinas', href: '/#usinas' },
  { name: 'Sobre Nós', href: '/sobre' },
  { name: 'Simulador', href: '/simulador-economia' },
];