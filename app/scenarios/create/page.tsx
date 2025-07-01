import ProtectedRoute from '@/components/ProtectedRoute';
import ScenarioCreator from '../../components/ScenarioCreator';

export default function CreateScenarioPage() {
  return (
    <ProtectedRoute>
      <ScenarioCreator />
    </ProtectedRoute>
  );
} 