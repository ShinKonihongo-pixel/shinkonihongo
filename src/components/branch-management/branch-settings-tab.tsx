// Branch Settings Tab - Branch status control and danger zone actions

import type { BranchSettingsTabProps } from './branch-management-types';

export function BranchSettingsTab({ branch, onToggleStatus, onDelete }: BranchSettingsTabProps) {
  return (
    <div className="tab-content-settings">
      <div className="card">
        <h3>Cài đặt chi nhánh</h3>
        <div className="settings-list">
          {/* Status toggle */}
          <div className="setting-item">
            <div className="setting-info">
              <strong>Trạng thái hoạt động</strong>
              <p>Tạm ngưng hoặc kích hoạt chi nhánh</p>
            </div>
            <button
              className={`btn ${branch.status === 'active' ? 'btn-warning' : 'btn-success'}`}
              onClick={onToggleStatus}
            >
              {branch.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
            </button>
          </div>

          {/* Delete branch - danger zone */}
          <div className="setting-item danger">
            <div className="setting-info">
              <strong>Xóa chi nhánh</strong>
              <p>Xóa vĩnh viễn chi nhánh và tất cả dữ liệu</p>
            </div>
            <button className="btn btn-danger" onClick={onDelete}>
              Xóa chi nhánh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
