// User profile and configuration management

export type TipoPerfil = 'trabalhador' | 'rh';

export interface UserData {
  tipo: TipoPerfil;
  nome?: string;
  email?: string;
  empresa?: string;
  cnpj?: string;
}

const STORAGE_KEY = 'app_first_open_done';
const USER_KEY = 'app_user_data';

export function hasSeenFirstOpen(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markFirstOpenDone(): void {
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function getLocalUser(): UserData | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    // Migration: old format without tipo
    if (parsed && !parsed.tipo) {
      parsed.tipo = 'trabalhador';
      localStorage.setItem(USER_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalUser(user: UserData): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  markFirstOpenDone();
}

export function isModoRH(): boolean {
  const user = getLocalUser();
  return user?.tipo === 'rh';
}

export function getNomeEmpresa(): string {
  const user = getLocalUser();
  return user?.empresa || '';
}

// CNPJ validation (Brazilian company tax ID)
export function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  
  // Check for all same digits
  if (/^(\d)\1{13}$/.test(nums)) return false;
  
  // Validate check digits
  const calc = (digits: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const d1 = calc(nums, w1);
  if (parseInt(nums[12]) !== d1) return false;
  
  const d2 = calc(nums, w2);
  if (parseInt(nums[13]) !== d2) return false;
  
  return true;
}

export function formatarCNPJ(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 14);
  if (nums.length <= 2) return nums;
  if (nums.length <= 5) return `${nums.slice(0, 2)}.${nums.slice(2)}`;
  if (nums.length <= 8) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
  if (nums.length <= 12) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
  return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`;
}
