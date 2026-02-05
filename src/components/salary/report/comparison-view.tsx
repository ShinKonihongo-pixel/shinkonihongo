// Comparison view placeholder for future charts

export function ComparisonView() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '40px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
      <h4 style={{ margin: '0 0 8px 0' }}>So sánh theo tháng</h4>
      <p style={{ color: '#999', margin: 0 }}>
        Tính năng so sánh lương theo tháng sẽ được cập nhật trong phiên bản tiếp theo.
      </p>
    </div>
  );
}
