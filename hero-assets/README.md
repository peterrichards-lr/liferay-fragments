# Hero Assets

## Hero Video

A hero banner with a video background. With this fragment you can customise the hero text and video controls, including removing the controls all together. You can also specify if the video should autoplay, be muted and / or loop.

## Overlay Background

A overlay background for a hero banner. You can control the colour of the overlay and opacity (alpha) of the overlay. This fragment makes use of the matchMedia() method and Liferay Adaptive Media to load the right image size.

The overlay colour can be specified in hex or using CSS variables.

In order to use this fragment in unauthenticated pages, you need to update a Service Access Policy to allow access to __com.liferay.headless.delivery.internal.resource.v1_0.DocumentResourceImpl#getDocument__