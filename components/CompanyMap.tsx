export function CompanyMap() {
  return (
    <section className="company-map" aria-labelledby="company-map-heading">
      <div className="company-map-heading">
        <h2 id="company-map-heading">Our Location</h2>
        <a
          className="button"
          href="https://maps.app.goo.gl/P1YyVHoCdGBd9ef37"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
        </a>
      </div>
      <iframe
        title="Cowinmotors company location in Quzhou, China"
        src="https://www.google.com/maps?q=28.965204,118.839750&z=16&hl=en&output=embed"
        width="1180"
        height="420"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </section>
  );
}
