import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './components/Dashboard';
import BenchmarkTypeSelector from './components/benchmark/BenchmarkTypeSelector';
import BenchmarkCreator from './components/benchmark/BenchmarkCreator';
import AdvancedBenchmark from './components/benchmark/AdvancedBenchmark';
import BenchmarkRunner from './components/benchmark/BenchmarkRunner';
import ResultsViewer from './components/results/ResultsViewer';
import ResultDetails from './components/results/ResultDetails';
import Settings from './components/settings/Settings';
import NotFound from './components/common/NotFound';

// Ollama benchmark components
import OllamaBenchmark from './components/ollama/OllamaBenchmark';
import OllamaBenchmarkCreator from './components/ollama/OllamaBenchmarkCreator';
import OllamaBenchmarkRunner from './components/ollama/OllamaBenchmarkRunner';
import OllamaBenchmarkResults from './components/ollama/OllamaBenchmarkResults';
import OllamaBenchmarkList from './components/ollama/OllamaBenchmarkList';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="benchmarks">
          <Route index element={<BenchmarkTypeSelector />} />
          <Route path="basic/create" element={<BenchmarkCreator />} />
          <Route path="advanced/create" element={<AdvancedBenchmark />} />
          <Route path="run/:id" element={<BenchmarkRunner />} />
        </Route>
        <Route path="results">
          <Route index element={<ResultsViewer />} />
          <Route path=":id" element={<ResultDetails />} />
        </Route>
        <Route path="ollama" element={<OllamaBenchmark />}>
          <Route index element={<OllamaBenchmarkList />} />
          <Route path="create" element={<OllamaBenchmarkCreator />} />
          <Route path="run/:id" element={<OllamaBenchmarkRunner />} />
          <Route path="results/:id" element={<OllamaBenchmarkResults />} />
          <Route path="benchmarks" element={<OllamaBenchmarkList />} />
        </Route>
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;