import styled from "@emotion/styled";
import { Sidebar } from "./components/sidebar";
import dynamic from "next/dynamic";
import { gql, useQuery } from "@apollo/client";
import { Mountain } from "../src/types";

const GridColums = styled.div`
  display: grid;
  grid-template-columns: 15% 85%;
  background-color: #ffffff;
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
    }
  }
`;

const GridRow = styled.div`
  display: grid;
  grid-template-rows: 90% 10%;
  outline-color: #474747;
  border-radius: 5;
  border-color: black;
`;

const AppContainer = styled.div`
  overflow: hidden;
`;

function App() {
  const { data, loading, error } = useQuery(AllMountainsQuery);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  return (
    <AppContainer>
      <GridColums>
        <Sidebar />
      </GridColums>
    </AppContainer>
  );
}

export default App;
