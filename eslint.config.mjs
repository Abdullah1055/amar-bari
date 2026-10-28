import next from 'eslint-config-next';

const config = [...next, { ignores: ['.next/**', 'node_modules/**', 'supabase/**'] }];
export default config;
