export default class LegendControl {
  _btn: HTMLButtonElement;
  _container: HTMLDivElement;
  _onClick: () => void;

  constructor({ onClick }: { onClick: () => void }) {
    this._onClick = onClick;
  }

  onAdd() {
    this._btn = document.createElement('button');
    this._btn.className = 'maplibregl-info maplibregl-ctrl-icon';
    this._btn.type = 'button';
    this._btn.title = 'Légende';
    this._btn.onclick = () => this._onClick();

    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl-group mapbox-ctrl-group maplibregl-ctrl mapboxgl-ctrl';
    this._container.appendChild(this._btn);

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
}
