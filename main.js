import { getProjectsFromStorage, saveProject, updateProject, deleteProjectFromStorage } from './storage.js';
import { createLinkInputRow, renderMediaHTML } from './ui.js';

// Элементы интерфейса
const projectForm = document.getElementById('project-form');
const linksFormContainer = document.getElementById('links-form-container');
const addLinkFieldBtn = document.getElementById('add-link-field-btn');
const projectsListContainer = document.getElementById('projects-list-container');
const profileView = document.getElementById('profile-view');
const detailsView = document.getElementById('details-view');
const backBtn = document.getElementById('back-btn');

// Элементы зоны загрузки
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const hiddenImageInput = document.getElementById('proj-image-base64');
const dropZoneText = document.getElementById('drop-zone-text');

let editModeId = null;

// --- ЛОГИКА DRAG & DROP ДЛЯ ФАЙЛОВ ---
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#8a2be2';
    dropZone.style.background = '#1a0f24';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#3dac78';
    dropZone.style.background = '#160d1f';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#3dac78';
    dropZone.style.background = '#160d1f';
    if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processFile(e.target.files[0]);
});

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Система принимает только изображения!');
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком тяжелый для локального лога. Сожмите его до 2МБ.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64String = event.target.result;
        hiddenImageInput.value = base64String;
        imagePreview.src = base64String;
        imagePreviewContainer.style.display = 'block';
        dropZoneText.innerText = `✓ Файл загружен: ${file.name}`;
        dropZone.style.borderColor = '#8a2be2';
    };
    reader.readAsDataURL(file);
}

// --- УПРАВЛЕНИЕ ФОРМОЙ ССЫЛОК ---
addLinkFieldBtn.addEventListener('click', () => createLinkInputRow(linksFormContainer));

// --- СБОР ДАННЫХ И ОТПРАВКА ФОРМЫ ---
projectForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const title = document.getElementById('proj-title').value;
    const desc = document.getElementById('proj-desc').value;
    const status = document.getElementById('proj-status').value;

    const resources = [];

    const uploadedImage = hiddenImageInput.value;
    if (uploadedImage) {
        resources.push({ type: 'image', url: uploadedImage });
    }

    const rows = linksFormContainer.querySelectorAll('.link-input-row');
    rows.forEach(row => {
        const type = row.querySelector('.link-type-select').value;
        const url = row.querySelector('.link-url-input').value;
        if (url) resources.push({ type, url });
    });

    if (editModeId) {
        updateProject(editModeId, { title, desc, status, resources });
        editModeId = null;
        projectForm.querySelector('button').innerText = 'Добавить';
    } else {
        const id = Date.now().toString();
        saveProject({ id, title, desc, status, resources });
    }

    // Сброс UI в дефолт
    projectForm.reset();
    hiddenImageInput.value = '';
    imagePreviewContainer.style.display = 'none';
    dropZoneText.innerText = '⤓ Перетащи сюда арт (PNG/JPG) или кликни для загрузки';
    dropZone.style.borderColor = '#3dac78';
    linksFormContainer.innerHTML = '';
    
    loadProfile();
});

// ---ОТРИСОВКА ИНТЕРФЕЙСА ---
function loadProfile() {
    projectsListContainer.innerHTML = '';
    const projects = getProjectsFromStorage();

    if (projects.length === 0) {
        projectsListContainer.innerHTML = '<p style="color: #555;">Архив пуст. Сигналов нет.</p>';
        return;
    }

    projects.forEach(project => {
        const shortCard = document.createElement('div');
        shortCard.className = `project-card ${project.status}`;
        shortCard.style.cursor = 'pointer';
        shortCard.innerHTML = `<h3>${project.title} <small style="font-size: 12px;">[${project.status.toUpperCase()}]</small></h3>`;
        
        shortCard.addEventListener('click', () => showProjectDetails(project.id));
        projectsListContainer.appendChild(shortCard);
    });
}

function showProjectDetails(projectId) {
    const projects = getProjectsFromStorage();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    detailsView.innerHTML = `
        <div class="project-details-content" style="border: 1px solid #3dac78; padding: 30px; background: #160d1f; border-radius: 8px; box-shadow: 0 0 15px rgba(61,172,120,0.2);">
            <h1 style="color: #3dac78; margin-top: 0;">${project.title}</h1>
            <p><strong>Статус системы:</strong> <span class="status-badge" style="color: #8a2be2;">${project.status}</span></p>
            <hr style="border-color: #8a2be2; margin: 20px 0;">
            
            <h3 style="color: #d8f3dc;">Бортовой журнал / Анализ:</h3>
            <p style="white-space: pre-wrap; color: #d8f3dc; background: #0c0512; padding: 15px; border-radius: 4px; border: 1px solid #3a2254;">${project.desc}</p>
            
            <h3 style="color: #d8f3dc; margin-top: 30px;">Прикрепленные ресурсы:</h3>
            <div class="project-resources-render-zone">
                ${renderMediaHTML(project.resources) || '<p style="color: #555;">Ресурсы не прикреплены.</p>'}
            </div>
            
            <div class="control-panel" style="margin-top: 40px; display: flex; gap: 15px;">
                <button id="edit-btn" style="background-color: #8a2be2; color: white; padding: 10px 20px;">Редактировать лог</button>
                <button id="delete-btn" style="background-color: #ff3333; color: white; padding: 10px 20px;">Уничтожить данные</button>
            </div>
        </div>
    `;

    profileView.style.display = 'none';
    detailsView.style.display = 'block';
    backBtn.style.display = 'block';

    document.getElementById('delete-btn').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите безвозвратно удалить этот проект?')) {
            deleteProjectFromStorage(projectId);
            backToProfile();
            loadProfile();
        }
    });

    document.getElementById('edit-btn').addEventListener('click', () => startEditing(project));
}

function startEditing(project) {
    document.getElementById('proj-title').value = project.title;
    document.getElementById('proj-desc').value = project.desc;
    document.getElementById('proj-status').value = project.status;

    linksFormContainer.innerHTML = '';
    if (project.resources) {
        project.resources.forEach(res => {
            if (res.type !== 'image' || !res.url.startsWith('data:image')) {
                createLinkInputRow(linksFormContainer, res.type, res.url);
            } else {
                hiddenImageInput.value = res.url;
                imagePreview.src = res.url;
                imagePreviewContainer.style.display = 'block';
                dropZoneText.innerText = `✓ Картинка восстановлена из лога`;
            }
        });
    }

    editModeId = project.id;
    projectForm.querySelector('button').innerText = 'Сохранить изменения';
    backToProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToProfile() {
    profileView.style.display = 'block';
    detailsView.style.display = 'none';
    backBtn.style.display = 'none';
}

backBtn.addEventListener('click', backToProfile);

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});