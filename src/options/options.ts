import { ProfileService } from '../features/profile/profile.service';
import { ChromeStorageService } from '../core/storage/chrome';
import { ZodError } from 'zod';
import type { Education, Experience, Project } from '../core/types/profile';

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
      (document.getElementById('nvidiaApiKey') as HTMLInputElement).value = settings.nvidiaApiKey || '';
      (document.getElementById('dailyLimit') as HTMLInputElement).value = settings.dailyApplicationLimit.toString();
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
        nvidiaApiKey: formData.get('nvidiaApiKey') as string,
        dailyApplicationLimit: parseInt(formData.get('dailyLimit') as string, 10),
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

document.addEventListener('DOMContentLoaded', initOptions);

