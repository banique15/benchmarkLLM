import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './components/Dashboard';
import BenchmarkCreator from './components/benchmark/BenchmarkCreator';
import BenchmarkRunner from './components/benchmark/BenchmarkRunner';
import ResultsViewer from './components/results/ResultsViewer';
import ResultDetails from './components/results/ResultDetails';
import Settings from './components/settings/Settings';
import NotFound from './components/common/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="benchmarks">
          <Route index element={<Navigate to="/benchmarks/create" replace />} />
          <Route path="create" element={<BenchmarkCreator />} />
          <Route path="run/:id" element={<BenchmarkRunner />} />
        </Route>
        <Route path="results">
          <Route index element={<ResultsViewer />} />
          <Route path=":id" element={<ResultDetails />} />
        </Route>
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;