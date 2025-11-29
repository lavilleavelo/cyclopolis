<template>
  <a class="text-sm" target="_blank" rel="noopener noreferrer" :href="url.toString()">Voir sur Google Street View</a>
</template>

<script setup>
/**
 * The params string corresponds to what's visible in the first
 * part of the path URL of Google Street View
 * @example 45.7727386,4.810561,3a,75y,180h,90t
 * - latitude 45.7727386
 * - longitude 4.810561
 * - fov 75
 * - heading 180
 * - pitch 90
 */
const { params } = defineProps({
  params: { type: String, required: true },
});

const url = new URL('https://www.google.com/maps/@?api=1&map_action=pano');

const [latitude, longitude, , fov, heading, pitch] = params.split(',');

url.searchParams.append('viewpoint', `${latitude},${longitude}`);

/**
 * heading: Indicates the compass heading of the camera in degrees clockwise from North.
 * Accepted values are from -180 to 360 degrees.
 * If omitted, a default heading is chosen based on the viewpoint (if specified) of the query and the actual location of the image.
 */
if (heading) {
  url.searchParams.append('heading', heading.slice(0, -1));
}
/**
 * pitch: Specifies the angle, up or down, of the camera.
 * The pitch is specified in degrees from -90 to 90.
 * Positive values will angle the camera up, while negative values will angle the camera down.
 * The default pitch of 0 is set based on on the position of the camera when the image was captured.
 * Because of this, a pitch of 0 is often, but not always, horizontal.
 * For example, an image taken on a hill will likely exhibit a default pitch that is not horizontal.
 */
if (pitch) {
  url.searchParams.append('pitch', Number(pitch.slice(0, -1)) - 90);
}
/**
 * fov: Determines the horizontal field of view of the image.
 * The field of view is expressed in degrees, with a range of 10 - 100.
 * It defaults to 90. When dealing with a fixed-size viewport, the field of view is considered the zoom level,
 * with smaller numbers indicating a higher level of zoom.
 */
if (fov) {
  url.searchParams.append('fov', fov.slice(0, -1));
}
</script>
