// Branch information footer

import type { Branch } from '../../../types/branch';

interface BranchFooterProps {
  branch?: Branch;
}

export function BranchFooter({ branch }: BranchFooterProps) {
  if (!branch) return null;

  return (
    <div style={{
      marginTop: '24px',
      padding: '16px',
      background: '#f9f9f9',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: '#666',
    }}>
      <div>
        <strong>{branch.name}</strong>
        {branch.address && ` • ${branch.address}`}
      </div>
      <div>
        Báo cáo tạo ngày: {new Date().toLocaleDateString('vi-VN')}
      </div>
    </div>
  );
}
