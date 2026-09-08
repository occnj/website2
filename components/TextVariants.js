// Keep each state's wording in the page so the visual editor can edit it
// without submitting a form or waiting for a livestream to start.
export default function TextVariants({ id, active, variants }) {
  return Object.entries(variants).map(([key, text]) => (
    <span key={key} data-cms-scope={`${id}-${key}`} hidden={active !== key}>{text}</span>
  ));
}
