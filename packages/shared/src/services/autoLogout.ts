import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { ConfirmationDialogService } from './confirmationDialog';

interface AutoLogoutConfig {
  attendantTimeout: number; // 1 hour in milliseconds
  accountantTimeout: number; // 30 minutes in milliseconds
  managerTimeout: number; // 30 minutes in milliseconds
  warningTime: number; // Time before logout to show warning
}

const CONFIG: AutoLogoutConfig = {
  attendantTimeout: 60 * 60 * 1000, // 1 hour
  accountantTimeout: 30 * 60 * 1000, // 30 minutes
  managerTimeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 5 * 60 * 1000, // 5 minutes
};

export class AutoLogoutService {
  private static instance: AutoLogoutService;
  private auth = getAuth();
  private db = getFirestore();
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private confirmationDialog = ConfirmationDialogService.getInstance();

  private constructor() {
    this.setupActivityListeners();
  }

  public static getInstance(): AutoLogoutService {
    if (!AutoLogoutService.instance) {
      AutoLogoutService.instance = new AutoLogoutService();
    }
    return AutoLogoutService.instance;
  }

  private setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, () => this.updateLastActivity());
    });
  }

  private updateLastActivity() {
    this.lastActivity = Date.now();
    // Clear any existing warning when activity is detected
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
  }

  public startAutoLogout(userRole: string) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }

    const timeout = this.getTimeoutForRole(userRole);
    const warningTime = timeout - CONFIG.warningTime;

    // Set warning timeout
    this.warningId = setTimeout(() => {
      this.showWarning();
    }, warningTime);

    // Set logout timeout
    this.timeoutId = setTimeout(() => {
      const idleTime = Date.now() - this.lastActivity;
      if (idleTime >= timeout) {
        this.handleLogout();
      }
    }, timeout);
  }

  private async showWarning() {
    const confirmed = await this.confirmationDialog.showConfirmation({
      title: 'Session Timeout Warning',
      message: 'Your session will expire in 5 minutes due to inactivity. Would you like to stay logged in?',
      confirmLabel: 'Stay Logged In',
      cancelLabel: 'Logout Now',
      severity: 'warning'
    });

    if (confirmed) {
      this.updateLastActivity();
      this.startAutoLogout(this.getCurrentUserRole());
    } else {
      this.handleLogout();
    }
  }

  private getCurrentUserRole(): string {
    const user = this.auth.currentUser;
    if (!user) return 'attendant';
    
    // Get user role from Firestore
    const userRef = doc(this.db, 'users', user.uid);
    return userRef.get().then(doc => doc.data()?.role || 'attendant');
  }

  private getTimeoutForRole(role: string): number {
    switch (role) {
      case 'attendant':
        return CONFIG.attendantTimeout;
      case 'accountant':
        return CONFIG.accountantTimeout;
      case 'manager':
        return CONFIG.managerTimeout;
      default:
        return CONFIG.attendantTimeout;
    }
  }

  private async handleLogout() {
    const user = this.auth.currentUser;
    if (user) {
      // Update user's last active timestamp
      const userRef = doc(this.db, 'users', user.uid);
      await updateDoc(userRef, {
        lastActive: new Date(),
        status: 'inactive'
      });

      // Sign out
      await signOut(this.auth);
    }
  }

  public stopAutoLogout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
  }
} 