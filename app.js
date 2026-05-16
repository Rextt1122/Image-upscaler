const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewImg = document.getElementById('preview-img');
const uploadIcon = document.getElementById('upload-icon');
const uploadText = document.getElementById('upload-text');
const upscaleBtn = document.getElementById('upscale-btn');
const statusOverlay = document.getElementById('status-overlay');
const resultSection = document.getElementById('result-section');
const comparisonContainer = document.querySelector('.comparison-container');
const imgBefore = document.getElementById('img-before');
const imgAfter = document.getElementById('img-after-src');
const sliderHandle = document.querySelector('.slider-handle');
const imgAfterContainer = document.querySelector('.img-after');

const statsInputRes = document.getElementById('input-res');
const statsOutputRes = document.getElementById('output-res');
const statsModelName = document.getElementById('model-name');

let scale = 4;
let model = 'realesrgan-x4plus';
let originalWidth = 0;
let originalHeight = 0;
let startTime;
let timerInterval;
let abortController = null;

// Drag and Drop
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file!');
        return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        uploadIcon.style.display = 'none';
        uploadText.style.display = 'none';

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
            originalWidth = img.width;
            originalHeight = img.height;
            
            // Adjust drop zone aspect ratio
            const aspectRatio = originalWidth / originalHeight;
            dropZone.style.aspectRatio = aspectRatio;
            
            document.getElementById('cancel-btn').style.display = 'block';
            updateStats();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateStats() {
    const scale = document.getElementById('scale-select').value;
    const model = document.getElementById('model-select').options[document.getElementById('model-select').selectedIndex].text;
    
    statsInputRes.textContent = `${originalWidth} x ${originalHeight}`;
    statsOutputRes.textContent = `${originalWidth * scale} x ${originalHeight * scale}`;
    statsModelName.textContent = model;

    // Zoom preview of original image (to show pixels)
    const previewContainer = document.getElementById('size-preview-container');
    const previewBox = document.getElementById('size-preview-box');
    const previewText = document.getElementById('size-preview-text');
    const upscaledWrapper = document.getElementById('upscaled-zoom-wrapper');
    
    if (originalWidth > 0) {
        previewContainer.style.display = 'flex';
        upscaledWrapper.style.display = 'none'; // Hide until processed

        previewBox.style.backgroundImage = `url(${previewImg.src})`;
        previewBox.style.backgroundSize = `${originalWidth * 4}px ${originalHeight * 4}px`;
        
        previewText.innerHTML = `<strong>Resolusi Target:</strong> ${originalWidth * scale} x ${originalHeight * scale}`;
    }
}

document.getElementById('scale-select').addEventListener('change', updateStats);
document.getElementById('model-select').addEventListener('change', updateStats);

async function processImage() {
    if (!currentFile) {
        alert('Please upload an image first!');
        return;
    }

    const scale = document.getElementById('scale-select').value;
    const model = document.getElementById('model-select').value;

    upscaleBtn.textContent = 'Memproses...';
    upscaleBtn.disabled = true;
    statusOverlay.style.display = 'flex';
    document.getElementById('cancel-btn').style.display = 'block';

    // Start Timer
    const timerDisplay = document.getElementById('process-timer');
    startTime = Date.now();
    timerDisplay.textContent = '0.0';
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        timerDisplay.textContent = elapsed.toFixed(1);
    }, 100);

    abortController = new AbortController();
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('scale', scale);
    formData.append('model', model);

    try {
        const response = await fetch('http://localhost:8000/upscale', {
            method: 'POST',
            body: formData,
            signal: abortController.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Server error');
        }

        // Check if response is JSON (error) or Blob (success)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const json = await response.json();
            if (json.error) throw new Error(json.error);
        }

        const blob = await response.blob();
        clearInterval(timerInterval); // Stop timer
        const url = URL.createObjectURL(blob);

        // Setup Comparison
        imgBefore.src = previewImg.src;
        imgAfter.src = url;
        
        // Ensure "after" image matches container width for slider
        const resizeAfter = () => {
            const containerWidth = comparisonContainer.offsetWidth;
            imgAfter.style.width = containerWidth + 'px';
        };
        
        imgAfter.onload = () => {
            resizeAfter();
            resultSection.style.display = 'block';
            
            // Re-initialize slider to middle
            imgAfterContainer.style.width = '50%';
            sliderHandle.style.left = '50%';
            
            // Dual Zoom Update
            const upscaledWrapper = document.getElementById('upscaled-zoom-wrapper');
            const upscaledPreviewBox = document.getElementById('upscaled-preview-box');
            upscaledWrapper.style.display = 'flex';
            upscaledPreviewBox.style.backgroundImage = `url(${url})`;
            upscaledPreviewBox.style.backgroundSize = `${originalWidth * scale * 4}px ${originalHeight * scale * 4}px`;
            
            // Adjust comparison container aspect ratio
            const aspectRatio = originalWidth / originalHeight;
            comparisonContainer.style.aspectRatio = aspectRatio;
            
            resultSection.scrollIntoView({ behavior: 'smooth' });
            
            document.getElementById('download-link').href = url;
            document.getElementById('download-link').download = `upscaled_${scale}x_${currentFile.name}`;
            
            statusOverlay.style.display = 'none';
            document.getElementById('cancel-btn').style.display = 'none';
            upscaleBtn.disabled = false;
            upscaleBtn.textContent = 'Mulai Upscale Sekarang';
        };

        window.addEventListener('resize', resizeAfter);

    } catch (error) {
        clearInterval(timerInterval); // Stop timer on error
        if (error.name === 'AbortError') {
            console.log('Upscale dibatalkan');
        } else {
            alert('Error: ' + error.message);
        }
        statusOverlay.style.display = 'none';
        document.getElementById('cancel-btn').style.display = 'none';
        upscaleBtn.disabled = false;
        upscaleBtn.textContent = 'Mulai Upscale Sekarang';
    }
}

function cancelProcess() {
    if (abortController) {
        abortController.abort();
    }
    // If not processing, just clear the image
    if (!startTime) {
        currentFile = null;
        previewImg.src = '';
        previewImg.style.display = 'none';
        uploadIcon.style.display = 'block';
        uploadText.style.display = 'block';
        document.getElementById('size-preview-container').style.display = 'none';
        document.getElementById('cancel-btn').style.display = 'none';
        dropZone.style.aspectRatio = 'auto';
    }
}

// Comparison Slider Logic
let isResizing = false;

sliderHandle.addEventListener('mousedown', () => isResizing = true);
window.addEventListener('mouseup', () => isResizing = false);
window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const rect = comparisonContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;

    const percentage = (x / rect.width) * 100;
    imgAfterContainer.style.width = percentage + '%';
    sliderHandle.style.left = percentage + '%';
});

// Touch support
sliderHandle.addEventListener('touchstart', () => isResizing = true);
window.addEventListener('touchend', () => isResizing = false);
window.addEventListener('touchmove', (e) => {
    if (!isResizing) return;
    const rect = comparisonContainer.getBoundingClientRect();
    let x = e.touches[0].clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    const percentage = (x / rect.width) * 100;
    imgAfterContainer.style.width = percentage + '%';
    sliderHandle.style.left = percentage + '%';
});

// Click labels to jump
document.getElementById('label-before').addEventListener('click', () => {
    imgAfterContainer.style.transition = 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    sliderHandle.style.transition = 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    imgAfterContainer.style.width = '0%';
    sliderHandle.style.left = '0%';
    setTimeout(() => {
        imgAfterContainer.style.transition = 'none';
        sliderHandle.style.transition = 'none';
    }, 400);
});

document.getElementById('label-after').addEventListener('click', () => {
    imgAfterContainer.style.transition = 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    sliderHandle.style.transition = 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    imgAfterContainer.style.width = '100%';
    sliderHandle.style.left = '100%';
    setTimeout(() => {
        imgAfterContainer.style.transition = 'none';
        sliderHandle.style.transition = 'none';
    }, 400);
});
