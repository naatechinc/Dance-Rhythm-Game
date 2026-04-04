import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SearchScreen from './screens/SearchScreen';
import PlayerScreen from './screens/PlayerScreen';
import PairingScreen from './screens/PairingScreen';
import ResultsScreen from './screens/ResultsScreen';
import ControllerScreen from './screens/ControllerScreen';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/search" replace />} />
      <Route path="/search" element={<SearchScreen />} />
      <Route path="/play/:sessionId" element={<PlayerScreen />} />
      <Route path="/pair/:sessionId" element={<PairingScreen />} />
      <Route path="/results/:sessionId" element={<ResultsScreen />} />
      <Route path="/controller/:sessionId" element={<ControllerScreen />} />
    </Routes>
  );
}
