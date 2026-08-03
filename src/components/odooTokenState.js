export function createInitialOdooTokenState() {
  return {
    token: null,
    rawToken: null,
    hasLoadedToken: false,
    loadError: null,
    pendingAction: null,
  };
}

export function odooTokenReducer(state, action) {
  switch (action.type) {
    case "REQUEST_START":
      return {
        ...state,
        rawToken: null,
        loadError: null,
        pendingAction: action.actionName,
      };
    case "LOAD_SUCCESS":
      return {
        ...state,
        token: action.token,
        hasLoadedToken: true,
        loadError: null,
        pendingAction: null,
      };
    case "MUTATION_SUCCESS":
      return {
        ...state,
        token: action.token,
        rawToken: action.rawToken,
        hasLoadedToken: true,
        loadError: null,
        pendingAction: null,
      };
    case "LOAD_ERROR":
      return {
        ...state,
        token: null,
        rawToken: null,
        hasLoadedToken: false,
        loadError: action.message,
        pendingAction: null,
      };
    case "REQUEST_ERROR":
      return {
        ...state,
        rawToken: null,
        pendingAction: null,
      };
    case "CLOSE":
      return createInitialOdooTokenState();
    default:
      return state;
  }
}
