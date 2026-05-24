/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { RulesAdmin } from './components/RulesAdmin';
import { Playground } from './components/Playground';

export default function App() {
  const [tab, setTab] = useState('dashboard');

  return (
    <Layout currentTab={tab} setTab={setTab}>
       {tab === 'dashboard' && <Dashboard />}
       {tab === 'rules' && <RulesAdmin />}
       {tab === 'playground' && <Playground />}
    </Layout>
  );
}
