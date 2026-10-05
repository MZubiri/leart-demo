const isLocalNgServe = typeof window !== 'undefined' && window.location.port === '4200';

export const environment = {
  production: !isLocalNgServe,
  apiUrl: isLocalNgServe ? 'http://localhost:5000/api' : '/api',
};
