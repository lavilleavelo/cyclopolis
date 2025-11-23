export default class LogoControl {
  _container: HTMLDivElement;
  _image: HTMLImageElement;
  _src: string;
  _alt: string;
  _width: number;
  _height: number;

  constructor({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
    this._src = src;
    this._alt = alt;
    this._width = width;
    this._height = height;
  }

  onAdd() {
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-logo-control maplibregl-ctrl';

    this._image = document.createElement('img');
    this._image.src = this._src;
    this._image.alt = this._alt;
    this._image.width = this._width;
    this._image.height = this._height;
    this._image.decoding = 'async';
    this._image.draggable = false;
    this._image.style.userSelect = 'none';

    // on click, go to the logo's website in a new tab
    this._image.style.cursor = 'pointer';
    this._image.onclick = () => {
      window.open('https://lavilleavelo.org/', '_blank');
    };

    this._container.appendChild(this._image);

    this._container.style.magin = 0;

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
}
