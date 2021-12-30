const displayMap = locations => {
  mapboxgl.accessToken = 'pk.eyJ1Ijoiam9obnNuZWVkNTY3OCIsImEiOiJja3hvcXBlcnYyOGZmMnFwZWhyamFxdXVtIn0.ZwlEDxe06H4LDjeG0kc9zg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/johnsneed5678/ckxotrrmtpx0i15nsskxdbtaa',
    scrollZoom: false
    //center: locations[0].coordinates,
    //zoom: 10,
    //interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';
    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map);
    //Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    //Extend map bounds to include current location
    bounds.extend(loc.coordinates);

  map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
      }
    });
  });
}

export default displayMap;
