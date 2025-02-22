export const protectedResources = {
  api: {
    endpoint: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:7071/api'
      : "https://func-grady-dev.azurewebsites.net/api",
    scopes: process.env.NODE_ENV === 'development'
      ? []  // No scopes needed in development
      : ["api://c1182008-420a-4418-a2c1-eaf8fea8a225/user_impersonation"],
  },
};

// Request both Graph API and custom API scopes
export const loginRequest = {
  scopes: process.env.NODE_ENV === 'development'
    ? []  // No scopes needed in development
    : [
        "User.Read",
        "api://c1182008-420a-4418-a2c1-eaf8fea8a225/user_impersonation"
      ],
  prompt: "select_account"
};

export const msalConfig = {
  auth: {
    clientId: process.env.NODE_ENV === 'development'
      ? 'development'  // Dummy client ID for development
      : "c1182008-420a-4418-a2c1-eaf8fea8a225",
    authority: process.env.NODE_ENV === 'development'
      ? 'https://login.microsoftonline.com/common'  // Generic authority for development
      : "https://login.microsoftonline.com/28609860-e5ad-45f1-9ef7-9569113e5e06",
    redirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
  system: {
    allowNativeBroker: false,
    windowHashTimeout: 90000,
    iframeHashTimeout: 10000,
    loadFrameTimeout: 8000,
    asyncPopups: false,
    preventCorsPreflight: true
  }
};
