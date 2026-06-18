import { PopupController } from './popup.controller';
import { ApplicationStatus, type Application } from '../core/types/application';

document.addEventListener('DOMContentLoaded', async () => {
  const controller = new PopupController();
  
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
  const exportBtn = document.getElementById('btn-export') as HTMLButtonElement;
  const tableBody = document.getElementById('table-body') as HTMLTableSectionElement;
  const emptyState = document.getElementById('empty-state') as HTMLDivElement;
  const metricTotal = document.getElementById('metric-total') as HTMLSpanElement;
  const linkOptions = document.getElementById('link-options') as HTMLAnchorElement;

  let currentDisplayedApps: Application[] = [];

  function renderTable(apps: Application[]) {
    currentDisplayedApps = apps;
    tableBody.innerHTML = '';
    metricTotal.textContent = `Total: ${apps.length}`;

    if (apps.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    apps.forEach(app => {
      const tr = document.createElement('tr');

      const statusOptions = Object.values(ApplicationStatus).map(status => 
        `<option value="${status}" ${app.status === status ? 'selected' : ''}>${status}</option>`
      ).join('');

      tr.innerHTML = `
        <td><strong>${app.company}</strong></td>
        <td>${app.role}</td>
        <td>
          <select class="status-select" data-id="${app.id}">
            ${statusOptions}
          </select>
        </td>
        <td>${new Date(app.appliedAt).toLocaleDateString()}</td>
        <td>
          <button class="action-btn view" data-url="${app.jobUrl}">View</button>
          <button class="action-btn delete" data-id="${app.id}">Delete</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });
  }

  function applyFilters() {
    const filtered = controller.filterApplications(searchInput.value, statusFilter.value);
    renderTable(filtered);
  }

  // Load Initial Data
  const apps = await controller.loadApplications();
  renderTable(apps);

  // Event Listeners
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  exportBtn.addEventListener('click', () => {
    controller.exportCsv(currentDisplayedApps);
  });

  linkOptions.addEventListener('click', (e) => {
    e.preventDefault();
    controller.openOptions();
  });

  // Table Event Delegation (Status change, View, Delete)
  tableBody.addEventListener('change', async (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('status-select')) {
      const select = target as HTMLSelectElement;
      const id = Number(select.dataset.id);
      const newStatus = select.value as ApplicationStatus;
      await controller.updateStatus(id, newStatus);
    }
  });

  tableBody.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    
    if (target.classList.contains('view')) {
      const url = target.dataset.url;
      if (url) controller.openJob(url);
    }

    if (target.classList.contains('delete')) {
      const id = Number(target.dataset.id);
      if (confirm('Are you sure you want to delete this application?')) {
        await controller.deleteApplication(id);
        applyFilters();
      }
    }
  });
});
