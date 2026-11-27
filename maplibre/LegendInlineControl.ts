import { createApp, type Component } from 'vue';

export default class LegendInlineControl {
  _container!: HTMLDivElement;
  _app: ReturnType<typeof createApp> | null = null;

  constructor(
    private vueComponent: Component,
    private props: Record<string, unknown> = {},
  ) {}

  onAdd() {
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl';

    this._app = createApp(this.vueComponent, this.props);
    this._app.mount(this._container);

    return this._container;
  }

  onRemove() {
    if (this._app) {
      this._app.unmount();
    }
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
}
