// Art inventory data store
// In a real app, this would be backed by a database

const initialArtworks = [
  {
    id: 1,
    title: "Sunset Over the Valley",
    medium: "Oil on canvas",
    yearCompleted: 2023,
    price: 1200,
    location: "Studio A",
    thumbnailUrl: "https://picsum.photos/seed/art1/300/300",
    highResUrl: "https://picsum.photos/seed/art1/2000/2000",
    archived: false,
  },
  {
    id: 2,
    title: "Urban Reflections",
    medium: "Acrylic on panel",
    yearCompleted: 2024,
    price: 850,
    location: "Gallery Downtown",
    thumbnailUrl: "https://picsum.photos/seed/art2/300/300",
    highResUrl: "https://picsum.photos/seed/art2/2000/2000",
    archived: false,
  },
  {
    id: 3,
    title: "Morning Mist",
    medium: "Watercolor",
    yearCompleted: 2022,
    price: 450,
    location: "Private Collection",
    thumbnailUrl: "https://picsum.photos/seed/art3/300/300",
    highResUrl: "https://picsum.photos/seed/art3/2000/2000",
    archived: true,
  },
  {
    id: 4,
    title: "Abstract Flow",
    medium: "Mixed media",
    yearCompleted: 2024,
    price: 1500,
    location: "Studio A",
    thumbnailUrl: "https://picsum.photos/seed/art4/300/300",
    highResUrl: "https://picsum.photos/seed/art4/2000/2000",
    archived: false,
  },
  {
    id: 5,
    title: "Portrait Study #12",
    medium: "Charcoal on paper",
    yearCompleted: 2023,
    price: 300,
    location: "Storage",
    thumbnailUrl: "https://picsum.photos/seed/art5/300/300",
    highResUrl: "https://picsum.photos/seed/art5/2000/2000",
    archived: false,
  },
]

// Load from localStorage or use initial data
export function loadArtworks() {
  const stored = localStorage.getItem('artworks')
  if (stored) {
    return JSON.parse(stored)
  }
  return initialArtworks
}

// Save to localStorage
export function saveArtworks(artworks) {
  localStorage.setItem('artworks', JSON.stringify(artworks))
}
