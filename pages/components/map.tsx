import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Latlng, Mountain } from "../../src/types";
import { useEffect, useMemo, useState } from "react";
import { latLng, LatLngTuple, Point } from "leaflet";
import React from "react";
import styled from "@emotion/styled";
import SearchBar from "./searchBar";
import * as L from "leaflet";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  latlngMountainState,
  latlngHouseState,
  mountainNameState,
  circleRadiusState,
  cirlceFilterState,
} from "../../state/atoms";
import Routing from "./Routing";
import api from "./api/posts";
import { Autocomplete, Paper, TextField } from "@mui/material";

const GridRow = styled.div`
  display: grid;
  grid-template-rows: 10% 90%;
  outline-color: #474747;
  border-radius: ;
  border-color: black;
`;

const GridColums = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
  background-color: #ffffff;
`;

const iconFilter = L.icon({
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
  iconUrl: "https://unpkg.com/leaflet@1.6/dist/images/marker-icon.png",
});

function MultipleMarkers({ mountainData, radiusValue, houseLatlngValue }) {
  const decimalDegreeLat = houseLatlngValue.lat * (Math.PI / 180);
  const decimalDegreeLng = houseLatlngValue.lng * (Math.PI / 180);
  console.log(mountainData);
  console.log(decimalDegreeLat);
  console.log(decimalDegreeLng);
  var newMpuntainData: Array<Mountain> = [];

  const [mountainLatlng, setMountainLatlng] =
    useRecoilState(latlngMountainState);
  const [mountainNameRecoil, setMountainNameRecoil] =
    useRecoilState(mountainNameState);

  mountainData.mountains.forEach((e) => {
    const p = 0.017453292519943295; // Math.PI / 180
    if (
      12742 *
        Math.asin(
          Math.sqrt(
            0.5 -
              Math.cos((e.lat - houseLatlngValue.lat) * p) / 2 +
              (Math.cos(houseLatlngValue.lat * p) *
                Math.cos(e.lat * p) *
                (1 - Math.cos((e.lon - houseLatlngValue.lng) * p))) /
                2
          )
        ) <=
      radiusValue
    ) {
      console.log("hehehe");
      newMpuntainData.push(e);
    }
  });

  return newMpuntainData.map((m) => {
    return (
      <Marker
        key={m.ogc_fid}
        position={L.latLng(m.lat, m.lon)}
        icon={iconFilter}
        eventHandlers={{
          click: (e) => {
            setMountainLatlng(L.latLng(m.lat, m.lon));
            setMountainNameRecoil(m.navn);
          },
        }}
      >
        <Popup>
          {m.navn} er {m.h_yde} meter
        </Popup>
      </Marker>
    );
  });
}

const MountainMap = ({ mapData }) => {
  let mapDataArray: Array<Mountain> = mapData.mountains.map(
    (mountain: Mountain) => ({
      ogc_fid: mountain.ogc_fid,
      h_yde: mountain.h_yde,
      lat: mountain.lat,
      lon: mountain.lon,
      navn: mountain.navn,
      wkb_geometry: mountain.wkb_geometry,
    })
  );

  let DefaultIcon = L.icon({
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [2, -40],
    iconUrl: "https://unpkg.com/leaflet@1.6/dist/images/marker-icon.png",
  });

  L.Marker.prototype.options.icon = DefaultIcon;
  const findMountain = (fid: number) => {
    return mapDataArray.find((e) => e.ogc_fid == fid);
  };

  const biggestMountain: Mountain = findMountain(1);

  const [map, setMap] = useState(null);
  const [mountainLatlng, setMountainLatlng] =
    useRecoilState(latlngMountainState);
  const [mountainNameRecoil, setMountainNameRecoil] =
    useRecoilState(mountainNameState);

  const circleRadius = useRecoilValue(circleRadiusState);
  const showingAllMountains = useRecoilValue(cirlceFilterState);

  const [mountainStateLatlng, setMountainStateLatlng] = useState(
    L.latLng(0, 0)
  );
  const [mountainInfo, setMountainInfo] = useState("");

  // Address states
  const [options, setOptions] = useState([]);
  const [houselatLng, setHouse] = useState();
  const [inputValue, setInputValue] = useState("");
  const [clickValue, setClickValue] = useState("");
  const [choosenValue, setChoosenValue] = useState("");
  const [circleMountainEvent, setCircleMountainEvent] = useState(true);

  // UseEffect

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(
          `https://ws.geonorge.no/adresser/v1/sok?side=0&treffPerSide=10&asciiKompatibel=true&utkoordsys=4258&sok=${inputValue}`
        );
        const adresser = response.data.adresser;
        setOptions(adresser.map((a) => `${a.adressetekst}, ${a.kommunenavn}`));
        // if (clickValue) {
        //   const latlng = adresser.map((a) =>
        //     L.latLng(a.representasjonspunkt.lat, a.representasjonspunkt.lon)
        //   );
        //   setHouse(latlng);
        //   console.log("Dette er house latlng");
        //   console.log(houselatLng);
        // }
        // console.log("Dette er value " + houselatLng);
      } catch (err) {
        if (err.response) {
          console.log(err.response.data);
        } else {
          console.log(`error is ${err.message}`);
        }
      }
    };
    fetchData();
  }, [inputValue]);

  // UseMemo
  useMemo(() => {
    const fetchAdress = async () => {
      try {
        const response = await api.get(
          `https://ws.geonorge.no/adresser/v1/sok?side=0&treffPerSide=10&asciiKompatibel=true&utkoordsys=4258&sok=${choosenValue}`
        );
        const adresser = response.data.adresser;
        console.log("USEMEMO");
        console.log(adresser);
        if (choosenValue) {
          const latlng = adresser.map((a) =>
            L.latLng(a.representasjonspunkt.lat, a.representasjonspunkt.lon)
          );
          setHouse(latlng);
          console.log("Dette er clickvalue");
          console.log(houselatLng);
        }
      } catch (err) {
        if (err.response) {
          console.log(err.response.data);
        } else {
          console.log(`error is ${err.message}`);
        }
      }
    };
    fetchAdress();
  }, [choosenValue]);

  async function handleMapButton(newMountain: Mountain) {
    await map.panTo(latLng(newMountain.lat, newMountain.lon));
  }

  const handleMountainChange = (e) => {
    const newMountain = findMountain(e.target.value);
    handleMapButton(newMountain);
    // setMountainLatlng(L.latLng(newMountain.lat, newMountain.lon));
    setMountainStateLatlng(L.latLng(newMountain.lat, newMountain.lon));
    console.log("Her er state mountain" + mountainLatlng);
    setMountainInfo(`${newMountain.navn} er ${newMountain.h_yde} MOH`);
    // setMountainNameRecoil(newMountain.navn);
  };

  return (
    <GridRow>
      <GridColums>
        <select
          onChange={handleMountainChange}
          style={{
            height: "inherit",
            borderRadius: "0px",
            border: "solid",
            borderColor: "black",
            backgroundColor: "#add8e6",
          }}
          placeholder="Fjell"
        >
          {mapDataArray.map((mountain: Mountain) => (
            <option
              value={mountain.ogc_fid}
              key={mountain.ogc_fid}
              placeholder="Fjell"
              style={{ borderColor: "grey" }}
            >
              {mountain.navn}
            </option>
          ))}
        </select>
        <Autocomplete
          id="combo-box-demo"
          placeholder="Adresse"
          options={options}
          onChange={(event: any, newValue: string) => {
            // setClickValue(newValue);
            // console.log("Clickvalue");
            // console.log(clickValue);
            setChoosenValue(newValue);
            console.log("New value");
            console.log(choosenValue);
          }}
          size="medium"
          PaperComponent={({ children }) => (
            <Paper
              style={{ background: "#add8e6", backgroundColor: "#add8e6" }}
              elevation={10}
            >
              {children}
            </Paper>
          )}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          style={{
            width: "inherit",
            paddingBottom: "0%",
            height: "inherit",
            backgroundColor: "#add8e6",
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              onChange={({ target }) => setClickValue(target.value)}
              placeholder="Adresse"
              variant="outlined"
              InputLabelProps={{
                style: { color: "white" },
              }}
              style={{
                height: "100%",
                display: "grid",
                borderRadius: "0px",
              }}
            />
          )}
        />
      </GridColums>
      <MapContainer
        center={[biggestMountain.lat, biggestMountain.lon]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        whenCreated={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mountainStateLatlng && (
          <Marker position={mountainStateLatlng}>
            <Popup>{mountainInfo}</Popup>
          </Marker>
        )}
        {houselatLng && mountainStateLatlng && (
          <Routing sourceCity={houselatLng} destinationCity={mountainLatlng} />
        )}
        {houselatLng && circleMountainEvent && (
          <Circle center={houselatLng[0]} radius={circleRadius * 1000} />
        )}
        {houselatLng && circleMountainEvent && (
          <MultipleMarkers
            mountainData={mapData}
            radiusValue={circleRadius}
            houseLatlngValue={houselatLng[0]}
          />
        )}
      </MapContainer>
    </GridRow>
  );
};

export default MountainMap;
