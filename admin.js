const form = document.querySelector('#ride-form');
const rideList = document.querySelector('#admin-ride-list');
const completedList = document.querySelector('#admin-completed-list');
const notice = document.querySelector('#admin-notice');
const preview = document.querySelector('#image-preview');
const previewPlaceholder = document.querySelector('#preview-placeholder');
const imageFile = document.querySelector('#ride-file');
let uploadedImage = '';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function(character) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
  });
}

function showNotice(message, isError) {
  notice.textContent = message;
  notice.classList.toggle('error', Boolean(isError));
}

function readCollections() {
  return window.TNMWARideStore.load();
}

function saveCollections(collections) {
  if (window.TNMWARideStore.save(collections)) return true;
  showNotice('Could not save. The browser storage may be full; try a smaller photo.', true);
  return false;
}

function dateLabel(startDate, endDate) {
  if (!startDate && endDate) return new Date(endDate + 'T00:00:00').toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
  const start = new Date(startDate + 'T00:00:00');
  if (Number.isNaN(start.getTime())) return 'Date to be announced';
  const options = {day:'2-digit', month:'short', year:'numeric'};
  if (startDate === endDate) return start.toLocaleDateString('en-GB', options);
  if (!endDate) return start.toLocaleDateString('en-GB', options);
  const end = new Date(endDate + 'T00:00:00');
  if (Number.isNaN(end.getTime())) return start.toLocaleDateString('en-GB', options);
  return start.toLocaleDateString('en-GB', options) + ' – ' + end.toLocaleDateString('en-GB', options);
}

function rideRow(ride, section) {
  const isCompleted = section === 'completed';
    return '<article class="admin-ride-row"><img src="' + escapeHtml(ride.image) + '" alt=""><div class="admin-ride-copy"><b>' + escapeHtml(ride.title) + '</b><span>' + escapeHtml(dateLabel(ride.startDate, ride.endDate)) + ' · ' + escapeHtml(ride.type || (isCompleted ? 'Completed ride' : '')) + '</span><small>' + escapeHtml(ride.route || ride.details || '') + '</small></div><div class="row-actions"><button type="button" data-action="edit' + (isCompleted ? '-completed' : '') + '" data-id="' + escapeHtml(ride.id) + '">Edit</button><button type="button" class="delete-action" data-action="delete-' + section + '" data-id="' + escapeHtml(ride.id) + '">Delete</button></div></article>';
}

function renderRides() {
  const collections = readCollections();
  document.querySelector('#ride-count').textContent = collections.upcoming.length;
  rideList.innerHTML = collections.upcoming.length
    ? collections.upcoming.map(function(ride) { return rideRow(ride, 'upcoming'); }).join('')
    : '<div class="admin-empty"><span>🏍</span><b>No upcoming rides</b><small>Add a ride with a future end date to show it here.</small></div>';
  completedList.innerHTML = collections.completed.length
    ? collections.completed.map(function(ride) { return rideRow(ride, 'completed'); }).join('')
    : '<div class="admin-empty compact-empty"><b>No completed rides yet</b></div>';
}

function setPreview(url) {
  const value = url.trim();
  if (!value) {
    preview.removeAttribute('src');
    preview.hidden = true;
    previewPlaceholder.hidden = false;
    return;
  }
  preview.src = value;
}

function compressImage(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onerror = function() { reject(new Error('The selected photo could not be read.')); };
    reader.onload = function() {
      const image = new Image();
      image.onerror = function() { reject(new Error('Choose a valid image file.')); };
      image.onload = function() {
        const maxEdge = 1400;
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        } catch (error) {
          reject(new Error('The selected photo could not be resized.'));
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

preview.addEventListener('load', function() {
  preview.hidden = false;
  previewPlaceholder.hidden = true;
});
preview.addEventListener('error', function() {
  preview.hidden = true;
  previewPlaceholder.hidden = false;
  previewPlaceholder.textContent = 'Image could not be loaded';
});
document.querySelector('#ride-image').addEventListener('input', function() {
  uploadedImage = '';
  imageFile.value = '';
  document.querySelector('#upload-status').textContent = 'Photos are resized before saving in this browser.';
  setPreview(this.value);
});

imageFile.addEventListener('change', async function() {
  const file = this.files && this.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showNotice('Choose an image file such as JPG, PNG or WebP.', true);
    this.value = '';
    return;
  }
  document.querySelector('#upload-status').textContent = 'Resizing ' + file.name + '…';
  try {
    uploadedImage = await compressImage(file);
    document.querySelector('#ride-image').value = '';
    setPreview(uploadedImage);
    document.querySelector('#upload-status').textContent = file.name + ' is ready to save.';
    showNotice('Photo ready. Save the ride to publish it.');
  } catch (error) {
    uploadedImage = '';
    this.value = '';
    document.querySelector('#upload-status').textContent = 'Photos are resized before saving in this browser.';
    showNotice(error.message, true);
  }
});

function resetForm() {
  form.reset();
  uploadedImage = '';
  document.querySelector('#ride-id').value = '';
  document.querySelector('#ride-bucket').value = 'upcoming';
  document.querySelector('#form-title').textContent = 'Add a ride';
  document.querySelector('#save-ride').textContent = 'Save ride';
  document.querySelector('#cancel-edit').hidden = true;
  document.querySelector('#upload-status').textContent = 'Photos are resized before saving in this browser.';
  previewPlaceholder.textContent = 'Image preview';
  setPreview('');
}

document.querySelector('#new-ride').addEventListener('click', function() {
  resetForm();
  document.querySelector('#ride-title').focus();
});
document.querySelector('#cancel-edit').addEventListener('click', resetForm);

form.addEventListener('submit', async function(event) {
  event.preventDefault();
  const startDate = document.querySelector('#ride-start').value;
  const endDate = document.querySelector('#ride-end').value;
  if (endDate && endDate < startDate) {
    showNotice('The end date must be the same as or later than the start date.', true);
    return;
  }
  const currentId = document.querySelector('#ride-id').value;
  const collections = readCollections();
  const existing = collections.upcoming.concat(collections.completed).find(function(item) { return item.id === currentId; });
  const imageUrl = document.querySelector('#ride-image').value.trim();
  const image = uploadedImage || imageUrl || (existing && existing.image) || '';
  if (!image) {
    showNotice('Add a photo URL or choose a photo from your device.', true);
    return;
  }
  const title = document.querySelector('#ride-title').value.trim();
  const ride = {
    id: currentId || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'ride-' + Date.now()),
    title: title,
    startDate: startDate,
    endDate: endDate,
    type: document.querySelector('#ride-type').value.trim(),
    route: document.querySelector('#ride-route').value.trim(),
    details: document.querySelector('#ride-details').value.trim(),
    image: image,
    alt: document.querySelector('#ride-alt').value.trim() || title
  };
  const wasEditing = Boolean(currentId);
  collections.upcoming = collections.upcoming.filter(function(item) { return item.id !== ride.id; });
  collections.completed = collections.completed.filter(function(item) { return item.id !== ride.id; });
  const lastRideDay = ride.endDate || ride.startDate;
  const today = new Date();
  const todayString = [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
  const isPastRide = lastRideDay < todayString;
  if (isPastRide) collections.completed.unshift(ride);
  else collections.upcoming.push(ride);
  if (saveCollections(collections)) {
    renderRides();
    resetForm();
    showNotice(isPastRide ? 'Ride saved to completed rides because its end date has passed.' : (wasEditing ? 'Ride updated. The home page now shows the new details.' : 'Ride added. The home page now shows it.'));
  }
});

rideList.addEventListener('click', handleRideAction);
completedList.addEventListener('click', handleRideAction);

function handleRideAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const collections = readCollections();
  const isCompleted = button.dataset.action.endsWith('completed');
  const source = isCompleted ? collections.completed : collections.upcoming;
  const ride = source.find(function(item) { return item.id === button.dataset.id; });
  if (!ride) return;

  if (button.dataset.action.startsWith('edit')) {
    document.querySelector('#ride-id').value = ride.id;
    document.querySelector('#ride-bucket').value = isCompleted ? 'completed' : 'upcoming';
    document.querySelector('#ride-title').value = ride.title;
    document.querySelector('#ride-start').value = ride.startDate || ride.endDate;
    document.querySelector('#ride-end').value = ride.startDate ? (ride.endDate || '') : '';
    document.querySelector('#ride-type').value = ride.type || '';
    document.querySelector('#ride-route').value = ride.route || '';
    document.querySelector('#ride-details').value = ride.details || '';
    document.querySelector('#ride-image').value = ride.image && !ride.image.startsWith('data:') ? ride.image : '';
    document.querySelector('#ride-alt').value = ride.alt || '';
    uploadedImage = ride.image && ride.image.startsWith('data:') ? ride.image : '';
    document.querySelector('#form-title').textContent = isCompleted ? 'Edit completed ride' : 'Edit ride';
    document.querySelector('#save-ride').textContent = 'Update ride';
    document.querySelector('#cancel-edit').hidden = false;
    setPreview(ride.image || '');
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }

  const label = button.dataset.action === 'delete-completed' ? 'completed rides' : 'upcoming rides';
  if (!window.confirm('Delete “' + ride.title + '” from ' + label + '?')) return;
  if (isCompleted) collections.completed = collections.completed.filter(function(item) { return item.id !== ride.id; });
  else collections.upcoming = collections.upcoming.filter(function(item) { return item.id !== ride.id; });
  if (saveCollections(collections)) {
    renderRides();
    showNotice('Ride deleted.');
  }
}

document.querySelector('#restore-rides').addEventListener('click', function() {
  if (!window.confirm('Replace the upcoming ride list with the sample rides?')) return;
  const collections = readCollections();
  collections.upcoming = window.DEFAULT_RIDES.slice();
  if (saveCollections(collections)) {
    resetForm();
    renderRides();
    showNotice('Sample upcoming rides restored.');
  }
});

renderRides();
window.addEventListener('pageshow', renderRides);
window.addEventListener('storage', function(event) {
  if (event.key === window.TNMWA_RIDE_KEYS.upcoming || event.key === window.TNMWA_RIDE_KEYS.completed) renderRides();
});
window.setInterval(renderRides, 60000);
