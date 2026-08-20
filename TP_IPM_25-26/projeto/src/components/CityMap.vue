<template>
  <iframe
    class="city-map"
    :src="mapUrl"
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
  ></iframe>
</template>

<script>
export default {
  name: "CityMap",
  props: {
    city: {
      type: String,
      required: true
    }
  },
  computed: {
    mapUrl() {
      const coords = {
        Lisboa: "38.7223,-9.1393",
        Porto: "41.1579,-8.6291",
        Barcelona: "41.3851,2.1734",
        Madrid: "40.4168,-3.7038",
        Londres: "51.5074,-0.1278",
        Paris: "48.8566,2.3522"
      }

      const c = coords[this.city]
      return c
        ? `https://www.google.com/maps?q=${c}&z=12&output=embed`
        : ""
    }
  }
}
</script>

<style scoped>
.city-map {
  display: block;
  width: 100%;
  height: 180px;
  border: none;
  border-radius: 8px;
}
</style>
