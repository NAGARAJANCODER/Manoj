const counters = document.querySelectorAll('.count-up');
const rideList = document.querySelector('#upcoming-rides-list');
const completedRideList = document.querySelector('#completed-rides-list');

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function(character) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
  });
}

function rideDateParts(ride) {
  const start = new Date(ride.startDate + 'T00:00:00');
  if (Number.isNaN(start.getTime())) return { day: 'TBA', month: 'DATE TBA' };
  const end = ride.endDate ? new Date(ride.endDate + 'T00:00:00') : null;
  const day = String(start.getDate()).padStart(2, '0');
  let main = day;
  if (end && !Number.isNaN(end.getTime())) {
    const endDay = String(end.getDate()).padStart(2, '0');
    main = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
      ? day + ' – ' + endDay
      : day + ' ' + start.toLocaleString('en', {month:'short'}).toUpperCase() + ' – ' + endDay + ' ' + end.toLocaleString('en', {month:'short'}).toUpperCase();
  }
  return { day: main, month: start.toLocaleString('en', {month:'short'}).toUpperCase() + ' ' + start.getFullYear() };
}

function loadRideCollections() {
  return window.TNMWARideStore ? window.TNMWARideStore.load() : {upcoming:window.DEFAULT_RIDES || [],completed:window.DEFAULT_COMPLETED_RIDES || []};
}

function renderUpcomingRides() {
  const collections = loadRideCollections();
  if (!rideList) return;
  const rides = collections.upcoming;
  if (!Array.isArray(rides) || rides.length === 0) {
    rideList.innerHTML = '<p class="empty-rides">New rides are being planned. Check back soon.</p>';
    return;
  }
  rideList.innerHTML = rides.map(function(ride) {
    const date = rideDateParts(ride);
    return '<article class="ride-card"><a class="ride-photo" href="#rides"><img src="' + escapeHtml(ride.image) + '" alt="' + escapeHtml(ride.alt || ride.title) + '"><span class="date-block"><b>' + escapeHtml(date.day) + '</b><small>' + escapeHtml(date.month) + '</small></span><span class="ride-type">' + escapeHtml(ride.type) + '</span></a><div class="ride-info"><div><h3>' + escapeHtml(ride.title) + '</h3><p>' + escapeHtml(ride.route) + '<br>' + escapeHtml(ride.details) + '</p></div><a class="circle-arrow" href="#rides" aria-label="View ' + escapeHtml(ride.title) + '">›</a></div></article>';
  }).join('');
}

function renderCompletedRides() {
  if (!completedRideList) return;
  const rides = loadRideCollections().completed;
  if (!rides.length) {
    completedRideList.innerHTML = '<p class="empty-rides">Completed ride photos will appear here.</p>';
    return;
  }
  completedRideList.innerHTML = rides.map(function(ride) {
    return '<a href="#completed"><img src="' + escapeHtml(ride.image) + '" alt="' + escapeHtml(ride.alt || ride.title) + '"><b>' + escapeHtml(ride.title) + '</b></a>';
  }).join('');
}

function renderRideSections() {
  renderUpcomingRides();
  renderCompletedRides();
}

renderRideSections();
window.addEventListener('pageshow', renderRideSections);
window.addEventListener('storage', function(event) {
  if (!window.TNMWA_RIDE_KEYS || event.key === window.TNMWA_RIDE_KEYS.upcoming || event.key === window.TNMWA_RIDE_KEYS.completed) renderRideSections();
});
window.setInterval(renderRideSections, 60000);

function animateCount(element) {
  if (element.dataset.started) return;
  element.dataset.started = 'true';

  const target = Number(element.dataset.target);
  const suffix = element.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.floor(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.65 });

  counters.forEach(function(counter) {
    counterObserver.observe(counter);
  });
} else {
  counters.forEach(animateCount);
}

document.querySelectorAll('.tnmwa-links a').forEach(function(link) {
  link.addEventListener('click', function() {
    document.querySelectorAll('.tnmwa-links a').forEach(function(item) {
      item.classList.remove('selected');
    });
    link.classList.add('selected');
  });
});
