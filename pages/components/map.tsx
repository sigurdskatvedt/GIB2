import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Latlng, Mountain, Route } from "../../src/types";
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
} from "../../state/atoms";
import Routing from "./Routing";
import api from "./api/posts";
import { Autocomplete, Paper, TextField } from "@mui/material";
import { gql, useQuery } from "@apollo/client";

const GridRow = styled.div`
        display: grid;
        grid-template-rows: 10% 90%;
        outline-color: #474747;
        border-radius: ;
        border-color: black;
`;

const AllMountainsQuery = gql`
        query {
                mountains {
                        ogc_fid
                        navn
                        wkb_geometry
                        lat
                        lon
                        h_yde
                        route_urls
                }
        }
`;

const GridColums = styled.div`
        display: grid;
        grid-template-columns: 50% 50%;
        background-color: #ffffff;
`;

const MountainMap = ({ mapData }) => {
        let mapDataArray: Array<Mountain> = mapData.mountains.map(
                (mountain: Mountain) => ({
                        ogc_fid: mountain.ogc_fid,
                        h_yde: mountain.h_yde,
                        lat: mountain.lat,
                        lon: mountain.lon,
                        navn: mountain.navn,
                        wkb_geometry: mountain.wkb_geometry,
                        route_urls: mountain.route_urls,
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

        // UseEffect

        useEffect(() => {
                const fetchData = async () => {
                        try {
                                const response = await api.get(
                                        `https://ws.geonorge.no/adresser/v1/sok?side=0&treffPerSide=10&asciiKompatibel=true&utkoordsys=4258&sok=${inputValue}`
                                );
                                const adresser = response.data.adresser;
                                setOptions(
                                        adresser.map(
                                                (a) =>
                                                        `${a.adressetekst}, ${a.kommunenavn}`
                                        )
                                );
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
                                                L.latLng(
                                                        a.representasjonspunkt
                                                                .lat,
                                                        a.representasjonspunkt
                                                                .lon
                                                )
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
                setMountainLatlng(L.latLng(newMountain.lat, newMountain.lon));
                setMountainStateLatlng(
                        L.latLng(newMountain.lat, newMountain.lon)
                );
                console.log("Her er state mountain" + mountainLatlng);
                setMountainInfo(
                        `${newMountain.navn} er ${newMountain.h_yde} MOH`
                );
                setMountainNameRecoil(newMountain.navn);
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
                                        {mapDataArray.map(
                                                (mountain: Mountain) => (
                                                        <option
                                                                value={
                                                                        mountain.ogc_fid
                                                                }
                                                                key={
                                                                        mountain.ogc_fid
                                                                }
                                                                placeholder="Fjell"
                                                                style={{
                                                                        borderColor:
                                                                                "grey",
                                                                }}
                                                        >
                                                                {mountain.navn}
                                                        </option>
                                                )
                                        )}
                                </select>
                                <Autocomplete
                                        id="combo-box-demo"
                                        placeholder="Adresse"
                                        options={options}
                                        onChange={(
                                                event: any,
                                                newValue: string
                                        ) => {
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
                                                        style={{
                                                                background: "#add8e6",
                                                                backgroundColor:
                                                                        "#add8e6",
                                                        }}
                                                        elevation={10}
                                                >
                                                        {children}
                                                </Paper>
                                        )}
                                        onInputChange={(
                                                event,
                                                newInputValue
                                        ) => {
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
                                                        onChange={({
                                                                target,
                                                        }) =>
                                                                setClickValue(
                                                                        target.value
                                                                )
                                                        }
                                                        placeholder="Adresse"
                                                        variant="outlined"
                                                        InputLabelProps={{
                                                                style: {
                                                                        color: "white",
                                                                },
                                                        }}
                                                        style={{
                                                                height: "100%",
                                                                display: "grid",
                                                                borderRadius:
                                                                        "0px",
                                                        }}
                                                />
                                        )}
                                />
                        </GridColums>
                        <MapContainer
                                center={[
                                        biggestMountain.lat,
                                        biggestMountain.lon,
                                ]}
                                zoom={6}
                                scrollWheelZoom={false}
                                style={{ height: "100%", width: "100%" }}
                                whenCreated={setMap}
                        >
                                <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {mountainStateLatlng && !houselatLng && (
                                        <Marker position={mountainStateLatlng}>
                                                <Popup>{mountainInfo}</Popup>
                                        </Marker>
                                )}
                                {houselatLng && mountainStateLatlng && (
                                        <Routing
                                                sourceCity={houselatLng}
                                                destinationCity={
                                                        mountainStateLatlng
                                                }
                                        />
                                )}
                        </MapContainer>
                </GridRow>
        );
};

export default MountainMap;
