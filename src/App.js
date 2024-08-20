import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import customerAccounts from "./earthquakes.geojson";

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [coordinates, setCoordinates] = useState();

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoicmhleXBvZ2kiLCJhIjoiY20wMmYybW5tMDBpNTJqb3JvYTZjYWludSJ9.muEBzCe8YyI1bZatYU0wKw";

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [120.20008552927487, 14.934168555739369],
      zoom: 16,
    });

    const markera = new mapboxgl.Marker({
      draggable: true,
    })
      .setLngLat([120.20008552927487, 14.934168555739369])
      .addTo(mapRef.current);

    function onDragEnd() {
      const lngLat = markera.getLngLat();
      setCoordinates([`Longitude: ${lngLat.lng}`, `Latitude: ${lngLat.lat}`]);
    }

    markera.on("dragend", onDragEnd);

    mapRef.current.on("load", () => {
      mapRef.current.addSource("earthquakes", {
        type: "geojson",
        data: customerAccounts,
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 50,
      });

      mapRef.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "earthquakes",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            100,
            "#f1f075",
            750,
            "#f28cb1",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            100,
            30,
            750,
            40,
          ],
        },
      });

      mapRef.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "earthquakes",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });

      mapRef.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "earthquakes",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#11b4da",
          "circle-radius": 6,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });

      // inspect a cluster on click
      mapRef.current.on("click", "clusters", (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        mapRef.current
          .getSource("earthquakes")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      // When a click event occurs on a feature in
      // the unclustered-point layer, open a popup at
      // the location of the feature, with
      // description HTML from its properties.
      mapRef.current.on("click", "unclustered-point", (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const mag = e.features[0].properties.mag;
        const account = e.features[0].properties.id;
        const tsunami = e.features[0].properties.tsunami === 1 ? "yes" : "no";

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        alert("CLicked");

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`magnitude: ${mag}<br>Account Number: ${account}`)
          .addTo(mapRef.current);
      });

      mapRef.current.on("mouseenter", "clusters", () => {
        mapRef.current.getCanvas().style.cursor = "pointer";
      });
      mapRef.current.on("mouseleave", "clusters", () => {
        mapRef.current.getCanvas().style.cursor = "pointer";
      });
    });

    // return () => mapRef.current.remove();
  }, []);

  const handleSearchClick = () => {
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    // Add a marker at the specified coordinates
    new mapboxgl.Marker({ color: "orange" })
      .setLngLat(coordinates)
      .addTo(mapRef.current);

    // Center the map on the marker's coordinates
    mapRef.current.setCenter(coordinates).setZoom(18);
  };

  return (
    <div>
      <div ref={mapContainerRef} style={{ height: "750px" }}>
        {/* Adjust height as needed */}
      </div>
      <div
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          color: "#fff",
          position: "absolute",
          bottom: "130px",
          left: "10px",
          padding: "5px 10px",
          margin: 0,
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: "11px",
          lineHeight: "18px",
          borderRadius: "3px",
          display: coordinates ? "block" : "none",
        }}
      >
        {coordinates &&
          coordinates.map((coord) => (
            <p style={{ marginBottom: 0 }}>{coord}</p>
          ))}
      </div>
      <input
        type="text"
        placeholder="Enter latitude"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter longitude"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
      />

      <button
        onClick={handleSearchClick}
        style={{ border: "2px solid blue", marginTop: "10px" }}
      >
        Search
      </button>
    </div>
  );
};

export default MapboxExample;
