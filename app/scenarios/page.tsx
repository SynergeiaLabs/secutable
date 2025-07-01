import ProtectedRoute from '@/components/ProtectedRoute';
import ScenarioList from '../components/ScenarioList';

export default function ScenariosPage() {
  return (
    <ProtectedRoute>
      <ScenarioList />
    </ProtectedRoute>
  );
} 