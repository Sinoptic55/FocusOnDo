/**
 * AuthStore for managing user session and authentication state
 */

import type { User } from './models';
import { storage } from './utils';

export type AuthListener = (isAuthenticated: boolean, user: User | null) => void;

export class AuthStore {
  private static instance: AuthStore;
  private user: User | null = null;
  private authenticated: boolean = false;
  private listeners: AuthListener[] = [];

  private constructor() {
    this.authenticated = storage.get<boolean>('authenticated', false);
    this.user = storage.get<User | null>('user', null);
  }

  public static getInstance(): AuthStore {
    if (!AuthStore.instance) {
      AuthStore.instance = new AuthStore();
    }
    return AuthStore.instance;
  }

  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  public getUser(): User | null {
    return this.user;
  }

  public setAuth(isAuthenticated: boolean, user: User | null = null): void {
    this.authenticated = isAuthenticated;
    this.user = user;
    
    storage.set('authenticated', isAuthenticated);
    storage.set('user', user);
    
    this.notify();
  }

  public clear(): void {
    this.authenticated = false;
    this.user = null;
    storage.remove('authenticated');
    storage.remove('user');
    this.notify();
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.authenticated, this.user);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.authenticated, this.user));
  }
}

export const authStore = AuthStore.getInstance();
