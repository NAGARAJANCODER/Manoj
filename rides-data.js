window.DEFAULT_RIDES = [
  {
    id: 'varkala-2026', title: 'VARKALA BIKE RIDE 2026',
    startDate: '2026-10-24', endDate: '2026-10-26', type: '3 Days | Group Ride',
    route: 'Coimbatore to Varkala', details: 'Beaches · Rides · Campfire · Stay',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
    alt: 'Coastal mountain road overlooking the sea'
  },
  {
    id: 'keralamkundu-waterfalls-2026', title: 'KERALAMKUNDU WATERFALLS',
    startDate: '2026-11-08', endDate: '', type: '1 Day Ride',
    route: 'Scenic Roads · Waterfalls · Nature', details: 'Perfect for Weekend Escape',
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=85',
    alt: 'Waterfall in a lush green forest'
  },
  {
    id: 'perumal-mudi-2026', title: 'PERUMAL MUDI TREK & RIDE',
    startDate: '2026-11-21', endDate: '', type: '1 Day Ride',
    route: 'Forest Trails · Panoramic Views', details: 'Ride · Trek · Explore',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',
    alt: 'Mountain trail through the Western Ghats'
  }
];

window.DEFAULT_COMPLETED_RIDES = [
  {id:'vagamon-completed',title:'Vagamon Ride',endDate:'2026-06-14',image:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=320&q=80',alt:'Motorcycle ride through the mountains'},
  {id:'varkala-completed',title:'Varkala Ride',endDate:'2026-05-24',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80',alt:'Coastal group ride'},
  {id:'valparai-completed',title:'Valparai Ride',endDate:'2026-04-19',image:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=320&q=80',alt:'Mountain road ride'},
  {id:'waterfall-completed',title:'Waterfall Ride',endDate:'2026-03-08',image:'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=320&q=80',alt:'Waterfall ride through the hills'},
  {id:'yercaud-completed',title:'Yercaud Ride',endDate:'2026-02-22',image:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=320&q=80',alt:'Road trip into the hills'}
];

window.TNMWA_RIDE_KEYS = {upcoming:'tnmwaUpcomingRides', completed:'tnmwaCompletedRides'};
window.TNMWARideStore = {
  load: function() {
    let upcoming = window.DEFAULT_RIDES.slice();
    let completed = window.DEFAULT_COMPLETED_RIDES.slice();
    try {
      const savedUpcoming = localStorage.getItem(window.TNMWA_RIDE_KEYS.upcoming);
      const savedCompleted = localStorage.getItem(window.TNMWA_RIDE_KEYS.completed);
      if (savedUpcoming !== null) upcoming = JSON.parse(savedUpcoming);
      if (savedCompleted !== null) completed = JSON.parse(savedCompleted);
    } catch (error) {
      console.warn('Could not read TNMWA ride data from browser storage.', error);
    }
    if (!Array.isArray(upcoming)) upcoming = window.DEFAULT_RIDES.slice();
    if (!Array.isArray(completed)) completed = window.DEFAULT_COMPLETED_RIDES.slice();
    const collections = {upcoming:upcoming, completed:completed};
    this.archiveExpired(collections);
    return collections;
  },
  save: function(collections) {
    try {
      localStorage.setItem(window.TNMWA_RIDE_KEYS.upcoming, JSON.stringify(collections.upcoming));
      localStorage.setItem(window.TNMWA_RIDE_KEYS.completed, JSON.stringify(collections.completed));
      return true;
    } catch (error) {
      console.error('Could not save TNMWA ride data to browser storage.', error);
      return false;
    }
  },
  archiveExpired: function(collections) {
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
    const completedIds = new Set(collections.completed.map(function(ride){return ride.id;}));
    const stillUpcoming = [];
    let moved = false;
    collections.upcoming.forEach(function(ride) {
      const lastDay = ride.endDate || ride.startDate;
      if (lastDay && lastDay < today) {
        if (!completedIds.has(ride.id)) {
          collections.completed.unshift(ride);
          completedIds.add(ride.id);
        }
        moved = true;
      } else {
        stillUpcoming.push(ride);
      }
    });
    if (moved) {
      collections.upcoming = stillUpcoming;
      this.save(collections);
    }
    return moved;
  }
};
