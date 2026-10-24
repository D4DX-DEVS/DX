/** Three slow blue lights drifting behind a `.dark-band`. Decoration only; reduced motion holds them still. */
export function BandLights() {
  return (
    <div aria-hidden="true">
      <span className="band-light" />
      <span className="band-light" />
      <span className="band-light" />
    </div>
  );
}
