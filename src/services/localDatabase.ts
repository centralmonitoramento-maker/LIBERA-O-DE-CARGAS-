// Local Reactive Database & Auth Service for CargaRadar
// Replaces external Firebase dependencies with high-performance, resilient local storage persistence and reactive events.

import { CargoLoad, User, EventLog, SystemRole, OccurrenceType, CargoStatus } from '../types';

const STORAGE_KEYS = {
  LOADS: 'cargoradar_loads',
  USERS: 'cargoradar_users',
  LOGS: 'cargoradar_logs',
  SETTINGS: 'cargoradar_settings',
  FEEDBACKS: 'cargoradar_feedbacks',
  CURRENT_USER: 'cargoradar_current_user',
};

// Default seed users if none exist in localStorage
const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin_01',
    username: 'admin',
    password: '123',
    fullName: 'Administrador Geral',
    role: 'audit',
    systemRole: 'administrator',
    status: 'active',
    storeLocation: 'CD-01 - Centro de Distribuição 01',
    jobFunction: 'Gestor de Segurança e Auditoria',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_supervisor_01',
    username: 'supervisor',
    password: '123',
    fullName: 'Carlos Mendes',
    role: 'supervisor_cd',
    systemRole: 'supervisor_cd',
    status: 'active',
    storeLocation: 'CD-01 - Centro de Distribuição 01',
    jobFunction: 'Supervisor Operacional CD',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_portaria_01',
    username: 'portaria',
    password: '123',
    fullName: 'Marcos Vinícius Silva',
    role: 'portaria',
    status: 'active',
    storeLocation: 'CD-01 - Centro de Distribuição 01',
    jobFunction: 'Fiscal de Portaria / Gate',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_expedicao_01',
    username: 'expedicao',
    password: '123',
    fullName: 'Roberto Albuquerque',
    role: 'expedition',
    status: 'active',
    storeLocation: 'CD-01 - Centro de Distribuição 01',
    jobFunction: 'Conferente Líder de Expedição',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_auditor_01',
    username: 'auditor',
    password: '123',
    fullName: 'Fernanda Rocha',
    role: 'audit',
    systemRole: 'auditor',
    status: 'active',
    storeLocation: 'CD-01 - Centro de Distribuição 01',
    jobFunction: 'Auditora de Cargas',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_central_01',
    username: 'central',
    password: '123',
    fullName: 'Central de Monitoramento',
    role: 'central',
    status: 'active',
    storeLocation: 'CD-01 - Centro de Distribuição 01',
    jobFunction: 'Operador de Torre',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_loja_01',
    username: 'loja1001',
    password: '123',
    fullName: 'Ceilândia 1001 - Apoio',
    role: 'store_app',
    systemRole: 'store_app',
    status: 'active',
    storeLocation: '1001 - Ceilândia',
    jobFunction: 'Operador App Loja',
    createdAt: new Date().toISOString()
  }
];

// Helper to normalize strings for comparison
export function normalizeStr(str?: string): string {
  if (!str) return '';
  return str.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Generate unique ID safely
export function generateLocalId(): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

class LocalDatabase {
  private listeners: { [key: string]: Set<(data: any) => void> } = {
    loads: new Set(),
    users: new Set(),
    logs: new Set(),
    settings: new Set(),
    feedbacks: new Set()
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSeedData();
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEYS.LOADS) this.notify('loads', this.getLoads());
        if (event.key === STORAGE_KEYS.USERS) this.notify('users', this.getUsers());
        if (event.key === STORAGE_KEYS.LOGS) this.notify('logs', this.getLogs());
        if (event.key === STORAGE_KEYS.SETTINGS) this.notify('settings', this.getSettings());
        if (event.key === STORAGE_KEYS.FEEDBACKS) this.notify('feedbacks', this.getFeedbacks());
      });
    }
  }

  private initSeedData() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!storedUsers || JSON.parse(storedUsers).length === 0) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      } else {
        // Ensure default accounts exist if missing
        const parsed: User[] = JSON.parse(storedUsers);
        let updated = false;
        DEFAULT_USERS.forEach(def => {
          if (!parsed.some(u => normalizeStr(u.username) === normalizeStr(def.username))) {
            parsed.push(def);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
        }
      }

      if (!localStorage.getItem(STORAGE_KEYS.LOADS)) {
        localStorage.setItem(STORAGE_KEYS.LOADS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) {
        localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
          occurrenceAlertEmails: ['central.monitoramento@atacadaodiaadia.com.br'],
          yardSlaTargetHours: 2.5
        }));
      }
    } catch (err) {
      console.warn('Erro ao inicializar semente local:', err);
    }
  }

  private notify(type: string, data: any) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Erro no listener de ${type}:`, e);
        }
      });
    }
    // Dispatch custom window event for reactive multi-component sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`cargoradar_${type}_updated`, { detail: data }));
    }
  }

  // --- LOADS API ---
  getLoads(): CargoLoad[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOADS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveLoad(load: CargoLoad): CargoLoad {
    const loads = this.getLoads();
    const existingIndex = loads.findIndex(l => l.id === load.id);
    if (existingIndex >= 0) {
      loads[existingIndex] = { ...loads[existingIndex], ...load };
    } else {
      loads.unshift(load);
    }
    localStorage.setItem(STORAGE_KEYS.LOADS, JSON.stringify(loads));
    this.notify('loads', loads);
    return load;
  }

  saveLoads(newLoads: CargoLoad[]) {
    localStorage.setItem(STORAGE_KEYS.LOADS, JSON.stringify(newLoads));
    this.notify('loads', newLoads);
  }

  deleteLoad(loadId: string) {
    const loads = this.getLoads().filter(l => l.id !== loadId);
    localStorage.setItem(STORAGE_KEYS.LOADS, JSON.stringify(loads));
    this.notify('loads', loads);
  }

  // Remove an individual record (either load or audit occurrence/log)
  deleteRecordById(id: string, type: 'carga' | 'audit'): boolean {
    if (type === 'carga') {
      const loads = this.getLoads();
      const load = loads.find(l => l.id === id);
      if (load) {
        const filtered = loads.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEYS.LOADS, JSON.stringify(filtered));
        this.notify('loads', filtered);
        this.addLog('Exclusão de Carga', `Registro da carga ${load.plate} excluído permanentemente pelo Administrador Master`, 'Administrador Master', id);
        return true;
      }
      return false;
    }

    if (type === 'audit') {
      // 1. Check if it matches an EventLog
      const logs = this.getLogs();
      const logIndex = logs.findIndex(l => l.id === id);
      if (logIndex >= 0) {
        const deletedLog = logs[logIndex];
        const filteredLogs = logs.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(filteredLogs));
        this.notify('logs', filteredLogs);
        return true;
      }

      // 2. Check if it matches a CargoLoad in loads (audited record)
      const loads = this.getLoads();
      const load = loads.find(l => l.id === id);
      if (load) {
        const filtered = loads.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEYS.LOADS, JSON.stringify(filtered));
        this.notify('loads', filtered);
        this.addLog('Exclusão de Registro Auditado', `Registro auditado da carga ${load.plate} excluído pelo Administrador Master`, 'Administrador Master', id);
        return true;
      }
    }

    return false;
  }

  // Clear all operational loads, audit history and logs while preserving users and settings
  clearAllSystemData() {
    localStorage.setItem(STORAGE_KEYS.LOADS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify([]));
    this.notify('loads', []);
    this.notify('logs', []);
    this.notify('feedbacks', []);
    this.addLog('Limpeza de Dados', 'Histórico operacional de cargas e logs completamente zerado pelo Administrador Master', 'Administrador Master');
  }

  subscribeLoads(callback: (loads: CargoLoad[]) => void): () => void {
    this.listeners.loads.add(callback);
    callback(this.getLoads());
    return () => this.listeners.loads.delete(callback);
  }

  // --- USERS API ---
  getUsers(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      return raw ? JSON.parse(raw) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }

  saveUser(user: User): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify('users', users);
    return user;
  }

  updateUser(userId: string, partial: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index >= 0) {
      users[index] = { ...users[index], ...partial };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notify('users', users);
      return users[index];
    }
    return null;
  }

  deleteUser(userId: string) {
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify('users', users);
  }

  subscribeUsers(callback: (users: User[]) => void): () => void {
    this.listeners.users.add(callback);
    callback(this.getUsers());
    return () => this.listeners.users.delete(callback);
  }

  // --- LOGS API ---
  getLogs(): EventLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  addLog(action: string, details: string, username: string = 'Sistema', loadId?: string, userId?: string): EventLog {
    const logs = this.getLogs();
    const newLog: EventLog = {
      id: generateLocalId(),
      timestamp: new Date().toISOString(),
      action,
      details,
      username,
      loadId,
      userId
    };
    logs.unshift(newLog);
    // Keep max 500 logs in memory
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
    this.notify('logs', trimmed);
    return newLog;
  }

  subscribeLogs(callback: (logs: EventLog[]) => void): () => void {
    this.listeners.logs.add(callback);
    callback(this.getLogs());
    return () => this.listeners.logs.delete(callback);
  }

  // --- SETTINGS API ---
  getSettings(): Record<string, any> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  saveSettings(settings: Record<string, any>) {
    const current = this.getSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    this.notify('settings', merged);
  }

  subscribeSettings(callback: (settings: Record<string, any>) => void): () => void {
    this.listeners.settings.add(callback);
    callback(this.getSettings());
    return () => this.listeners.settings.delete(callback);
  }

  // --- FEEDBACKS API ---
  getFeedbacks(): any[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveFeedback(msg: any): any {
    const list = this.getFeedbacks();
    list.push(msg);
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(list));
    this.notify('feedbacks', list);
    return msg;
  }

  subscribeFeedbacks(callback: (feedbacks: any[]) => void): () => void {
    this.listeners.feedbacks.add(callback);
    callback(this.getFeedbacks());
    return () => this.listeners.feedbacks.delete(callback);
  }

  // --- AUTH SERVICE ---
  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cargoradar_auth_changed', { detail: user }));
    }
  }

  login(usernameOrEmail: string, pass: string): { user?: User; error?: string } {
    const users = this.getUsers();
    const cleanInput = normalizeStr(usernameOrEmail);

    const user = users.find(u => {
      const uName = normalizeStr(u.username);
      const uEmail = u.username.includes('@') ? normalizeStr(u.username) : '';
      return uName === cleanInput || uEmail === cleanInput;
    });

    if (!user) {
      return { error: `Usuário "${usernameOrEmail}" não encontrado no sistema.` };
    }

    if (user.password && user.password !== pass) {
      return { error: 'Senha incorreta. Verifique suas credenciais.' };
    }

    if (user.status === 'pending') {
      return { error: 'Seu cadastro está pendente de aprovação pela Auditoria / Supervisão.' };
    }

    if (user.status === 'rejected') {
      return { error: 'Seu cadastro foi recusado pela Auditoria / Supervisão.' };
    }

    this.setCurrentUser(user);
    this.addLog('Login no Sistema', `Usuário ${user.username} iniciou sessão com perfil ${user.role}`, user.username, undefined, user.id);
    return { user };
  }

  register(userData: Omit<User, 'id' | 'createdAt' | 'status'> & { status?: 'pending' | 'active' }): { user?: User; error?: string } {
    const users = this.getUsers();
    const cleanInput = normalizeStr(userData.username);

    if (users.some(u => normalizeStr(u.username) === cleanInput)) {
      return { error: 'Este nome de usuário já está cadastrado no sistema.' };
    }

    const newUser: User = {
      id: generateLocalId(),
      ...userData,
      status: userData.status || 'pending',
      createdAt: new Date().toISOString()
    };

    this.saveUser(newUser);
    this.addLog('Solicitação de Cadastro', `Novo usuário ${newUser.username} solicitou acesso como ${newUser.role}`, newUser.username, undefined, newUser.id);
    return { user: newUser };
  }

  logout() {
    const current = this.getCurrentUser();
    if (current) {
      this.addLog('Logout do Sistema', `Usuário ${current.username} encerrou a sessão`, current.username, undefined, current.id);
    }
    this.setCurrentUser(null);
  }
}

export const localDb = new LocalDatabase();
export const sanitizeLocalData = <T extends Record<string, any>>(data: T): T => data;
