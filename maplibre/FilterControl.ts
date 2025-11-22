export default class FilterControl {
  _btn: HTMLButtonElement;
  _container: HTMLDivElement;
  _onClick: () => void;
  _indicator: HTMLSpanElement;

  constructor({ onClick }: { onClick: () => void }) {
    this._onClick = onClick;
  }

  onAdd() {
    this._btn = document.createElement('button');
    this._btn.className = 'maplibregl-filter maplibregl-ctrl-icon';
    this._btn.type = 'button';
    this._btn.title = 'Filtres';
    this._btn.onclick = () => this._onClick();
    this._btn.style.position = 'relative';

    this._indicator = document.createElement('span');
    this._indicator.className = 'filter-active-indicator';
    Object.assign(this._indicator.style, {
      display: 'none',
      position: 'absolute',
      top: '3px',
      right: '3px',
      width: '10px',
      height: '10px',
      backgroundColor: '#152B68', // lvv blue 600
      borderRadius: '50%',
      border: '1px solid white',
      zIndex: '1',
    });

    this._btn.appendChild(this._indicator);

    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
    this._container.appendChild(this._btn);

    return this._container;
  }

  setActive(isActive: boolean) {
    if (this._indicator) {
      this._indicator.style.display = isActive ? 'block' : 'none';
    }
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
}
