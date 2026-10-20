import { afterEach } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// Read by helpers/env.helpers.js when it is first imported: the API base must be absolute for fetch in Node
globalThis.admin_ui_config = { vite_server_url: 'http://localhost/api/v2' };

afterEach(cleanup);
