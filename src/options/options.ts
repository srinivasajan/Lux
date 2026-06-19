import { ProfileService } from '../features/profile/profile.service';
import { ResumeService } from '../features/resume/resume.service';
import { RendererFactory } from '../features/resume/renderers/renderer.factory';
import { generatePdf } from '../features/resume/pdf/pdf.service';
import { TailoringService } from '../features/resume/tailoring.service';
import { GeminiProvider } from '../core/api/ai.provider';
import { ChromeStorageService } from '../core/storage/chrome';
import { ZodError } from 'zod';
import type { Education, Experience, Project } from '../core/types/profile';
import type { Resume, ResumeSection, TemplateId } from '../core/types/resume';

// ── Profile Manager ────────────────────────────────────────────────────────

export async function initOptions(): Promise<void> {
  const form = document.getElementById('profile-form') as HTMLFormElement;
  const deleteBtn = document.getElementById('btn-delete') as HTMLButtonElement;
  const alertBox = document.getElementById('alert-box') as HTMLDivElement;

  const eduContainer = document.getElementById('education-container') as HTMLDivElement;
  const expContainer = document.getElementById('experience-container') as HTMLDivElement;
  const projContainer = document.getElementById('projects-container') as HTMLDivElement;

  function showAlert(message: string, type: 'success' | 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    setTimeout(() => {
      alertBox.className = 'alert hidden';
    }, 5000);
  }

  function addEducation(edu?: Partial<Education>) {
    const div = document.createElement('div');
    div.className = 'dynamic-entry';
    div.innerHTML = `
      <div class="dynamic-entry-header">
        <button type="button" class="btn btn-danger btn-sm btn-remove">Remove</button>
      </div>
      <div class="form-group">
        <label>Degree *</label>
        <input type="text" name="edu-degree" value="${edu?.degree || ''}" required>
      </div>
      <div class="form-group">
        <label>University *</label>
        <input type="text" name="edu-university" value="${edu?.university || ''}" required>
      </div>
      <div class="form-group">
        <label>CGPA</label>
        <input type="text" name="edu-cgpa" value="${edu?.cgpa || ''}">
      </div>
      <div class="form-group">
        <label>Graduation Year</label>
        <input type="text" name="edu-year" value="${edu?.year || ''}">
      </div>
    `;
    div.querySelector('.btn-remove')?.addEventListener('click', () => div.remove());
    eduContainer.appendChild(div);
  }

  function addExperience(exp?: Partial<Experience>) {
    const div = document.createElement('div');
    div.className = 'dynamic-entry';
    div.innerHTML = `
      <div class="dynamic-entry-header">
        <button type="button" class="btn btn-danger btn-sm btn-remove">Remove</button>
      </div>
      <div class="form-group">
        <label>Company *</label>
        <input type="text" name="exp-company" value="${exp?.company || ''}" required>
      </div>
      <div class="form-group">
        <label>Role *</label>
        <input type="text" name="exp-role" value="${exp?.role || ''}" required>
      </div>
      <div class="form-group">
        <label>Duration *</label>
        <input type="text" name="exp-duration" value="${exp?.duration || ''}" required>
      </div>
      <div class="form-group">
        <label>Bullet Points (One per line) *</label>
        <textarea name="exp-bullets" rows="4" required>${(exp?.bullets || []).join('\n')}</textarea>
      </div>
    `;
    div.querySelector('.btn-remove')?.addEventListener('click', () => div.remove());
    expContainer.appendChild(div);
  }

  function addProject(proj?: Partial<Project>) {
    const div = document.createElement('div');
    div.className = 'dynamic-entry';
    div.innerHTML = `
      <div class="dynamic-entry-header">
        <button type="button" class="btn btn-danger btn-sm btn-remove">Remove</button>
      </div>
      <div class="form-group">
        <label>Title *</label>
        <input type="text" name="proj-title" value="${proj?.title || ''}" required>
      </div>
      <div class="form-group">
        <label>Description *</label>
        <textarea name="proj-description" rows="3" required>${proj?.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Tech Stack (Comma separated)</label>
        <input type="text" name="proj-stack" value="${(proj?.stack || []).join(', ')}">
      </div>
      <div class="form-group">
        <label>Link URL</label>
        <input type="url" name="proj-link" value="${proj?.link || ''}">
      </div>
    `;
    div.querySelector('.btn-remove')?.addEventListener('click', () => div.remove());
    projContainer.appendChild(div);
  }

  document.getElementById('btn-add-education')?.addEventListener('click', () => addEducation());
  document.getElementById('btn-add-experience')?.addEventListener('click', () => addExperience());
  document.getElementById('btn-add-project')?.addEventListener('click', () => addProject());

  async function loadData() {
    try {
      const profile = await ProfileService.getProfile();
      if (profile) {
        (document.getElementById('name') as HTMLInputElement).value = profile.personal.name;
        (document.getElementById('email') as HTMLInputElement).value = profile.personal.email;
        (document.getElementById('phone') as HTMLInputElement).value = profile.personal.phone || '';
        (document.getElementById('linkedin') as HTMLInputElement).value = profile.personal.linkedin || '';
        (document.getElementById('github') as HTMLInputElement).value = profile.personal.github || '';
        (document.getElementById('portfolio') as HTMLInputElement).value = profile.personal.portfolio || '';

        (document.getElementById('skills') as HTMLTextAreaElement).value = profile.skills.join(', ');

        profile.education.forEach(edu => addEducation(edu));
        profile.experience.forEach(exp => addExperience(exp));
        profile.projects.forEach(proj => addProject(proj));
      }

      // Ensure at least one entry exists
      if (eduContainer.children.length === 0) addEducation();
      if (expContainer.children.length === 0) addExperience();
      if (projContainer.children.length === 0) addProject();

      const settings = await ChromeStorageService.getSettings();
      (document.getElementById('dailyLimit') as HTMLInputElement).value = settings.dailyApplicationLimit.toString();
      (document.getElementById('geminiApiKey') as HTMLInputElement).value = settings.geminiApiKey || '';
    } catch (e) {
      console.error(e);
      showAlert('Failed to load profile data.', 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const skillsStr = formData.get('skills') as string;
    const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(s => s) : [];

    const education = Array.from(eduContainer.querySelectorAll('.dynamic-entry')).map(entry => ({
      degree: (entry.querySelector('[name="edu-degree"]') as HTMLInputElement).value,
      university: (entry.querySelector('[name="edu-university"]') as HTMLInputElement).value,
      cgpa: (entry.querySelector('[name="edu-cgpa"]') as HTMLInputElement).value,
      year: (entry.querySelector('[name="edu-year"]') as HTMLInputElement).value,
    }));

    const experience = Array.from(expContainer.querySelectorAll('.dynamic-entry')).map(entry => ({
      company: (entry.querySelector('[name="exp-company"]') as HTMLInputElement).value,
      role: (entry.querySelector('[name="exp-role"]') as HTMLInputElement).value,
      duration: (entry.querySelector('[name="exp-duration"]') as HTMLInputElement).value,
      bullets: (entry.querySelector('[name="exp-bullets"]') as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(s => s),
    }));

    const projects = Array.from(projContainer.querySelectorAll('.dynamic-entry')).map(entry => ({
      title: (entry.querySelector('[name="proj-title"]') as HTMLInputElement).value,
      description: (entry.querySelector('[name="proj-description"]') as HTMLTextAreaElement).value,
      stack: (entry.querySelector('[name="proj-stack"]') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(s => s),
      link: (entry.querySelector('[name="proj-link"]') as HTMLInputElement).value,
    }));

    const payload = {
      personal: {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        linkedin: formData.get('linkedin') as string,
        github: formData.get('github') as string,
        portfolio: formData.get('portfolio') as string,
      },
      skills,
      education,
      experience,
      projects,
    };

    try {
      await ProfileService.saveProfile(payload);
      await ChromeStorageService.updateSettings({
        dailyApplicationLimit: parseInt(formData.get('dailyLimit') as string, 10),
        geminiApiKey: formData.get('geminiApiKey') as string,
      });
      showAlert('Profile saved successfully!', 'success');
    } catch (error) {
      if (error instanceof ZodError) {
        showAlert(`Validation Error: ${error.issues[0]?.message}`, 'error');
      } else {
        showAlert('An unexpected error occurred.', 'error');
        console.error(error);
      }
    }
  });

  deleteBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete your profile? This cannot be undone.')) {
      try {
        await ProfileService.deleteProfile();
        form.reset();
        eduContainer.innerHTML = '';
        expContainer.innerHTML = '';
        projContainer.innerHTML = '';
        addEducation();
        addExperience();
        addProject();
        showAlert('Profile deleted.', 'success');
      } catch (e) {
        console.error(e);
        showAlert('Failed to delete profile.', 'error');
      }
    }
  });

  // Init
  await loadData();
}

// ── Resume Manager ─────────────────────────────────────────────────────────

export async function initResumeManager(): Promise<void> {
  const resumeList = document.getElementById('resume-list') as HTMLDivElement;
  const formContainer = document.getElementById('resume-form-container') as HTMLDivElement;
  const resumeForm = document.getElementById('resume-form') as HTMLFormElement;
  const nameInput = document.getElementById('resume-name') as HTMLInputElement;
  const templateSelect = document.getElementById('resume-template') as HTMLSelectElement;
  const editIdInput = document.getElementById('resume-edit-id') as HTMLInputElement;
  const btnNew = document.getElementById('btn-new-resume') as HTMLButtonElement;
  const btnCancel = document.getElementById('btn-cancel-resume') as HTMLButtonElement;
  const btnExportPdf = document.getElementById('btn-export-pdf') as HTMLButtonElement;
  const btnExportHtml = document.getElementById('btn-export-html') as HTMLButtonElement;
  const btnTailor = document.getElementById('btn-tailor-resume') as HTMLButtonElement;
  const jdInput = document.getElementById('jd-input') as HTMLTextAreaElement;
  const versionList = document.getElementById('version-list') as HTMLDivElement;
  const previewPanel = document.getElementById('resume-preview-panel') as HTMLDivElement;
  const previewFrame = document.getElementById('resume-preview-frame') as HTMLIFrameElement;
  const previewBadge = document.getElementById('preview-template-badge') as HTMLSpanElement;

  // Tracks the sections of the resume currently being edited/previewed
  let currentSections: ResumeSection[] = [];

  // ── Preview ───────────────────────────────────────────────────────────────

  function updatePreview(): void {
    const name = nameInput.value.trim() || 'New Resume';
    const templateId = templateSelect.value as TemplateId;

    // Build a temporary resume from current form state (preserving sections)
    const previewResume: Resume = {
      name,
      templateId,
      sections: currentSections,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const renderer = RendererFactory.create(templateId);
    previewFrame.srcdoc = renderer.render(previewResume);

    // Update badge
    if (templateId === 'modern') {
      previewBadge.textContent = 'Modern';
      previewBadge.className = 'resume-badge resume-badge-modern';
    } else {
      previewBadge.textContent = 'ATS Classic';
      previewBadge.className = 'resume-badge resume-badge-ats';
    }

    previewPanel.classList.remove('hidden');
  }

  function hidePreview(): void {
    previewPanel.classList.add('hidden');
    previewFrame.srcdoc = '';
    currentSections = [];
  }

  // ── Exports ───────────────────────────────────────────────────────────────

  btnExportPdf.addEventListener('click', async () => {
    try {
      const name = nameInput.value.trim() || 'Resume';
      const templateId = templateSelect.value as TemplateId;
      const previewResume: Resume = { name, templateId, sections: currentSections, createdAt: Date.now(), updatedAt: Date.now() };
      
      const pdfBytes = await generatePdf(previewResume);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      alert('Failed to generate PDF. See console for details.');
    }
  });

  btnExportHtml.addEventListener('click', () => {
    try {
      const name = nameInput.value.trim() || 'Resume';
      const templateId = templateSelect.value as TemplateId;
      const previewResume: Resume = { name, templateId, sections: currentSections, createdAt: Date.now(), updatedAt: Date.now() };
      
      const renderer = RendererFactory.create(templateId);
      const html = renderer.render(previewResume);
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate HTML:', e);
      alert('Failed to generate HTML.');
    }
  });

  // ── Form helpers ──────────────────────────────────────────────────────────

  async function renderVersions(resumeId: number) {
    const versions = await ResumeService.listVersions(resumeId);
    versionList.innerHTML = '';
    if (versions.length === 0) {
      versionList.innerHTML = '<p class="hint" style="font-size: 0.75rem;">No versions yet. Save to create a snapshot.</p>';
      return;
    }
    
    versions.sort((a, b) => b.createdAt - a.createdAt).forEach(v => {
      const div = document.createElement('div');
      div.style.padding = '0.5rem';
      div.style.borderBottom = '1px solid #e5e7eb';
      div.style.cursor = 'pointer';
      
      const date = new Date(v.createdAt).toLocaleString();
      div.innerHTML = `
        <div style="font-weight: bold;">${v.label}</div>
        <div style="color: #6b7280;">${date}</div>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.25rem; font-size: 0.7rem; padding: 0.1rem 0.3rem;">Restore</button>
      `;
      
      const btn = div.querySelector('button');
      if (btn) {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('Restore this version? Unsaved changes will be lost.')) {
            currentSections = v.snapshot.sections;
            nameInput.value = v.snapshot.name;
            templateSelect.value = v.snapshot.templateId;
            updatePreview();
          }
        });
      }
      
      versionList.appendChild(div);
    });
  }

  async function showResumeForm(resume?: Resume) {
    if (resume) {
      editIdInput.value = String(resume.id);
      nameInput.value = resume.name;
      templateSelect.value = resume.templateId;
      currentSections = resume.sections;
      (document.getElementById('btn-save-resume') as HTMLButtonElement).textContent = 'Update Resume';
      await renderVersions(resume.id!);
    } else {
      editIdInput.value = '';
      nameInput.value = '';
      templateSelect.value = 'modern';
      currentSections = [];
      (document.getElementById('btn-save-resume') as HTMLButtonElement).textContent = 'Save Resume';
      versionList.innerHTML = '<p class="hint" style="font-size: 0.75rem;">No versions yet. Save to create a snapshot.</p>';
    }
    jdInput.value = '';
    formContainer.classList.remove('hidden');
    updatePreview();
    nameInput.focus();
  }

  function hideResumeForm() {
    formContainer.classList.add('hidden');
    resumeForm.reset();
    editIdInput.value = '';
    hidePreview();
  }

  // ── Live preview wiring ───────────────────────────────────────────────────

  nameInput.addEventListener('input', () => updatePreview());
  templateSelect.addEventListener('change', () => updatePreview());

  // ── List rendering ────────────────────────────────────────────────────────

  function getTemplateBadgeClass(templateId: string): string {
    return templateId === 'modern' ? 'resume-badge-modern' : 'resume-badge-ats';
  }

  function getTemplateLabel(templateId: string): string {
    return templateId === 'modern' ? 'Modern' : 'ATS Classic';
  }

  async function renderResumeList() {
    const resumes = await ResumeService.listResumes();
    const emptyHint = resumeList.querySelector('.resume-empty-hint');

    resumeList.querySelectorAll('.resume-row').forEach(el => el.remove());

    if (resumes.length === 0) {
      if (emptyHint) (emptyHint as HTMLElement).style.display = '';
      return;
    }

    if (emptyHint) (emptyHint as HTMLElement).style.display = 'none';

    resumes.forEach(resume => {
      const row = document.createElement('div');
      row.className = 'resume-row';
      row.dataset.resumeId = String(resume.id);
      const createdDate = new Date(resume.createdAt).toLocaleDateString();
      const updatedDate = new Date(resume.updatedAt).toLocaleDateString();
      row.innerHTML = `
        <div class="resume-row-info">
          <span class="resume-name">${resume.name}</span>
          <span class="resume-badge ${getTemplateBadgeClass(resume.templateId)}">${getTemplateLabel(resume.templateId)}</span>
          <span class="resume-meta">Created ${createdDate} · Updated ${updatedDate}</span>
        </div>
        <div class="resume-row-actions">
          <button type="button" class="btn btn-secondary btn-sm btn-edit-resume" data-id="${resume.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm btn-delete-resume" data-id="${resume.id}">Delete</button>
        </div>
      `;
      resumeList.appendChild(row);
    });

    resumeList.querySelectorAll('.btn-edit-resume').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt((btn as HTMLElement).dataset.id || '0', 10);
        const resume = await ResumeService.getResume(id);
        if (resume) showResumeForm(resume);
      });
    });

    resumeList.querySelectorAll('.btn-delete-resume').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt((btn as HTMLElement).dataset.id || '0', 10);
        if (confirm('Delete this resume? This cannot be undone.')) {
          await ResumeService.deleteResume(id);
          hideResumeForm();
          await renderResumeList();
        }
      });
    });
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  btnTailor.addEventListener('click', async () => {
    const jdText = jdInput.value.trim();
    if (!jdText) return alert('Please paste a Job Description first.');
    
    const settings = await ChromeStorageService.getSettings();
    if (!settings.geminiApiKey) {
      return alert('Please configure your Gemini API Key in Settings first.');
    }

    const originalText = btnTailor.textContent;
    btnTailor.textContent = 'Tailoring...';
    btnTailor.disabled = true;

    try {
      const provider = new GeminiProvider(settings.geminiApiKey);
      const service = new TailoringService(provider);
      
      const previewResume: Resume = { 
        name: nameInput.value.trim() || 'Resume', 
        templateId: templateSelect.value as TemplateId, 
        sections: currentSections, 
        createdAt: Date.now(), 
        updatedAt: Date.now() 
      };

      const tailored = await service.tailorResume(previewResume, jdText);
      currentSections = tailored.sections;
      updatePreview();
      
      // Auto-save a snapshot so they can revert if needed
      const editId = editIdInput.value ? parseInt(editIdInput.value, 10) : null;
      if (editId) {
         await ResumeService.updateResume(editId, { sections: currentSections });
         await ResumeService.createVersion(editId, 'AI Tailored Snapshot');
         await renderVersions(editId);
      }
      
      alert('Tailoring complete! Review the live preview.');
    } catch (e) {
      console.error(e);
      alert('Tailoring failed. Check console.');
    } finally {
      btnTailor.textContent = originalText;
      btnTailor.disabled = false;
    }
  });

  btnNew.addEventListener('click', () => showResumeForm());
  btnCancel.addEventListener('click', hideResumeForm);

  resumeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const templateId = templateSelect.value as TemplateId;
    const editId = editIdInput.value ? parseInt(editIdInput.value, 10) : null;

    if (!name) {
      nameInput.focus();
      return;
    }

    try {
      if (editId !== null) {
        await ResumeService.updateResume(editId, { name, templateId });
        // Auto-snapshot on every save
        await ResumeService.createVersion(editId, `Saved ${new Date().toLocaleString()}`);
      } else {
        const created = await ResumeService.createResume({ name, templateId, sections: [] });
        // Snapshot the initial state
        await ResumeService.createVersion(created.id!, 'Initial version');
      }
      hideResumeForm();
      await renderResumeList();
    } catch (error) {
      console.error('Failed to save resume:', error);
    }
  });

  await renderResumeList();
}

document.addEventListener('DOMContentLoaded', async () => {
  await initOptions();
  await initResumeManager();
});
