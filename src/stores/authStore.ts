import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Default users
const defaultUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@whatsapp-api.com',
    role: 'admin',
    avatar: '',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true
  },
  {
    id: '2',
    username: 'operator',
    email: 'operator@whatsapp-api.com',
    role: 'operator',
    avatar: '',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: '3',
    username: 'viewer',
    email: 'viewer@whatsapp-api.com',
    role: 'viewer',
    avatar: '',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true
  }
];

// Default passwords (in real app, would be hashed)
const defaultCredentials = {
  admin: 'admin123',
  operator: 'operator123',
  viewer: 'viewer123'
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string): Promise<boolean> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check credentials
        const validPassword = defaultCredentials[username as keyof typeof defaultCredentials];
        if (validPassword && validPassword === password) {
          const user = defaultUsers.find(u => u.username === username);
          if (user) {
            const updatedUser = { ...user, lastLogin: new Date().toISOString() };
            set({ user: updatedUser, isAuthenticated: true });
            
            // Log activity
            const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
            logs.unshift({
              id: Date.now().toString(),
              type: 'login',
              message: `User ${username} logged in`,
              userId: user.id,
              timestamp: new Date().toISOString(),
              severity: 'info'
            });
            localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 1000)));
            
            return true;
          }
        }
        return false;
      },

      logout: () => {
        const user = get().user;
        if (user) {
          // Log activity
          const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
          logs.unshift({
            id: Date.now().toString(),
            type: 'logout',
            message: `User ${user.username} logged out`,
            userId: user.id,
            timestamp: new Date().toISOString(),
            severity: 'info'
          });
          localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 1000)));
        }
        
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);