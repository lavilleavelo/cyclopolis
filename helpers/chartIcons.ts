/* eslint-disable @typescript-eslint/no-explicit-any */
const bikeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;

const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

const ICON_SIZE = 28;

export function addShareChartIcons(chart: any, mode: 'monthly' | 'yearly') {
  if (!chart.customIcons) chart.customIcons = [];

  const { plotLeft, plotTop, plotWidth, plotHeight } = chart;

  const carLeft = mode === 'monthly' ? plotLeft + 30 : plotLeft + 70;
  const bikeRight = mode === 'monthly' ? plotLeft + plotWidth - ICON_SIZE - 20 : plotLeft + plotWidth - ICON_SIZE - 80;
  const bikeBottom = mode === 'monthly' ? plotTop + plotHeight - ICON_SIZE - 10 : plotTop + plotHeight - ICON_SIZE - 10;

  const carDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(carSvg)}`;
  const bikeDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bikeSvg)}`;

  const carIcon = chart.renderer
    .image(carDataUri, carLeft, plotTop + 10, ICON_SIZE, ICON_SIZE)
    .attr({ zIndex: 5 })
    .add();
  chart.customIcons.push(carIcon);

  const bikeIcon = chart.renderer
    .image(bikeDataUri, bikeRight, bikeBottom, ICON_SIZE, ICON_SIZE)
    .attr({ zIndex: 5 })
    .add();
  chart.customIcons.push(bikeIcon);
}

export function destroyChartIcons(chart: any) {
  if (chart.customIcons) {
    chart.customIcons.forEach((icon: any) => {
      try {
        icon.destroy();
      } catch {
        /* already destroyed */
      }
    });
    chart.customIcons = [];
  }
}
