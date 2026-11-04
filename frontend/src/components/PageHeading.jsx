const PageHeading = ({ eyebrow, title, subtitle }) => (
  <div className="page-heading">
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </div>
);

export default PageHeading;
