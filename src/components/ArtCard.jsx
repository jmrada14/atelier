function ArtCard({ artwork, onArchive }) {
  const handleArchive = () => {
    onArchive(artwork.id)
  }

  return (
    <div className={`art-card ${artwork.archived ? 'art-card--archived' : ''}`}>
      <div className="art-card__image-container">
        <img
          src={artwork.thumbnailUrl}
          alt={artwork.title}
          className="art-card__thumbnail"
        />
        {artwork.archived && (
          <span className="art-card__archived-badge">Archived</span>
        )}
      </div>

      <div className="art-card__content">
        <h3 className="art-card__title">{artwork.title}</h3>

        <div className="art-card__details">
          <p>
            <span className="art-card__label">Medium</span>
            <br />
            {artwork.medium}
          </p>
          <p>
            <span className="art-card__label">Year</span>
            <br />
            {artwork.yearCompleted}
          </p>
          <p>
            <span className="art-card__label">Price</span>
            <br />
            ${artwork.price.toLocaleString()}
          </p>
          <p>
            <span className="art-card__label">Location</span>
            <br />
            {artwork.location}
          </p>
        </div>

        <div className="art-card__actions">
          <a
            href={artwork.highResUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="art-card__download-link"
            download
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            High-Res
          </a>

          <button
            onClick={handleArchive}
            className="art-card__archive-btn"
          >
            {artwork.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArtCard
