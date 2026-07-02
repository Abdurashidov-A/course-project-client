export const ROLES = {
  CANDIDATE: "CANDIDATE",
  RECRUITER: "RECRUITER",
  ADMIN: "ADMIN",
};

export function hasRole(user, role) {
  return user?.roles?.includes(role);
}

export function isCandidate(user) {
  return hasRole(user, ROLES.CANDIDATE);
}

export function isRecruiter(user) {
  return hasRole(user, ROLES.RECRUITER);
}

export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}
