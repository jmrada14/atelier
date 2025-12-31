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
          <p><span className="art-card__label">Medium:</span> {artwork.medium}</p>
          <p><span className="art-card__label">Year:</span> {artwork.yearCompleted}</p>
          <p><span className="art-card__label">Price:</span> ${artwork.price.toLocaleString()}</p>
          <p><span className="art-card__label">Location:</span> {artwork.location}</p>
        </div>

        <div className="art-card__actions">
          <a
            href={artwork.highResUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="art-card__download-link"
            download
          >
            Download High-Res
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
