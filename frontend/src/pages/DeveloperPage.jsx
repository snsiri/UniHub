import React from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import AIDeveloperPanel from '../components/ai/AIDeveloperPanel';

const DeveloperPage = () => {
  const { user } = useAuth();
  if (user?.role !== 'developer') return (
    <MainLayout>
      <div className="error-state">
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
        <p>Developer access required.</p>
      </div>
    </MainLayout>
  );
  return <MainLayout><AIDeveloperPanel /></MainLayout>;
};
export default DeveloperPage;
