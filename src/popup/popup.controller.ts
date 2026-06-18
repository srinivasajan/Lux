import { ApplicationService } from '../features/tracker/application.service';
import { CsvExportService } from '../features/tracker/csv.export';
import { ApplicationStatus, type Application } from '../core/types/application';

export class PopupController {
  private allApplications: Application[] = [];

  async loadApplications(): Promise<Application[]> {
    this.allApplications = await ApplicationService.listApplications();
    return this.allApplications;
  }

  filterApplications(searchTerm: string, statusFilter: string): Application[] {
    const term = searchTerm.toLowerCase();
    return this.allApplications.filter(app => {
      const matchesSearch = app.company.toLowerCase().includes(term) || app.role.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  async updateStatus(id: number, newStatus: ApplicationStatus): Promise<void> {
    await ApplicationService.updateApplication(id, { status: newStatus });
    // Update local cache
    const app = this.allApplications.find(a => a.id === id);
    if (app) {
      app.status = newStatus;
    }
  }

  async deleteApplication(id: number): Promise<void> {
    await ApplicationService.deleteApplication(id);
    this.allApplications = this.allApplications.filter(a => a.id !== id);
  }

  exportCsv(filteredList: Application[]): void {
    const csv = CsvExportService.generateCsv(filteredList);
    CsvExportService.downloadCsv(csv);
  }

  openOptions(): void {
    chrome.runtime.openOptionsPage();
  }

  openJob(url: string): void {
    window.open(url, '_blank');
  }
}
