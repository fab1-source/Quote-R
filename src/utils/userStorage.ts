import { UserAccount, UserRole } from '../types';

const USERS_STORAGE_KEY = 'interglass_portal_users';
const CURRENT_USER_KEY = 'interglass_portal_current_user';

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-hod',
    username: 'HOD',
    password: 'ADMIN1',
    role: 'ADMIN',
    isActive: true,
    name: 'Head of Department (ADMIN)',
    createdAt: '2026-01-01',
  },
  {
    id: 'user-estimator1',
    username: 'ESTIMATOR1',
    password: 'ESTM1',
    role: 'ESTIMATION',
    isActive: true,
    name: 'Estimation Team (ESTIMATOR1)',
    createdAt: '2026-01-01',
  },
  {
    id: 'user-factory1',
    username: 'FACTORY1',
    password: 'PROD1',
    role: 'PRODUCTION',
    isActive: true,
    name: 'Production & Factory Team (FACTORY1)',
    createdAt: '2026-01-01',
  },
];

/**
 * Retrieves all registered users from storage, seeding default users if not initialized.
 */
export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }

    // Ensure all 3 required default users exist
    let modified = false;
    const usersList: UserAccount[] = [...parsed];
    for (const defUser of DEFAULT_USERS) {
      const exists = usersList.find(
        (u) => u.username.toUpperCase() === defUser.username.toUpperCase()
      );
      if (!exists) {
        usersList.push(defUser);
        modified = true;
      }
    }

    if (modified) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
    }

    return usersList;
  } catch (err) {
    console.error('Failed to load users from storage:', err);
    return DEFAULT_USERS;
  }
}

/**
 * Saves users list to localStorage.
 */
export function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

/**
 * Gets currently logged in user session.
 */
export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const user: UserAccount = JSON.parse(raw);
    // Validate that user still exists in current user registry and is active
    const allUsers = getUsers();
    const matched = allUsers.find(
      (u) => u.id === user.id || u.username.toUpperCase() === user.username.toUpperCase()
    );
    if (!matched || !matched.isActive) {
      // Clear invalid/deactivated session
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    return matched;
  } catch (err) {
    console.error('Failed to get current user:', err);
    return null;
  }
}

/**
 * Sets or clears currently logged in user session.
 */
export function setCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
}

/**
 * Logs out the current user by clearing the session.
 */
export function logoutUser(): void {
  setCurrentUser(null);
}

/**
 * Authenticates user credentials.
 */
export function authenticateUser(
  usernameInput: string,
  passwordInput: string
): { success: boolean; user?: UserAccount; error?: string } {
  const trimmedUsername = usernameInput.trim();
  const trimmedPassword = passwordInput.trim();

  if (!trimmedUsername || !trimmedPassword) {
    return { success: false, error: 'Please enter both Username and Password.' };
  }

  const allUsers = getUsers();
  const matched = allUsers.find(
    (u) => u.username.toUpperCase() === trimmedUsername.toUpperCase()
  );

  if (!matched) {
    return { success: false, error: 'Invalid username. Please check your credentials.' };
  }

  if (matched.password !== trimmedPassword) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  if (!matched.isActive) {
    return {
      success: false,
      error: 'This account has been deactivated. Please contact an Administrator (HOD).',
    };
  }

  // Update session
  setCurrentUser(matched);
  return { success: true, user: matched };
}

/**
 * Adds a new user account.
 */
export function addUser(data: {
  username: string;
  password: string;
  role: UserRole;
  name?: string;
}): { success: boolean; error?: string; user?: UserAccount } {
  const username = data.username.trim();
  const password = data.password.trim();

  if (!username) {
    return { success: false, error: 'Username cannot be blank.' };
  }
  if (!password) {
    return { success: false, error: 'Password cannot be blank.' };
  }

  const allUsers = getUsers();
  const exists = allUsers.some(
    (u) => u.username.toUpperCase() === username.toUpperCase()
  );
  if (exists) {
    return { success: false, error: `A user with username "${username}" already exists.` };
  }

  const newUser: UserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    username,
    password,
    role: data.role,
    isActive: true,
    name: data.name?.trim() || `${username} (${data.role})`,
    createdAt: new Date().toISOString().split('T')[0],
  };

  allUsers.push(newUser);
  saveUsers(allUsers);
  return { success: true, user: newUser };
}

/**
 * Updates an existing user's password.
 */
export function updateUserPassword(
  userId: string,
  newPassword: string
): { success: boolean; error?: string } {
  const trimmed = newPassword.trim();
  if (!trimmed) {
    return { success: false, error: 'Password cannot be empty.' };
  }

  const allUsers = getUsers();
  const index = allUsers.findIndex((u) => u.id === userId);
  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  allUsers[index].password = trimmed;
  saveUsers(allUsers);

  // If this is currently logged in user, refresh session
  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(allUsers[index]);
  }

  return { success: true };
}

/**
 * Toggles a user's active/inactive status.
 * Prevents a user from deactivating their own account.
 */
export function toggleUserStatus(
  targetUserId: string,
  currentUserId: string
): { success: boolean; error?: string; newStatus?: boolean } {
  if (targetUserId === currentUserId) {
    return { success: false, error: 'Security restriction: You cannot deactivate your own user account.' };
  }

  const allUsers = getUsers();
  const index = allUsers.findIndex((u) => u.id === targetUserId);
  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  allUsers[index].isActive = !allUsers[index].isActive;
  saveUsers(allUsers);

  return { success: true, newStatus: allUsers[index].isActive };
}

/**
 * Updates a user's role.
 */
export function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  currentUserId: string
): { success: boolean; error?: string } {
  const allUsers = getUsers();
  const index = allUsers.findIndex((u) => u.id === targetUserId);
  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  allUsers[index].role = newRole;
  saveUsers(allUsers);

  if (targetUserId === currentUserId) {
    setCurrentUser(allUsers[index]);
  }

  return { success: true };
}

/**
 * Deletes a user account.
 */
export function deleteUser(
  targetUserId: string,
  currentUserId: string
): { success: boolean; error?: string } {
  if (targetUserId === currentUserId) {
    return { success: false, error: 'Security restriction: You cannot delete your own account.' };
  }

  const allUsers = getUsers();
  const filtered = allUsers.filter((u) => u.id !== targetUserId);
  if (filtered.length === allUsers.length) {
    return { success: false, error: 'User not found.' };
  }

  saveUsers(filtered);
  return { success: true };
}
