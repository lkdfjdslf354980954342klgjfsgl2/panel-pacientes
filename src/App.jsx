import PacienteList from './PacienteList.jsx';

/**
 * App.jsx
 * Componente raíz. Delegá toda la lógica a PacienteList para mantener limpia la arquitectura.
 */
export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F4EE',
        padding: '0',
        margin: '0',
      }}
    >
      <PacienteList />
    </div>
  );
}