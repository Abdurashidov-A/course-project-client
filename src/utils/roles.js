export const ROLES = {
  CANDIDATE: "CANDIDATE",
  RECRUITER: "RECRUITER",
  ADMIN: "ADMIN",
};

function getRoleNames(user) {
  if (!Array.isArray(user?.roles)) {
    return [];
  }

  return user.roles
    .map((role) => {
      if (typeof role === "string") {
        return role;
      }

      if (typeof role?.name === "string") {
        return role.name;
      }

      return null;
    })
    .filter(Boolean);
}

export function hasRole(user, role) {
  return getRoleNames(user).includes(role);
}

export function isCandidate(user) {
  return Boolean(hasRole(user, ROLES.CANDIDATE));
}

export function isRecruiter(user) {
  return Boolean(hasRole(user, ROLES.RECRUITER));
}

export function isAdmin(user) {
  return Boolean(hasRole(user, ROLES.ADMIN));
}

export function canManageLibrary(user) {
  return Boolean(isRecruiter(user) || isAdmin(user));
}

export function canManagePositions(user) {
  return Boolean(isRecruiter(user) || isAdmin(user));
}

export function canCreateCv(user) {
  return Boolean(isCandidate(user));
}

export function canViewPublishedCvs(user) {
  return Boolean(isRecruiter(user) || isAdmin(user));
}

export function canManageUsers(user) {
  return Boolean(isAdmin(user));
}
